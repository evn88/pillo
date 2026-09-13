import { getLocalDateKey, isRuleActiveOnDate, materializeIntakesForDate, resolveScheduledDate } from './schedule';
import type { CalendarCoverage, PilloSnapshot } from './types';

export const calendarHorizonDays = 35;

export const addCalendarDays = (key: string, offset: number): string => {
  const date = new Date(`${key}T12:00:00`);
  date.setDate(date.getDate() + offset);
  return getLocalDateKey(date);
};

export const extendCoverage = (coverage: CalendarCoverage[], from: string, through: string): CalendarCoverage[] => {
  const result: CalendarCoverage[] = [];
  for (const interval of [...coverage, { from, through }].sort((a, b) => a.from.localeCompare(b.from))) {
    const previous = result[result.length - 1];
    if (previous && interval.from <= addCalendarDays(previous.through, 1)) {
      previous.through = previous.through > interval.through ? previous.through : interval.through;
    } else result.push({ ...interval });
  }
  return result;
};

/** Сохраняет прошлые факты и пересобирает только ещё не наступившую часть плана. */
export const reconcileCalendar = (snapshot: PilloSnapshot, now: Date): PilloSnapshot => {
  const medications = new Map(snapshot.medications.map(item => [item.id, item]));
  const rules = snapshot.scheduleRules.filter(rule => medications.get(rule.medicationId)?.isActive);
  const ruleById = new Map(rules.map(rule => [rule.id, rule]));
  let intakes = snapshot.intakes.filter(intake => {
    if (intake.source !== 'SCHEDULED' || intake.status !== 'PENDING') return true;
    const at = resolveScheduledDate(intake.localDate, intake.localTime);
    if (!at || at <= now) return true;
    const rule = ruleById.get(intake.scheduleRuleId ?? '');
    return Boolean(rule && isRuleActiveOnDate(rule, new Date(`${intake.localDate}T12:00:00`)) &&
      rule.time === intake.localTime && rule.medicationId === intake.medicationId && rule.doseUnits === intake.doseUnits);
  });
  for (let offset = 0; offset <= calendarHorizonDays; offset += 1) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, 12);
    intakes = materializeIntakesForDate(rules, intakes, date);
  }
  intakes = intakes.map(intake => intake.status !== 'PENDING' ? intake : {
    ...intake,
    medicationName: medications.get(intake.medicationId)?.name ?? intake.medicationName,
    medicationDosage: medications.get(intake.medicationId)?.dosage ?? intake.medicationDosage
  });
  return { ...snapshot, intakes };
};
