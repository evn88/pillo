import { beforeEach, describe, expect, it, vi } from 'vitest';

import { openProjectContact } from './project-contact';

const native = vi.hoisted(() => ({ openURL: vi.fn(), alert: vi.fn() }));
vi.mock('react-native', () => ({ Linking: { openURL: native.openURL }, Alert: { alert: native.alert } }));

beforeEach(() => { vi.resetAllMocks(); });

describe('Связь с автором проекта', () => {
  it('открывает письмо на адрес автора без данных пользователя', async () => {
    native.openURL.mockResolvedValue(undefined);

    await openProjectContact();

    expect(native.openURL).toHaveBeenCalledWith('mailto:egor@vershkov.com');
    expect(native.alert).not.toHaveBeenCalled();
  });

  it('показывает адрес, если почтовое приложение недоступно', async () => {
    native.openURL.mockRejectedValue(new Error('No mail app'));

    await openProjectContact();

    expect(native.alert).toHaveBeenCalledWith('Не удалось открыть почту', expect.stringContaining('egor@vershkov.com'));
  });
});
