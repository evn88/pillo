import { afterEach, describe, expect, it } from 'vitest';

import { applyCommand } from '../commands';
import { extendCoverage, reconcileCalendar } from '../calendar';
import { decodeDocument, decodeRule, migrateLegacyPayload } from '../document-validation';
import { createDocument } from '../types';
import { fromLocalDateTime, resolveScheduledDate } from '../schedule';
import { parseQuantity, toMilliunits } from '../validation';
import { medication, now, rule, snapshot } from './fixtures';

const originalTimezone = process.env.TZ;
afterEach(() => { if (originalTimezone === undefined) delete process.env.TZ; else process.env.TZ = originalTimezone; });

describe('валидация данных', () => {
  it.each(['0,5', '0.5'])('сохраняет десятичное значение %s', value => {
    expect(parseQuantity(value, 'Доза', true)).toBe(0.5);
  });
  it.each(['', '0', '-1', 'Infinity', 'NaN', '0,5.1', '1.0001', '1abc'])('отклоняет неверную дозу %s', value => {
    expect(() => parseQuantity(value, 'Доза', true)).toThrow();
  });
  it('точно суммирует десятичные количества и отклоняет слишком малые числа', () => {
    expect((toMilliunits(0.1) + toMilliunits(0.2)) / 1000).toBe(0.3);
    expect(() => toMilliunits(0.000000001, 'Доза', true)).toThrow();
  });
  it.each([{ time: '99:99' }, { startDate: '2026-02-30' }, { endDate: '2026-09-12' }, { daysOfWeek: [7] }, { daysOfWeek: [1, 1] }])('отклоняет неверное правило %j', input => {
    expect(() => decodeRule({ ...rule, ...input })).toThrow();
  });
  it('не принимает лишние сегменты даты', () => {
    expect(fromLocalDateTime('2026-09-13-extra', '09:00')).toBeNull();
  });
  it('не принимает неверный JSON shape или отсутствующую связь', () => {
    expect(() => decodeDocument({ ...createDocument(), snapshot: { ...snapshot, medications: [] } })).toThrow();
    expect(() => decodeDocument({ ...createDocument(), snapshot: { ...snapshot, medications: [{ ...medication, stockUnits: null }] } })).toThrow();
  });
});

describe('учёт остатков', () => {
  const initial = () => reconcileCalendar(snapshot, now);
  it('отмена возвращает реально списанное количество и сохраняет пополнение', () => {
    const taken = applyCommand(initial(), { type: 'set-intake-status', intakeId: 'r1:2026-09-13', status: 'TAKEN' }, now);
    expect(taken.medications[0]?.stockUnits).toBe(0);
    expect(taken.intakes[0]?.stockEffectUnits).toBe(0.5);
    const stocked = applyCommand(taken, { type: 'add-package', medicationId: 'm1' }, now);
    const undone = applyCommand(stocked, { type: 'set-intake-status', intakeId: 'r1:2026-09-13', status: 'PENDING' }, now);
    expect(undone.medications[0]?.stockUnits).toBe(30.5);
  });
  it('повтор статуса не меняет время и запас', () => {
    const taken = applyCommand(initial(), { type: 'set-intake-status', intakeId: 'r1:2026-09-13', status: 'TAKEN' }, now);
    expect(applyCommand(taken, { type: 'set-intake-status', intakeId: 'r1:2026-09-13', status: 'TAKEN' }, new Date(2026, 8, 13, 10))).toBe(taken);
  });
  it('не выдумывает legacy-списание и принимает явное исправление', () => {
    const taken = applyCommand(initial(), { type: 'set-intake-status', intakeId: 'r1:2026-09-13', status: 'TAKEN' }, now);
    const legacy = migrateLegacyPayload(JSON.stringify(taken)).snapshot;
    expect(legacy.intakes[0]?.stockEffectUnits).toBeNull();
    expect(() => applyCommand(legacy, { type: 'set-intake-status', intakeId: 'r1:2026-09-13', status: 'PENDING' }, now)).toThrow('неизвестно');
    expect(applyCommand(legacy, { type: 'set-intake-status', intakeId: 'r1:2026-09-13', status: 'PENDING', legacyStockReturnUnits: 0.5 }, now).medications[0]?.stockUnits).toBe(0.5);
  });
  it('отмена ручного факта не оставляет фиктивный план', () => {
    const taken = applyCommand(snapshot, { type: 'record-manual', intakeId: 'manual1', medicationId: 'm1', doseUnits: 1 }, now);
    const undone = applyCommand(taken, { type: 'set-intake-status', intakeId: 'manual1', status: 'PENDING' }, now);
    expect(undone.intakes).toEqual([]);
    expect(undone.medications[0]?.stockUnits).toBe(0.5);
  });
});

