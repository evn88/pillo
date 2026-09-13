import * as SQLite from 'expo-sqlite';

import type { PilloRepository } from '../application/contracts';
import { createSqliteRepository, prepareDatabase } from './sqlite-repository';

/** Владелец repository закрывает соединение после завершения своих операций. */
export const openVault = async (): Promise<PilloRepository> => {
  const database = await SQLite.openDatabaseAsync('pillo.db', { useNewConnection: true });
  try {
    await prepareDatabase(database);
    await database.execAsync('PRAGMA journal_mode = WAL');
    return createSqliteRepository(database);
  } catch (error) {
    await database.closeAsync();
    throw error;
  }
};
