import { NativeModule, requireNativeModule } from 'expo';

declare class PilloDataPrivacyModule extends NativeModule<{}> {
  excludeSQLiteDatabaseFromBackupAsync(databasePath: string): Promise<void>;
}

export default requireNativeModule<PilloDataPrivacyModule>('PilloDataPrivacy');
