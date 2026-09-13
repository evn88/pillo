import ExpoModulesCore
import Foundation

public final class PilloDataPrivacyModule: Module {
  public func definition() -> ModuleDefinition {
    Name("PilloDataPrivacy")

    AsyncFunction("excludeSQLiteDatabaseFromBackupAsync") { (databasePath: String) in
      try [databasePath, "\(databasePath)-wal", "\(databasePath)-shm"].forEach(excludeFromBackup)
    }
  }

  private func excludeFromBackup(path: String) throws {
    var url = URL(fileURLWithPath: path)
    guard FileManager.default.fileExists(atPath: url.path) else { return }
    var values = URLResourceValues()
    values.isExcludedFromBackup = true
    try url.setResourceValues(values)
  }
}
