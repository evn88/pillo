import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';

type PilloDataPrivacyModule = {
  excludePathFromBackupAsync: (path: string) => Promise<void>;
  excludeSQLiteDatabaseFromBackupAsync: (databasePath: string) => Promise<void>;
};

const dataPrivacyModule = requireOptionalNativeModule<PilloDataPrivacyModule>('PilloDataPrivacy');

export const excludeSQLiteDatabaseFromSystemBackup = async (databasePath: string): Promise<void> => {
  if (Platform.OS !== 'ios') return;
  if (!dataPrivacyModule) {
    throw new Error('Для защиты локальной базы на iOS требуется нативная сборка PillDan.');
  }
  await dataPrivacyModule.excludeSQLiteDatabaseFromBackupAsync(databasePath);
};

export const excludePhotoDirectoryFromSystemBackup = async (uri: string): Promise<void> => {
  if (Platform.OS !== 'ios') return;
  if (!dataPrivacyModule?.excludePathFromBackupAsync) throw new Error('Для локального хранения фото обновите нативную сборку приложения.');
  await dataPrivacyModule.excludePathFromBackupAsync(decodeURIComponent(new URL(uri).pathname));
};
