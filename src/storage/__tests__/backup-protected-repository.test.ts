import { describe, expect, it, vi } from 'vitest';

import type { PilloRepository } from '../../application/contracts';
import { createDocument } from '../../domain/types';
import { withBackupProtection } from '../backup-protected-repository';

const repositoryFixture = (): PilloRepository => ({
  load: vi.fn(async () => createDocument()),
  save: vi.fn(async () => null),
  close: vi.fn(async () => undefined)
});

describe('repository с защитой от системного backup', () => {
  it('повторно применяет исключение после каждой успешной записи', async () => {
    const repository = repositoryFixture();
    const refreshBackupExclusion = vi.fn(async () => undefined);
    const protectedRepository = withBackupProtection(repository, refreshBackupExclusion);
    const document = createDocument();
    document.revision = 1;

    await protectedRepository.save(document, 0);

    expect(repository.save).toHaveBeenCalledWith(document, 0, undefined);
    expect(refreshBackupExclusion).toHaveBeenCalledOnce();
  });

  it('не маскирует ошибку записи применением исключения', async () => {
    const repository = repositoryFixture();
    const saveError = new Error('disk failure');
    vi.mocked(repository.save).mockRejectedValueOnce(saveError);
    const refreshBackupExclusion = vi.fn(async () => undefined);
    const protectedRepository = withBackupProtection(repository, refreshBackupExclusion);
    const document = createDocument();
    document.revision = 1;

    await expect(protectedRepository.save(document, 0)).rejects.toBe(saveError);
    expect(refreshBackupExclusion).not.toHaveBeenCalled();
  });

  it('сохраняет данные и возвращает предупреждение при отказе обновить защиту', async () => {
    const repository = repositoryFixture();
    const refreshBackupExclusion = vi.fn(async () => { throw new Error('resource values'); });
    const protectedRepository = withBackupProtection(repository, refreshBackupExclusion);
    const document = createDocument();
    document.revision = 1;

    await expect(protectedRepository.save(document, 0)).resolves.toMatchObject({ kind: 'backup-protection' });
  });
});
