import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import type { NotificationGateway } from '../application/contracts';
import { notificationPrefix } from '../application/notification-plan';

const channelId = 'pillo-intakes';
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldPlaySound: true, shouldSetBadge: false, shouldShowBanner: true, shouldShowList: true })
});

export const notificationGateway: NotificationGateway = {
  access: async request => {
    if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync(channelId, {
      name: 'Приём препаратов', importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 150, 250], lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE
    });
    let permission = await Notifications.getPermissionsAsync();
    if (request && !permission.granted && permission.canAskAgain) permission = await Notifications.requestPermissionsAsync();
    const quiet = permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
    const channel = Platform.OS === 'android' ? await Notifications.getNotificationChannelAsync(channelId) : null;
    const blocked = channel?.importance === Notifications.AndroidImportance.NONE;
    return { authorization: blocked ? 'denied' : quiet ? 'quiet' : permission.granted ? 'granted' : 'denied',
      exact: Platform.OS === 'android' ? 'unknown' : 'system' };
  },
  list: async () => (await Notifications.getAllScheduledNotificationsAsync())
    .filter(item => item.identifier.startsWith(notificationPrefix) ||
      (typeof item.content.data?.ruleId === 'string' && typeof item.content.data?.medicationId === 'string'))
    .map(item => ({ id: item.identifier,
      fingerprint: typeof item.content.data?.pilloFingerprint === 'string' ? item.content.data.pilloFingerprint : null })),
  cancel: id => Notifications.cancelScheduledNotificationAsync(id),
  schedule: async job => {
    await Notifications.scheduleNotificationAsync({ identifier: job.id,
      content: { title: 'Pillo', body: 'Время отметить приём препарата', sound: 'default',
        data: { intakeId: job.intakeId, pilloFingerprint: job.fingerprint } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(job.at), channelId }
    });
  }
};
