import { applyCommand } from '../domain/commands';
import { addCalendarDays, calendarHorizonDays, extendCoverage, reconcileCalendar } from '../domain/calendar';
import { getLocalDateKey } from '../domain/schedule';
import { createDocument, type PilloDocument } from '../domain/types';
import { DomainError } from '../domain/validation';
import type { CommandResult, NotificationGateway, PilloCommand, PilloRepository, PilloState } from './contracts';
import { buildNotificationPlan } from './notification-plan';

export const createInitialState = (): PilloState => ({
  status: 'checking', snapshot: createDocument().snapshot, calendarCoverage: [], error: null, isSaving: false,
  notificationStatus: 'checking', notificationError: null, notificationAccess: null, coverageEndsAt: null
});

type Dependencies = { open: () => Promise<PilloRepository>; notifications: NotificationGateway; now: () => Date };

export const createPilloController = ({ open, notifications, now }: Dependencies) => {
  let state = createInitialState();
  let document: PilloDocument | null = null;
  let repository: PilloRepository | null = null;
  let disposed = false;
  let queue: Promise<void> = Promise.resolve();
  let worker: Promise<void> | null = null;
  let syncRequested = false;
  let permissionRequested = false;
  let pendingCommands = 0;
  const listeners = new Set<() => void>();
  const publish = (patch: Partial<PilloState>) => {
    if (disposed) return;
    state = { ...state, ...patch };
    listeners.forEach(listener => listener());
  };
  const enqueue = <T,>(work: () => Promise<T>): Promise<T> => {
    const result = queue.then(work);
    queue = result.then(() => undefined, () => undefined);
    return result;
  };
  const persist = async (next: PilloDocument, purgeRecovery = false) => {
    if (!repository || !document) throw new Error('Хранилище не открыто.');
    const warning = await repository.save(next, document.revision, purgeRecovery);
    document = next;
    publish({ snapshot: next.snapshot, calendarCoverage: next.calendarCoverage });
    if (warning) publish({ error: warning.message });
  };

  const synchronize = async () => {
    while (syncRequested && !disposed && document) {
      syncRequested = false;
      const requestPermission = permissionRequested;
      permissionRequested = false;
      const captured = document;
      const clock = now();
      const today = getLocalDateKey(clock);
      const through = captured.calendarCoverage.find(item => item.from <= today && item.through >= today)?.through ?? null;
      const plan = buildNotificationPlan(captured.snapshot, clock, 60, through);
      publish({ notificationStatus: 'syncing', notificationError: null });
      try {
        let denied = false;
        if (captured.snapshot.settings.notificationsEnabled) {
          const access = await notifications.access(requestPermission);
          if (disposed) return;
          publish({ notificationAccess: access });
          denied = access.authorization === 'denied';
        }
        const existing = await notifications.list();
        const wanted = new Map(plan.jobs.map(job => [job.id, job]));
        for (const item of existing) {
          if (disposed) return;
          if (wanted.get(item.id)?.fingerprint !== item.fingerprint) await notifications.cancel(item.id);
        }
        if (denied) {
          publish({ notificationStatus: 'blocked', notificationError: 'Уведомления запрещены системой. Проверьте настройки устройства.' });
          continue;
        }
        for (const job of plan.jobs) {
          if (disposed) return;
          if (!existing.some(item => item.id === job.id && item.fingerprint === job.fingerprint)) await notifications.schedule(job);
        }
        await enqueue(async () => {
          if (disposed || !document || document.notifications.desiredRevision !== captured.notifications.desiredRevision) return;
          if (document.notifications.appliedRevision !== captured.notifications.desiredRevision ||
              document.notifications.coverageEndsAt !== plan.coverageEndsAt) {
            await persist({ ...document, revision: document.revision + 1, notifications: {
              ...document.notifications, appliedRevision: captured.notifications.desiredRevision, coverageEndsAt: plan.coverageEndsAt
            } });
          }
          publish({ notificationStatus: captured.snapshot.settings.notificationsEnabled ? 'ready' : 'disabled',
            coverageEndsAt: plan.coverageEndsAt, notificationError: null });
        });
      } catch {
        publish({ notificationStatus: 'error', notificationError: 'Данные сохранены, но напоминания обновлены не полностью. Повторите обновление.' });
      }
    }
  };

  const requestSync = (requestPermission = false) => {
    if (disposed) return;
    syncRequested = true;
    permissionRequested ||= requestPermission;
    if (!worker) {
      worker = synchronize().finally(() => {
        worker = null;
        if (syncRequested && !disposed && document) requestSync();
      });
    }
  };

  const execute = (commandId: string, command: PilloCommand): Promise<CommandResult> => {
    pendingCommands += 1;
    publish({ isSaving: true });
    return enqueue(async (): Promise<CommandResult> => {
      try {
        if (disposed || !document || !repository) return { ok: false, kind: 'unavailable', message: 'Данные ещё не открыты.' };
        if (!commandId.trim() || commandId.length > 200) throw new DomainError('Неверный идентификатор команды.');
        if (document.recentCommandIds.includes(commandId)) return { ok: true };
        publish({ error: null });
        const clock = now();
        const today = getLocalDateKey(clock);
        const clear = command.type === 'clear-data';
        const snapshot = reconcileCalendar(applyCommand(document.snapshot, command, clock), clock);
        const calendarCoverage = extendCoverage(clear ? [] : document.calendarCoverage, today, addCalendarDays(today, calendarHorizonDays));
        const relevant = clear || JSON.stringify(buildNotificationPlan(document.snapshot, clock)) !== JSON.stringify(buildNotificationPlan(snapshot, clock));
        const same = JSON.stringify(snapshot) === JSON.stringify(document.snapshot) && JSON.stringify(calendarCoverage) === JSON.stringify(document.calendarCoverage);
        if (!same || command.type !== 'refresh-calendar') {
          await persist({ ...document, revision: document.revision + 1, snapshot, calendarCoverage,
            recentCommandIds: [...(clear ? [] : document.recentCommandIds), commandId].slice(-128),
            notifications: { ...document.notifications, desiredRevision: document.notifications.desiredRevision + (relevant ? 1 : 0) }
          }, clear);
        }
        if (clear) {
          void notifications.dismissDelivered().catch(() => {
            publish({ notificationStatus: 'error', notificationError: 'Данные очищены, но системные уведомления ещё не удалены. Повторите очистку.' });
          });
        }
        if (relevant || command.type === 'refresh-calendar') requestSync();
        return { ok: true };
      } catch (error) {
        const message = error instanceof DomainError ? error.message : 'Изменения не сохранены. Повторите действие; при повторном отказе откройте приложение заново.';
        publish({ error: message });
        return { ok: false, kind: error instanceof DomainError ? 'validation' : 'persistence', message,
          ...(error instanceof DomainError && error.field ? { field: error.field } : {}) };
      } finally {
        pendingCommands -= 1;
        publish({ isSaving: pendingCommands > 0 });
      }
    });
  };

  const start = async () => {
    await enqueue(async () => {
      if (disposed || repository) return;
      publish({ status: 'checking', error: null });
      let opened: PilloRepository | null = null;
      try {
        opened = await open();
        const loaded = await opened.load();
        if (disposed) { await opened.close(); return; }
        repository = opened;
        document = loaded;
        publish({ status: 'unlocked', snapshot: loaded.snapshot, calendarCoverage: loaded.calendarCoverage,
          coverageEndsAt: loaded.notifications.coverageEndsAt });
      } catch (error) {
        if (opened) await opened.close().catch(() => undefined);
        publish({ status: 'error', error: error instanceof Error ? error.message : 'Не удалось открыть данные.' });
      }
    });
    if (!disposed && document) {
      await execute(`bootstrap:${document.revision}:${now().toISOString()}`, { type: 'refresh-calendar' });
    }
  };

  return {
    getState: () => state,
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    start, execute, requestSync,
    whenIdle: async () => {
      for (;;) {
        const observed = queue;
        await observed;
        await worker;
        if (queue === observed && !worker) return;
      }
    },
    dispose: async () => {
      disposed = true;
      listeners.clear();
      await queue;
      await worker;
      await repository?.close();
      repository = null;
    }
  };
};
