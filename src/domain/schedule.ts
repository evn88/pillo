import type { Intake, ScheduleRule } from './types';
import { isDateKey, isTime } from './validation';

const pad = (value: number): string => String(value).padStart(2, '0');

/** Возвращает календарный ключ в локальной timezone устройства. */
export const getLocalDateKey = (date: Date): string => {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

/** Создаёт локальную дату без преобразования через UTC. */
export const fromLocalDateTime = (dateKey: string, time: string): Date | null => {
  if (!isDateKey(dateKey) || !isTime(time)) return null;
  const [yearValue, monthValue, dayValue] = dateKey.split('-').map(Number);
  const [hourValue, minuteValue] = time.split(':').map(Number);

  if (
    yearValue === undefined ||
    monthValue === undefined ||
    dayValue === undefined ||
    hourValue === undefined ||
    minuteValue === undefined
  ) {
    return null;
  }

  const result = new Date(yearValue, monthValue - 1, dayValue, hourValue, minuteValue, 0, 0);
  const isValid =
    result.getFullYear() === yearValue &&
    result.getMonth() === monthValue - 1 &&
    result.getDate() === dayValue &&
    result.getHours() === hourValue &&
    result.getMinutes() === minuteValue;

  return isValid ? result : null;
};

export const isRuleActiveOnDate = (rule: ScheduleRule, date: Date): boolean => {
  const dateKey = getLocalDateKey(date);
  return (
    rule.isActive &&
    rule.daysOfWeek.includes(date.getDay()) &&
    rule.startDate <= dateKey &&
    (!rule.endDate || rule.endDate >= dateKey)
  );
};

/** Материализует приёмы для указанной даты с детерминированными идентификаторами. */
export const materializeIntakesForDate = (
  rules: ScheduleRule[],
  existingIntakes: Intake[],
  date: Date
): Intake[] => {
  const localDate = getLocalDateKey(date);
  const existingIds = new Set(existingIntakes.map(intake => intake.id));
  const newIntakes = rules
    .filter(rule => isRuleActiveOnDate(rule, date))
    .map<Intake>(rule => ({
      id: `${rule.id}:${localDate}`,
      medicationId: rule.medicationId,
      scheduleRuleId: rule.id,
      localDate,
      localTime: rule.time,
      doseUnits: rule.doseUnits,
      status: 'PENDING',
      takenAt: null,
      source: 'SCHEDULED',
      stockEffectUnits: 0,
      medicationName: '',
      medicationDosage: '',
      contextSource: 'RECORDED',
      recordedAt: null
    }))
    .filter(intake => !existingIds.has(intake.id));

  return [...existingIntakes, ...newIntakes];
};

/** DST-разрыв переносится к первому существующему времени; повтор выбирает первый instant. */
export const resolveScheduledDate = (dateKey: string, time: string): Date | null => {
  if (!isDateKey(dateKey) || !isTime(time)) return null;
  const direct = fromLocalDateTime(dateKey, time);
  if (direct) return direct;
  const startMinute = Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
  for (let minute = startMinute + 1; minute < 1440; minute += 1) {
    const candidate = fromLocalDateTime(dateKey, `${pad(Math.floor(minute / 60))}:${pad(minute % 60)}`);
    if (candidate) return candidate;
  }
  return null;
};

/** Возвращает будущие срабатывания правила в пределах rolling window. */
export const getUpcomingRuleDates = (
  rule: ScheduleRule,
  now: Date,
  horizonDays = 30
): Date[] => {
  const result: Date[] = [];

  for (let offset = 0; offset <= horizonDays; offset += 1) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    if (!isRuleActiveOnDate(rule, date)) continue;

    const scheduledAt = resolveScheduledDate(getLocalDateKey(date), rule.time);
    if (scheduledAt && scheduledAt.getTime() > now.getTime()) result.push(scheduledAt);
  }

  return result;
};
