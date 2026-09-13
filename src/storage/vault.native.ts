import * as SQLite from 'expo-sqlite';

import type { PilloRepository } from '../application/contracts';
import { excludeSQLiteDatabaseFromSystemBackup } from './backup-exclusion';
import { withBackupProtection } from './backup-protected-repository';
import { createSqliteRepository, prepareDatabase } from './sqlite-repository';

/** Владелец repository закрывает соединение после завершения своих операций. */
export const openVault = async (): Promise<PilloRepository> => {
  const database = await SQLite.openDatabaseAsync('pillo.db', { useNewConnection: true });
  try {
    await prepareDatabase(database);
    await database.execAsync('PRAGMA journal_mode = WAL');
    const refreshBackupExclusion = () => excludeSQLiteDatabaseFromSystemBackup(database.databasePath);
    await refreshBackupExclusion();
    return withBackupProtection(createSqliteRepository(database), refreshBackupExclusion);
  } catch (error) {
    await database.closeAsync();
    throw error;
  }
};
