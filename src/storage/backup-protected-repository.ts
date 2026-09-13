import type { PilloRepository } from '../application/contracts';

export const withBackupProtection = (
  repository: PilloRepository,
  refreshBackupExclusion: () => Promise<void>
): PilloRepository => ({
  load: repository.load,
  save: async (document, expectedRevision, purgeRecovery) => {
    const warning = await repository.save(document, expectedRevision, purgeRecovery);
    if (warning) return warning;
    try {
      await refreshBackupExclusion();
      return null;
    } catch {
      return {
        kind: 'backup-protection',
        message: 'Изменения сохранены, но iOS не подтвердил исключение базы из системного backup. Перезапустите приложение и повторите проверку.'
      };
    }
  },
  close: repository.close
});
