import { useCallback, useEffect, useRef } from 'react';
import { router } from 'expo-router';

import { parseNotificationResponse, resolveNotificationIntake, type NotificationResponse } from '@/application/notification-response';
import { usePilloContext } from '@/providers/pillo-provider';
import { notificationGateway } from '@/services/notifications.native';

/** Ожидает bootstrap, затем открывает только существующий приём без изменения его статуса. */
export const useNotificationResponseNavigation = () => {
  const { snapshot, status } = usePilloContext();
  const pendingResponse = useRef<NotificationResponse | null>(null);

  const rememberResponse = useCallback((value: unknown) => {
    const response = parseNotificationResponse(value);

    if (response) pendingResponse.current = response;
  }, []);

  useEffect(() => {
    void notificationGateway.getLastResponse().then(rememberResponse).catch(() => undefined);

    return notificationGateway.subscribeResponses(rememberResponse);
  }, [rememberResponse]);

  useEffect(() => {
    const response = pendingResponse.current;

    if (status !== 'unlocked' || !response) return;

    pendingResponse.current = null;
    const intakeId = resolveNotificationIntake(snapshot.intakes.map(intake => intake.id), response);
    if (!intakeId) return;

    router.navigate({ pathname: '/', params: { intakeId } });
  }, [snapshot.intakes, status]);
};
