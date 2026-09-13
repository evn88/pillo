import { describe, expect, it, vi } from 'vitest';

import { createDocument, type PilloDocument } from '../../domain/types';
import { reconcileCalendar } from '../../domain/calendar';
import { medication, now, snapshot } from '../../domain/__tests__/fixtures';
import { createPilloController } from '../pillo-controller';
import { buildNotificationPlan } from '../notification-plan';
import type { NotificationGateway, PlannedNotification, PilloRepository } from '../contracts';

const deferred = () => {
  let release = () => {};
  const promise = new Promise<void>(resolve => { release = resolve; });
  return { promise, release };
};

const fixture = () => {
  let saved = createDocument(snapshot);
  let failSave = false;
  const jobs = new Map<string, PlannedNotification>();
  const repository: PilloRepository = {
    load: vi.fn(async () => saved),
    save: vi.fn(async (next, expected) => {
      if (failSave) { failSave = false; throw new Error('disk'); }
      if (expected !== saved.revision) throw new Error('revision');
      saved = JSON.parse(JSON.stringify(next)) as PilloDocument;
    }),
    close: vi.fn(async () => undefined)
  };
  const gateway: NotificationGateway = {
    access: vi.fn(async () => ({ authorization: 'granted' as const, exact: 'system' as const })),
    list: vi.fn(async () => [...jobs.values()]),
    schedule: vi.fn(async job => { jobs.set(job.id, job); }),
    cancel: vi.fn(async id => { jobs.delete(id); })
  };
  const controller = createPilloController({ open: async () => repository, notifications: gateway, now: () => now });
  return { controller, gateway, repository, jobs, saved: () => saved, failNextSave: () => { failSave = true; } };
};

describe('последовательные команды', () => {
  it('сохраняет обе команды и дедуплицирует повтор command ID', async () => {
    const { controller, saved } = fixture();
    await controller.start();
    await controller.whenIdle();
    await Promise.all([
      controller.execute('package1', { type: 'add-package', medicationId: 'm1' }),
      controller.execute('package2', { type: 'add-package', medicationId: 'm1' }),
      controller.execute('package1', { type: 'add-package', medicationId: 'm1' })
    ]);
    expect(saved().snapshot.medications[0]?.stockUnits).toBe(60.5);
    expect(controller.getState().isSaving).toBe(false);
    await controller.dispose();
  });
  it('отказ первой команды не откатывает вторую и не уничтожает очередь', async () => {
    const { controller, saved, failNextSave } = fixture();
    await controller.start(); await controller.whenIdle();
    failNextSave();
    const results = await Promise.all([
      controller.execute('package1', { type: 'add-package', medicationId: 'm1' }),
      controller.execute('package2', { type: 'add-package', medicationId: 'm1' })
    ]);
    expect(results[0]).toMatchObject({ ok: false, kind: 'persistence' });
    expect(results[1]).toEqual({ ok: true });
    expect(saved().snapshot.medications[0]?.stockUnits).toBe(30.5);
    await controller.dispose();
  });
  it('не публикует optimistic state и не планирует отказавшие данные', async () => {
    const { controller, gateway, repository } = fixture();
    await controller.start(); await controller.whenIdle();
    const gate = deferred();
    vi.mocked(repository.save).mockImplementationOnce(async () => { await gate.promise; throw new Error('disk'); });
    const calls = vi.mocked(gateway.schedule).mock.calls.length;
    const command = controller.execute('delete', { type: 'delete-medication', medicationId: 'm1' });
    await Promise.resolve();
    expect(controller.getState().snapshot.medications).toHaveLength(1);
    gate.release();
    expect(await command).toMatchObject({ ok: false });
    expect(vi.mocked(gateway.schedule).mock.calls.length).toBe(calls);
    await controller.dispose();
  });
  it('показывает bootstrap error, закрывает отказавший handle и позволяет retry', async () => {
    const { controller, repository } = fixture();
    vi.mocked(repository.load).mockRejectedValueOnce(new Error('corrupt'));
    await controller.start();
    expect(controller.getState()).toMatchObject({ status: 'error', error: 'corrupt' });
    expect(repository.close).toHaveBeenCalledTimes(1);
    await controller.start();
    expect(controller.getState().status).toBe('unlocked');
    await controller.dispose();
    expect(repository.close).toHaveBeenCalledTimes(2);
  });
  it('закрывает handle при dispose во время открытия без публикации', async () => {
    const gate = deferred();
    const { repository, gateway } = fixture();
    const controller = createPilloController({ open: async () => { await gate.promise; return repository; }, notifications: gateway, now: () => now });
    const listener = vi.fn(); controller.subscribe(listener);
    const started = controller.start();
    await Promise.resolve();
    const disposed = controller.dispose();
    const count = listener.mock.calls.length;
    gate.release(); await started; await disposed;
    expect(repository.close).toHaveBeenCalledOnce();
    expect(listener).toHaveBeenCalledTimes(count);
  });
});

