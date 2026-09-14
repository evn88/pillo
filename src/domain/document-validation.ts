import { createDocument, type Intake, type Medication, type PilloDocument, type PilloSnapshot, type ScheduleRule } from './types';
import { DomainError, requireDateKey, requireTime, toMilliunits } from './validation';

const fail = (field: string): never => { throw new DomainError(`Повреждённые данные: ${field}. Исходная база сохранена.`); };
const record = (value: unknown, field: string): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fail(field);
  return value as Record<string, unknown>;
};
const string = (value: unknown, field: string, max = 2000): string => {
  if (typeof value !== 'string' || value.length > max) return fail(field);
  return value;
};
const id = (value: unknown): string => {
  const result = string(value, 'идентификатор', 200);
  return result.trim() ? result : fail('идентификатор');
};
const bool = (value: unknown): boolean => typeof value === 'boolean' ? value : fail('boolean');
const integer = (value: unknown, minimum = 0): number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= minimum ? value : fail('ревизия');
const quantity = (value: unknown, positive = false): number => {
  if (typeof value !== 'number') return fail('количество');
  return toMilliunits(value, 'Количество', positive) / 1000;
};
const timestamp = (value: unknown): string => {
  const result = string(value, 'timestamp');
  return /^\d{4}-\d{2}-\d{2}T/.test(result) && Number.isFinite(Date.parse(result)) ? result : fail('timestamp');
};
const nullableTimestamp = (value: unknown): string | null => value === null ? null : timestamp(value);
const array = <T>(value: unknown, decode: (item: unknown) => T): T[] => {
  if (!Array.isArray(value) || value.length > 250_000) return fail('коллекция');
  return value.map(decode);
};
const choice = <T extends string>(value: unknown, options: readonly T[]): T =>
  options.find(option => value === option) ?? fail('статус');
const unique = <T extends { id: string }>(items: T[]): T[] => {
  if (new Set(items.map(item => item.id)).size !== items.length) fail('повторяющийся ID');
  return items;
};

export const decodeMedication = (value: unknown): Medication => {
  const item = record(value, 'препарат');
  const name = string(item.name, 'название').trim();
  if (!name) fail('название');
  if (item.photoFileName != null && (typeof item.photoFileName !== 'string' || !/^[a-f0-9-]{36}\.jpg$/.test(item.photoFileName))) fail('фото упаковки');
  return {
    ...(item.photoFileName === undefined ? {} : { photoFileName: item.photoFileName as string | null }),
    id: id(item.id), name, dosage: string(item.dosage, 'дозировка'), form: string(item.form, 'форма'),
    stockUnits: quantity(item.stockUnits), unitsPerPackage: quantity(item.unitsPerPackage),
    minThresholdUnits: quantity(item.minThresholdUnits), isActive: bool(item.isActive),
    createdAt: timestamp(item.createdAt), updatedAt: timestamp(item.updatedAt)
  };
};

export const decodeRule = (value: unknown): ScheduleRule => {
  const item = record(value, 'правило');
  const startDate = requireDateKey(string(item.startDate, 'начало'));
  const endDate = item.endDate === null ? null : requireDateKey(string(item.endDate, 'окончание'));
  const daysOfWeek = array(item.daysOfWeek, day => integer(day));
  if (!daysOfWeek.length || daysOfWeek.some(day => day > 6) || new Set(daysOfWeek).size !== daysOfWeek.length) fail('дни недели');
  if (endDate && endDate < startDate) throw new DomainError('Окончание курса не может быть раньше начала.', 'Окончание');
  return {
    id: id(item.id), medicationId: id(item.medicationId), time: requireTime(string(item.time, 'время')),
    doseUnits: quantity(item.doseUnits, true), daysOfWeek, startDate, endDate,
    comment: string(item.comment, 'комментарий'), isActive: bool(item.isActive)
  };
};

