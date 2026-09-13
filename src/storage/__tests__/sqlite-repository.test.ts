/// <reference types="node" />
import { DatabaseSync } from 'node:sqlite';
import { afterEach, describe, expect, it } from 'vitest';

import { createDocument } from '../../domain/types';
import { snapshot } from '../../domain/__tests__/fixtures';
import { createSqliteRepository, prepareDatabase, type SqlDatabase } from '../sqlite-repository';

const connections: DatabaseSync[] = [];
afterEach(() => { connections.splice(0).forEach(database => database.close()); });

const databaseFixture = () => {
  const sqlite = new DatabaseSync(':memory:');
  connections.push(sqlite);
  let failSql: string | null = null;
  const check = (sql: string) => { if (failSql && sql.includes(failSql)) { failSql = null; throw new Error('disk failure'); } };
  const database: SqlDatabase = {
    execAsync: async sql => { check(sql); sqlite.exec(sql); },
    getFirstAsync: async <T,>(sql: string, ...params: (string | number)[]) => {
      check(sql);
      // Граница драйвера SQLite: прикладной decoder отдельно проверяет содержимое строки.
      return (sqlite.prepare(sql).get(...params) as T | undefined) ?? null;
    },
    runAsync: async (sql, ...params) => { check(sql); return { changes: Number(sqlite.prepare(sql).run(...params).changes) }; },
    withExclusiveTransactionAsync: async work => {
      sqlite.exec('BEGIN IMMEDIATE');
      try { await work(database); sqlite.exec('COMMIT'); }
      catch (error) { sqlite.exec('ROLLBACK'); throw error; }
    },
    closeAsync: async () => undefined
  };
  const seedLegacy = (payload = JSON.stringify(snapshot)) => {
    sqlite.exec('CREATE TABLE pillo_state (id INTEGER PRIMARY KEY, payload TEXT NOT NULL, updated_at TEXT NOT NULL); PRAGMA user_version = 1');
    sqlite.prepare('INSERT INTO pillo_state VALUES (1, ?, ?)').run(payload, '2026-09-13');
    return payload;
  };
  return { sqlite, database, seedLegacy, failOnce: (sql: string) => { failSql = sql; } };
};

describe('настоящие SQLite-транзакции repository', () => {
  it('создаёт новую базу и читает валидированный документ', async () => {
    const { database } = databaseFixture();
    await prepareDatabase(database);
    expect(await createSqliteRepository(database).load()).toEqual(createDocument());
  });
  it('мигрирует v1 с точной recovery-копией и сохраняет ID/остатки', async () => {
    const { database, sqlite, seedLegacy } = databaseFixture();
    const payload = seedLegacy();
    await prepareDatabase(database);
    const document = await createSqliteRepository(database).load();
    expect(document.snapshot).toEqual(snapshot);
    expect(sqlite.prepare('SELECT payload FROM pillo_recovery').get()).toMatchObject({ payload });
    expect(sqlite.prepare('PRAGMA user_version').get()).toMatchObject({ user_version: 2 });
    await prepareDatabase(database);
    expect(await createSqliteRepository(database).load()).toEqual(document);
  });
  it('rollback прерванной миграции сохраняет оригинал и версию', async () => {
    const { database, sqlite, seedLegacy, failOnce } = databaseFixture();
    const payload = seedLegacy();
    failOnce('PRAGMA user_version = 2');
    await expect(prepareDatabase(database)).rejects.toThrow();
    expect(sqlite.prepare('PRAGMA user_version').get()).toMatchObject({ user_version: 1 });
    expect(sqlite.prepare('SELECT payload FROM pillo_state').get()).toMatchObject({ payload });
    expect(sqlite.prepare("SELECT name FROM sqlite_master WHERE name='pillo_recovery'").get()).toBeUndefined();
    await prepareDatabase(database);
  });
  it('не понижает будущую версию', async () => {
    const { database, sqlite } = databaseFixture();
    sqlite.exec('PRAGMA user_version = 3');
    await expect(prepareDatabase(database)).rejects.toThrow('не поддерживается');
    expect(sqlite.prepare('PRAGMA user_version').get()).toMatchObject({ user_version: 3 });
  });
  it('не объявляет базу с неизвестной таблицей новой', async () => {
    const { database, sqlite } = databaseFixture();
    sqlite.exec('CREATE TABLE unknown_data (value TEXT)');
    await expect(prepareDatabase(database)).rejects.toThrow('без версии');
  });
  it('не заменяет повреждённый payload пустыми данными', async () => {
    const { database, sqlite, seedLegacy } = databaseFixture();
    seedLegacy('{broken');
    await expect(prepareDatabase(database)).rejects.toThrow();
    expect(sqlite.prepare('SELECT payload FROM pillo_state').get()).toMatchObject({ payload: '{broken' });
  });
  it('не считает отсутствие строки успешной записью', async () => {
    const { database, sqlite } = databaseFixture();
    await prepareDatabase(database);
    sqlite.exec('DELETE FROM pillo_state');
    const repository = createSqliteRepository(database);
    await expect(repository.load()).rejects.toThrow('отсутствует');
    await expect(repository.save({ ...createDocument(), revision: 1 }, 0)).rejects.toThrow('отсутствуют');
  });
  it('защищает от чужой ревизии и атомарно очищает recovery', async () => {
    const { database, sqlite, seedLegacy, failOnce } = databaseFixture();
    seedLegacy();
    await prepareDatabase(database);
    const repository = createSqliteRepository(database);
    const document = await repository.load();
    const next = { ...document, revision: 1 };
    failOnce('DELETE FROM pillo_recovery');
    await expect(repository.save(next, 0, true)).rejects.toThrow();
    expect((await repository.load()).revision).toBe(0);
    await repository.save(next, 0, true);
    expect(sqlite.prepare('SELECT * FROM pillo_recovery').all()).toEqual([]);
    await expect(repository.save(next, 0)).rejects.toThrow('другой операцией');
  });
});
