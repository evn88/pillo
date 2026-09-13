import type { PilloRepository } from '../application/contracts';
import { decodeDocument, migrateLegacyPayload, parseDocument } from '../domain/document-validation';
import { createDocument } from '../domain/types';

export interface SqlConnection {
  execAsync: (sql: string) => Promise<void>;
  getFirstAsync: <T>(sql: string, ...params: (string | number)[]) => Promise<T | null>;
  runAsync: (sql: string, ...params: (string | number)[]) => Promise<{ changes: number }>;
}
export interface SqlDatabase extends SqlConnection {
  withExclusiveTransactionAsync: (work: (transaction: SqlConnection) => Promise<void>) => Promise<void>;
  closeAsync: () => Promise<void>;
}

const readRow = async (database: SqlConnection) => {
  const row = await database.getFirstAsync<{ payload: string; revision: number }>(
    'SELECT payload, revision FROM pillo_state WHERE id = 1'
  );
  if (!row) throw new Error('В базе отсутствует строка данных. Автоматическая очистка не выполнялась.');
  const document = parseDocument(row.payload);
  if (document.revision !== row.revision) throw new Error('Ревизия базы не совпадает с содержимым.');
  return document;
};

/** Миграция и исходный payload сохраняются в одной транзакции, без копирования активного WAL. */
export const prepareDatabase = async (database: SqlDatabase): Promise<void> => {
  const version = await database.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  if (!version || version.user_version > 2 || version.user_version < 0) {
    throw new Error('Эта версия базы не поддерживается. Обновите приложение.');
  }
  if (version.user_version === 2) { await readRow(database); return; }
  await database.withExclusiveTransactionAsync(async transaction => {
    if (version.user_version === 0) {
      const existing = await transaction.getFirstAsync<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' LIMIT 1"
      );
      if (existing) throw new Error('Найдена база без версии. Исходные таблицы сохранены.');
      await transaction.execAsync('CREATE TABLE pillo_state (id INTEGER PRIMARY KEY CHECK (id = 1), payload TEXT NOT NULL, updated_at TEXT NOT NULL, revision INTEGER NOT NULL)');
      await transaction.runAsync('INSERT INTO pillo_state (id, payload, updated_at, revision) VALUES (1, ?, ?, 0)',
        JSON.stringify(createDocument()), new Date().toISOString());
    } else {
      const row = await transaction.getFirstAsync<{ payload: string }>('SELECT payload FROM pillo_state WHERE id = 1');
      if (!row) throw new Error('В существующей базе отсутствуют данные.');
      const document = migrateLegacyPayload(row.payload);
      await transaction.execAsync('CREATE TABLE pillo_recovery (id INTEGER PRIMARY KEY CHECK (id = 1), payload TEXT NOT NULL, schema_version INTEGER NOT NULL)');
      await transaction.runAsync('INSERT INTO pillo_recovery (id, payload, schema_version) VALUES (1, ?, 1)', row.payload);
      await transaction.execAsync('ALTER TABLE pillo_state ADD COLUMN revision INTEGER NOT NULL DEFAULT 0');
      await transaction.runAsync('UPDATE pillo_state SET payload = ? WHERE id = 1', JSON.stringify(document));
    }
    await transaction.execAsync('CREATE TABLE IF NOT EXISTS pillo_recovery (id INTEGER PRIMARY KEY CHECK (id = 1), payload TEXT NOT NULL, schema_version INTEGER NOT NULL)');
    await transaction.execAsync('PRAGMA user_version = 2');
  });
};

export const createSqliteRepository = (database: SqlDatabase): PilloRepository => ({
  load: () => readRow(database),
  save: async (document, expectedRevision, purgeRecovery = false) => {
    const validated = decodeDocument(document);
    if (validated.revision !== expectedRevision + 1) throw new Error('Нарушена последовательность ревизий.');
    await database.withExclusiveTransactionAsync(async transaction => {
      const result = await transaction.runAsync(
        'UPDATE pillo_state SET payload = ?, revision = ?, updated_at = ? WHERE id = 1 AND revision = ?',
        JSON.stringify(validated), validated.revision, new Date().toISOString(), expectedRevision
      );
      if (result.changes !== 1) throw new Error('Данные были изменены другой операцией или отсутствуют. Откройте приложение заново.');
      if (purgeRecovery) await transaction.execAsync('DELETE FROM pillo_recovery');
    });
  },
  close: () => database.closeAsync()
});