describe('календарь и история', () => {
  it('правка заменяет будущий приём, сохраняя завершённый', () => {
    const initial = reconcileCalendar(snapshot, now);
    const edited = applyCommand(initial, { type: 'save-rule', rule: { ...rule, time: '10:00', doseUnits: 2 } }, now);
    expect(reconcileCalendar(edited, now).intakes[0]).toMatchObject({ localTime: '10:00', doseUnits: 2 });
    const taken = applyCommand(initial, { type: 'set-intake-status', intakeId: 'r1:2026-09-13', status: 'TAKEN' }, now);
    const changed = reconcileCalendar(applyCommand(taken, { type: 'save-rule', rule: { ...rule, doseUnits: 2 } }, now), now);
    expect(changed.intakes.filter(item => item.id === 'r1:2026-09-13')).toHaveLength(1);
    expect(changed.intakes[0]).toMatchObject({ doseUnits: 1, status: 'TAKEN' });
  });
  it('удаление правила сохраняет прошлое и убирает будущие ожидания', () => {
    const initial = reconcileCalendar(snapshot, now);
    const nextDay = new Date(2026, 8, 14, 8);
    const deleted = reconcileCalendar(applyCommand(initial, { type: 'delete-rule', ruleId: rule.id }, nextDay), nextDay);
    expect(deleted.intakes.map(item => item.id)).toEqual(['r1:2026-09-13']);
  });
  it('переименование не меняет название завершённого факта', () => {
    const taken = applyCommand(reconcileCalendar(snapshot, now), { type: 'set-intake-status', intakeId: 'r1:2026-09-13', status: 'TAKEN' }, now);
    const renamed = reconcileCalendar(applyCommand(taken, { type: 'save-medication', input: { ...medication, name: 'Новое название' } }, now), now);
    expect(renamed.intakes[0]?.medicationName).toBe('Препарат');
  });
  it('повторный foreground не дублирует события и не выдумывает неизвестное покрытие', () => {
    const initial = reconcileCalendar(snapshot, now);
    expect(reconcileCalendar(initial, now)).toEqual(initial);
    expect(extendCoverage([{ from: '2026-01-01', through: '2026-01-31' }], '2026-03-01', '2026-04-01')).toHaveLength(2);
    expect(extendCoverage([{ from: '2026-01-01', through: '2026-01-31' }], '2026-02-01', '2026-02-28')).toEqual([{ from: '2026-01-01', through: '2026-02-28' }]);
  });
  it('после нескольких дней в фоне сохраняет прошлые неотмеченные события и создаёт текущие без дублей', () => {
    const opened = reconcileCalendar(snapshot, now);
    const returned = reconcileCalendar(opened, new Date(2026, 8, 16, 8));

    expect(returned.intakes.filter(intake => intake.localDate >= '2026-09-13' && intake.localDate <= '2026-09-16')).toHaveLength(4);
    expect(returned.intakes.filter(intake => intake.localDate === '2026-09-13' && intake.status === 'PENDING')).toHaveLength(1);
    expect(reconcileCalendar(returned, new Date(2026, 8, 16, 8))).toEqual(returned);
  });
  it('не меняет уже наступивший PENDING при правке правила после его времени', () => {
    const initial = reconcileCalendar(snapshot, now);
    const changed = reconcileCalendar(
      applyCommand(initial, { type: 'save-rule', rule: { ...rule, time: '10:00', doseUnits: 2 } }, new Date(2026, 8, 13, 10)),
      new Date(2026, 8, 13, 10)
    );

    expect(changed.intakes.find(intake => intake.id === 'r1:2026-09-13')).toMatchObject({ localTime: '09:00', doseUnits: 1, status: 'PENDING' });
    expect(changed.intakes.filter(intake => intake.id === 'r1:2026-09-14')).toMatchObject([{ localTime: '10:00', doseUnits: 2 }]);
  });
  it('учитывает границу курса, leap day и неактивный препарат', () => {
    expect(fromLocalDateTime('2028-02-29', '09:00')).not.toBeNull();
    expect(fromLocalDateTime('2027-02-29', '09:00')).toBeNull();
    expect(reconcileCalendar({ ...snapshot, scheduleRules: [{ ...rule, endDate: '2026-09-13' }] }, now).intakes).toHaveLength(1);
    expect(reconcileCalendar({ ...snapshot, medications: [{ ...medication, isActive: false }] }, now).intakes).toHaveLength(0);
  });
  it('разрешает DST-разрыв в первое существующее время и выбирает первый осенний instant', () => {
    process.env.TZ = 'Europe/Belgrade';
    expect(resolveScheduledDate('2026-03-29', '02:30')?.toISOString()).toBe('2026-03-29T01:00:00.000Z');
    expect(resolveScheduledDate('2026-10-25', '02:30')?.toISOString()).toBe('2026-10-25T00:30:00.000Z');
  });
});