const decodeSnapshot = (value: unknown, legacy: boolean): PilloSnapshot => {
  const item = record(value, 'snapshot');
  const medications = unique(array(item.medications, decodeMedication));
  const medicationById = new Map(medications.map(medication => [medication.id, medication]));
  const scheduleRules = unique(array(item.scheduleRules, decodeRule));
  if (scheduleRules.some(rule => !medicationById.has(rule.medicationId))) fail('ссылка правила на препарат');
  const intakes = unique(array(item.intakes, (raw): Intake => {
    const intake = record(raw, 'приём');
    const medicationId = id(intake.medicationId);
    const medication = medicationById.get(medicationId);
    if (!medication) return fail('ссылка приёма на препарат');
    const source = choice(intake.source, ['SCHEDULED', 'MANUAL']);
    const status = choice(intake.status, ['PENDING', 'TAKEN', 'SKIPPED']);
    const scheduleRuleId = intake.scheduleRuleId === null ? null : id(intake.scheduleRuleId);
    if ((source === 'MANUAL') !== (scheduleRuleId === null)) fail('источник приёма');
    const takenAt = nullableTimestamp(intake.takenAt);
    if ((status === 'TAKEN') !== (takenAt !== null)) fail('время принятого препарата');
    const stockEffectUnits = legacy ? (status === 'TAKEN' ? null : 0) :
      intake.stockEffectUnits === null ? null : quantity(intake.stockEffectUnits);
    const doseUnits = quantity(intake.doseUnits, true);
    if ((stockEffectUnits !== null && stockEffectUnits > doseUnits) || (status !== 'TAKEN' && stockEffectUnits !== 0)) fail('списание приёма');
    const localDate = requireDateKey(string(intake.localDate, 'дата приёма'));
    const intakeId = id(intake.id);
    if (source === 'SCHEDULED' && intakeId !== `${scheduleRuleId}:${localDate}`) fail('идентификатор планового приёма');
    return {
      id: intakeId, medicationId, scheduleRuleId, localDate,
      localTime: requireTime(string(intake.localTime, 'время приёма')), doseUnits, status, takenAt, source,
      stockEffectUnits,
      medicationName: legacy ? medication.name : string(intake.medicationName, 'название в истории'),
      medicationDosage: legacy ? medication.dosage : string(intake.medicationDosage, 'дозировка в истории'),
      contextSource: legacy ? 'LEGACY' : choice(intake.contextSource, ['RECORDED', 'LEGACY']),
      recordedAt: legacy ? takenAt : nullableTimestamp(intake.recordedAt)
    };
  }));
  const settings = record(item.settings, 'настройки');
  return { medications, scheduleRules, intakes, settings: {
    notificationsEnabled: bool(settings.notificationsEnabled), theme: choice(settings.theme, ['SYSTEM', 'LIGHT', 'DARK'])
  } };
};

export const migrateLegacyPayload = (payload: string): PilloDocument => createDocument(decodeSnapshot(JSON.parse(payload), true));

export const decodeDocument = (value: unknown): PilloDocument => {
  const item = record(value, 'документ');
  if (item.schemaVersion !== 2) return fail('неподдерживаемая версия');
  const notifications = record(item.notifications, 'уведомления');
  const desiredRevision = integer(notifications.desiredRevision);
  const appliedRevision = integer(notifications.appliedRevision, -1);
  if (appliedRevision > desiredRevision) fail('ревизия уведомлений');
  const recentCommandIds = array(item.recentCommandIds, id);
  if (recentCommandIds.length > 128 || new Set(recentCommandIds).size !== recentCommandIds.length) fail('команды');
  return {
    schemaVersion: 2, revision: integer(item.revision), snapshot: decodeSnapshot(item.snapshot, false),
    calendarCoverage: array(item.calendarCoverage, raw => {
      const coverage = record(raw, 'покрытие');
      const from = requireDateKey(string(coverage.from, 'начало покрытия'));
      const through = requireDateKey(string(coverage.through, 'конец покрытия'));
      if (through < from) fail('покрытие');
      return { from, through };
    }),
    notifications: { desiredRevision, appliedRevision, coverageEndsAt: nullableTimestamp(notifications.coverageEndsAt) },
    recentCommandIds
  };
};

export const parseDocument = (payload: string): PilloDocument => decodeDocument(JSON.parse(payload));
