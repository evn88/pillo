import * as SQLite from 'expo-sqlite';

import { emptySnapshot, type PilloSnapshot } from '@/domain/types';
import type { VaultAvailability, VaultHandle } from './vault-contract';

const DATABASE_NAME = 'pillo.db';
const DATABASE_VERSION = 1;
const configureDatabase = async (database: SQLite.SQLiteDatabase): Promise<void> => {
  await database.execAsync('PRAGMA foreign_keys = ON');
  await database.execAsync('PRAGMA journal_mode = WAL');

  const versionRow = await database.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = versionRow?.user_version ?? 0;

  if (currentVersion < 1) {
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS pillo_state (
        id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1),
        payload TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
    await database.runAsync(
      'INSERT OR IGNORE INTO pillo_state (id, payload, updated_at) VALUES (1, ?, ?)',
      JSON.stringify(emptySnapshot),
      new Date().toISOString()
    );
  }

  await database.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
};

/** На native-платформах данные хранятся в sandbox приложения через SQLite. */
export const getVaultAvailability = async (): Promise<VaultAvailability> => 'ready';

/** Открывает локальную базу без аккаунта и отдельного экрана входа. */
export const openVault = async (): Promise<VaultHandle> => {
  const database = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await configureDatabase(database);

  return {
    load: async () => {
      const row = await database.getFirstAsync<{ payload: string }>(
        'SELECT payload FROM pillo_state WHERE id = 1'
      );
      if (!row) return emptySnapshot;
      return JSON.parse(row.payload) as PilloSnapshot;
    },
    save: async snapshot => {
      await database.runAsync(
        'UPDATE pillo_state SET payload = ?, updated_at = ? WHERE id = 1',
        JSON.stringify(snapshot),
        new Date().toISOString()
      );
    },
    close: () => database.closeAsync()
  };
};
