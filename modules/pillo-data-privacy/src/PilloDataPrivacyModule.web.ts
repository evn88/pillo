import { NativeModule, registerWebModule } from 'expo';

class PilloDataPrivacyModule extends NativeModule<{}> {
  excludeSQLiteDatabaseFromBackupAsync(): Promise<void> {
    return Promise.resolve();
  }
}

export default registerWebModule(PilloDataPrivacyModule, 'PilloDataPrivacy');
