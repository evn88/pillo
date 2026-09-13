export type NotificationResponse = { intakeId: string };

/** Данные уведомления не являются маршрутом: принимаем только собственный идентификатор приёма. */
export const parseNotificationResponse = (value: unknown): NotificationResponse | null => {
  if (!value || typeof value !== 'object' || !('intakeId' in value)) return null;

  const intakeId = value.intakeId;

  if (typeof intakeId !== 'string' || !intakeId.trim() || intakeId.length > 200) return null;

  return { intakeId };
};

export const resolveNotificationIntake = (intakeIds: readonly string[], response: NotificationResponse): string | null => (
  intakeIds.includes(response.intakeId) ? response.intakeId : null
);
