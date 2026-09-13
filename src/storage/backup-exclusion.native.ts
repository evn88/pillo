import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';

type PilloDataPrivacyModule = {
  excludeSQLiteDatabaseFromBackupAsync: (databasePath: string) => Promise<void>;
};

const dataPrivacyModule = requireOptionalNativeModule<PilloDataPrivacyModule>('PilloDataPrivacy');

export const excludeSQLiteDatabaseFromSystemBackup = async (databasePath: string): Promise<void> => {
  if (Platform.OS !== 'ios') return;
  if (!dataPrivacyModule) {
    throw new Error('Для защиты локальной базы на iOS требуется нативная сборка Pillo.');
  }
  await dataPrivacyModule.excludeSQLiteDatabaseFromBackupAsync(databasePath);
};
