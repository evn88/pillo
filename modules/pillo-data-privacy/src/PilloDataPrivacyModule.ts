import { NativeModule, requireNativeModule } from 'expo';

declare class PilloDataPrivacyModule extends NativeModule<{}> {
  excludePathFromBackupAsync(path: string): Promise<void>;
  excludeSQLiteDatabaseFromBackupAsync(databasePath: string): Promise<void>;
}

export default requireNativeModule<PilloDataPrivacyModule>('PilloDataPrivacy');
