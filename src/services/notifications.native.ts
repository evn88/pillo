import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import { getUpcomingRuleDates } from '@/domain/schedule';
import type { Medication, ScheduleRule } from '@/domain/types';

const CHANNEL_ID = 'pillo-intakes';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true
  })
});

/** Запрашивает разрешение и создаёт канал напоминаний Android. */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Приём препаратов',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 150, 250],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE
    });
  }

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
};

/**
 * Полностью пересоздаёт rolling window локальных уведомлений.
 * В текст уведомления попадает название препарата — пользователь управляет preview на уровне ОС.
 */
export const rescheduleNotifications = async (
  medications: Medication[],
  rules: ScheduleRule[],
  enabled: boolean
): Promise<void> => {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!enabled) return;

  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) throw new Error('Уведомления запрещены в системных настройках');

  const medicationById = new Map(medications.map(medication => [medication.id, medication]));
  const now = new Date();
  const jobs = rules
    .flatMap(rule => {
      const medication = medicationById.get(rule.medicationId);
      if (!medication?.isActive) return [];
      return getUpcomingRuleDates(rule, now, 30).map(date => ({ date, medication, rule }));
    })
    .sort((first, second) => first.date.getTime() - second.date.getTime())
    .slice(0, 60);

  for (const { date, medication, rule } of jobs) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Pillo',
        body: 'Время отметить приём препарата',
        data: { ruleId: rule.id, medicationId: medication.id },
        sound: 'default'
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date,
        channelId: CHANNEL_ID
      }
    });
  }
};
