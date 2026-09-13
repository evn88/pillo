import { describe, expect, it } from 'vitest';

import { parseNotificationResponse, resolveNotificationIntake } from '../notification-response';

describe('ответ на уведомление', () => {
  it('принимает только непустой идентификатор приёма', () => {
    expect(parseNotificationResponse({ intakeId: 'rule-1:2026-09-13' })).toEqual({ intakeId: 'rule-1:2026-09-13' });
    expect(parseNotificationResponse({ intakeId: '' })).toBeNull();
    expect(parseNotificationResponse({ url: '/settings' })).toBeNull();
    expect(parseNotificationResponse({ intakeId: 1 })).toBeNull();
  });

  it('игнорирует устаревшую ссылку, не превращая её в команду статуса', () => {
    const response = parseNotificationResponse({ intakeId: 'removed:2026-09-13' });

    expect(response).not.toBeNull();
    expect(resolveNotificationIntake(['active:2026-09-13'], response!)).toBeNull();
  });
});
