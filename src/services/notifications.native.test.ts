import { beforeEach, describe, expect, it, vi } from 'vitest';

import { notificationGateway } from './notifications.native';

const notifications = vi.hoisted(() => ({ list: vi.fn(), schedule: vi.fn() }));
vi.mock('expo-notifications', () => ({
  setNotificationHandler: vi.fn(),
  getAllScheduledNotificationsAsync: notifications.list,
  scheduleNotificationAsync: notifications.schedule,
  SchedulableTriggerInputTypes: { DATE: 'date' }
}));

beforeEach(() => { vi.resetAllMocks(); });

describe('Переименование уведомлений в PillDan', () => {
  it('требует перепланирования старого заголовка и сохраняет актуальные уведомления', async () => {
    notifications.list.mockResolvedValue([
      { identifier: 'pillo:v2:old', content: { title: 'Pillo', data: { pilloFingerprint: 'same' } } },
      { identifier: 'pillo:v2:new', content: { title: 'PillDan', data: { pilloFingerprint: 'same' } } },
      { identifier: 'unrelated', content: { title: 'Other', data: {} } }
    ]);

    expect(await notificationGateway.list()).toEqual([
      { id: 'pillo:v2:old', fingerprint: null },
      { id: 'pillo:v2:new', fingerprint: 'same' }
    ]);
  });

  it('планирует напоминание с новым брендом и совместимыми данными', async () => {
    const job = { id: 'pillo:v2:intake', intakeId: 'intake', at: '2026-09-15T10:00:00Z', fingerprint: 'fingerprint' };

    await notificationGateway.schedule(job);

    expect(notifications.schedule).toHaveBeenCalledWith({
      identifier: job.id,
      content: { title: 'PillDan', body: 'Время отметить приём препарата', sound: 'default',
        data: { intakeId: job.intakeId, pilloFingerprint: job.fingerprint } },
      trigger: { type: 'date', date: new Date(job.at), channelId: 'pillo-intakes' }
    });
  });
});