describe('восстановимая проекция уведомлений', () => {
  it('повторяет частичный scheduling после перезапуска без дубликатов', async () => {
    const { controller, gateway, repository, saved, jobs } = fixture();
    let count = 0;
    vi.mocked(gateway.schedule).mockImplementation(async job => {
      if (++count === 3) throw new Error('OS');
      jobs.set(job.id, job);
    });
    await controller.start(); await controller.whenIdle();
    expect(controller.getState().notificationStatus).toBe('error');
    expect(saved().notifications.appliedRevision).toBeLessThan(saved().notifications.desiredRevision);
    await controller.dispose();
    const restarted = createPilloController({ open: async () => repository, notifications: gateway, now: () => now });
    await restarted.start(); await restarted.whenIdle();
    expect(restarted.getState().notificationStatus).toBe('ready');
    expect(jobs.size).toBe(36);
    expect(saved().notifications.appliedRevision).toBe(saved().notifications.desiredRevision);
    await restarted.dispose();
  });
  it('новая правка во время старого worker сходится к последней ревизии', async () => {
    const { controller, gateway, jobs, saved } = fixture();
    const gate = deferred();
    vi.mocked(gateway.schedule).mockImplementationOnce(async job => { await gate.promise; jobs.set(job.id, job); });
    await controller.start();
    await controller.execute('delete', { type: 'delete-rule', ruleId: 'r1' });
    gate.release(); await controller.whenIdle();
    expect(jobs.size).toBe(0);
    expect(saved().notifications.appliedRevision).toBe(saved().notifications.desiredRevision);
    await controller.dispose();
  });
  it('TAKEN убирает один occurrence, undo возвращает, тема не трогает очередь', async () => {
    const { controller, gateway, jobs } = fixture();
    await controller.start(); await controller.whenIdle();
    expect(jobs.size).toBe(36);
    await controller.execute('take', { type: 'set-intake-status', intakeId: 'r1:2026-09-13', status: 'TAKEN' });
    await controller.whenIdle(); expect(jobs.size).toBe(35);
    await controller.execute('undo', { type: 'set-intake-status', intakeId: 'r1:2026-09-13', status: 'PENDING' });
    await controller.whenIdle(); expect(jobs.size).toBe(36);
    vi.mocked(gateway.list).mockClear();
    await controller.execute('theme', { type: 'update-settings', settings: { theme: 'DARK' } });
    await controller.whenIdle(); expect(gateway.list).not.toHaveBeenCalled();
    await controller.dispose();
  });
  it('запрет разрешения виден и не запускает автоматический запрос', async () => {
    const { controller, gateway } = fixture();
    vi.mocked(gateway.access).mockResolvedValue({ authorization: 'denied', exact: 'unknown' });
    await controller.start(); await controller.whenIdle();
    expect(controller.getState().notificationStatus).toBe('blocked');
    expect(gateway.access).toHaveBeenCalledWith(false);
    expect(gateway.cancel).not.toHaveBeenCalled();
    controller.requestSync(true); await controller.whenIdle();
    expect(gateway.access).toHaveBeenLastCalledWith(true);
    await controller.dispose();
  });
  it('показывает границу покрытия перед первым неуместившимся событием', () => {
    const dense = reconcileCalendar({ ...snapshot, scheduleRules: Array.from({ length: 10 }, (_, index) => ({ ...snapshot.scheduleRules[0]!, id: `r${index}` })) }, now);
    const plan = buildNotificationPlan(dense, now);
    expect(plan.jobs).toHaveLength(60);
    expect(plan.coverageEndsAt).toBe(new Date(2026, 8, 19, 8, 59, 59, 999).toISOString());
  });
  it('не заявляет покрытие при неизвестном календарном интервале', () => {
    expect(buildNotificationPlan(reconcileCalendar(snapshot, now), now, 60, null).coverageEndsAt).toBeNull();
  });
  it('отмена данных при запрете permission удаляет устаревшее событие', async () => {
    const { controller, gateway, jobs } = fixture();
    await controller.start(); await controller.whenIdle();
    vi.mocked(gateway.access).mockResolvedValue({ authorization: 'denied', exact: 'unknown' });
    await controller.execute('delete-denied', { type: 'delete-rule', ruleId: 'r1' });
    await controller.whenIdle();
    expect(jobs.size).toBe(0);
    expect(controller.getState().notificationStatus).toBe('blocked');
    await controller.dispose();
  });
  it('сбой подтверждения OS-плана оставляет dirty revision, повтор не создаёт дубликат', async () => {
    const { controller, gateway, saved, jobs, failNextSave } = fixture();
    let marked = false;
    vi.mocked(gateway.schedule).mockImplementation(async job => {
      jobs.set(job.id, job);
      if (!marked) { marked = true; failNextSave(); }
    });
    await controller.start(); await controller.whenIdle();
    expect(controller.getState().notificationStatus).toBe('error');
    expect(saved().notifications.appliedRevision).toBe(-1);
    controller.requestSync(); await controller.whenIdle();
    expect(controller.getState().notificationStatus).toBe('ready');
    expect(jobs.size).toBe(36);
    expect(gateway.schedule).toHaveBeenCalledTimes(36);
    await controller.dispose();
  });
  it('валидирует отсутствующие сущности до записи', async () => {
    const { controller, saved } = fixture();
    await controller.start(); await controller.whenIdle();
    const previous = saved();
    expect(await controller.execute('missing', { type: 'record-manual', intakeId: 'x', medicationId: 'missing', doseUnits: 1 })).toMatchObject({ ok: false, kind: 'validation' });
    expect(saved()).toBe(previous);
    expect(controller.getState().snapshot.medications[0]?.id).toBe(medication.id);
    await controller.dispose();
  });
});
