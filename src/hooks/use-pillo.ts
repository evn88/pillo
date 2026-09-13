import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as Crypto from 'expo-crypto';

import type { PilloActions, PilloContextValue, PilloCommand } from '../application/contracts';
import { createInitialState, createPilloController } from '../application/pillo-controller';
import { createCalendarLifecycle } from '../application/calendar-lifecycle';
import { notificationGateway } from '../services/notifications';
import { openVault } from '../storage/vault';

/** React управляет подпиской и lifecycle; команды и persistence принадлежат controller. */
export const usePillo = (): PilloContextValue => {
  const [state, setState] = useState(createInitialState);
  const controllerRef = useRef<ReturnType<typeof createPilloController> | null>(null);
  const disposal = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    const previousDisposal = disposal.current;
    const controller = createPilloController({
      open: async () => { await previousDisposal; return openVault(); },
      notifications: notificationGateway, now: () => new Date()
    });
    controllerRef.current = controller;
    const unsubscribe = controller.subscribe(() => setState(controller.getState()));
    void controller.start();
    const lifecycle = createCalendarLifecycle({
      now: () => new Date(), timezone: () => Intl.DateTimeFormat().resolvedOptions().timeZone,
      refresh: () => { void controller.execute(Crypto.randomUUID(), { type: 'refresh-calendar' }); },
      setTimer: setTimeout, clearTimer: clearTimeout
    });
    const subscription = AppState.addEventListener('change', status => {
      if (status === 'active') lifecycle.resume();
      else lifecycle.pause();
    });
    if (AppState.currentState === 'active') lifecycle.resume(false);
    return () => {
      lifecycle.dispose();
      subscription.remove();
      unsubscribe();
      controllerRef.current = null;
      disposal.current = controller.dispose().catch(() => undefined);
    };
  }, []);

  const [actions] = useState<PilloActions>(() => {
    const execute = (command: PilloCommand, commandId = Crypto.randomUUID()) => controllerRef.current?.execute(commandId, command) ??
      Promise.resolve({ ok: false as const, kind: 'unavailable' as const, message: 'Данные ещё не открыты.' });
    return {
      retry: () => { void controllerRef.current?.start(); },
      retryNotifications: () => controllerRef.current?.requestSync(true),
      createMedicationId: () => Crypto.randomUUID(),
      saveMedication: (input, commandId) => execute({ type: 'save-medication', input }, commandId),
      deleteMedication: medicationId => execute({ type: 'delete-medication', medicationId }),
      addPackage: medicationId => execute({ type: 'add-package', medicationId }),
      saveScheduleRule: (rule, commandId) => execute({ type: 'save-rule', rule: { ...rule, id: rule.id ?? Crypto.randomUUID() } }, commandId),
      deleteScheduleRule: ruleId => execute({ type: 'delete-rule', ruleId }),
      setIntakeStatus: (intakeId, status, legacyStockReturnUnits, commandId) => execute({ type: 'set-intake-status', intakeId, status, legacyStockReturnUnits }, commandId),
      takeMedicationNow: (medicationId, doseUnits, commandId = Crypto.randomUUID()) => execute({ type: 'record-manual', medicationId, doseUnits, intakeId: `manual:${commandId}` }, commandId),
      updateSettings: async settings => {
        const result = await execute({ type: 'update-settings', settings });
        if (result.ok && settings.notificationsEnabled === true) controllerRef.current?.requestSync(true);
        return result;
      },
      clearData: () => execute({ type: 'clear-data' })
    };
  });
  return { ...state, ...actions };
};
