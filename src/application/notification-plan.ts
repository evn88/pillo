import { addCalendarDays, calendarHorizonDays } from '../domain/calendar';
import { getLocalDateKey, resolveScheduledDate } from '../domain/schedule';
import type { PilloSnapshot } from '../domain/types';
import type { PlannedNotification } from './contracts';

export const notificationPrefix = 'pillo:v2:';

export const buildNotificationPlan = (snapshot: PilloSnapshot, now: Date, capacity = 60, coveredThrough: string | null = addCalendarDays(getLocalDateKey(now), calendarHorizonDays)) => {
  const activeMedications = new Set(snapshot.medications.filter(item => item.isActive).map(item => item.id));
  const activeRules = new Set(snapshot.scheduleRules.filter(item => item.isActive).map(item => item.id));
  const all: PlannedNotification[] = [];
  if (snapshot.settings.notificationsEnabled) {
    for (const intake of snapshot.intakes) {
      if (intake.status !== 'PENDING' || !activeMedications.has(intake.medicationId) || !activeRules.has(intake.scheduleRuleId ?? '')) continue;
      const date = resolveScheduledDate(intake.localDate, intake.localTime);
      if (!date || date <= now) continue;
      const at = date.toISOString();
      all.push({ id: `${notificationPrefix}${intake.id}`, intakeId: intake.id, at,
        fingerprint: JSON.stringify([intake.id, at, intake.medicationId, intake.doseUnits]) });
    }
  }
  all.sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id));
  const firstOmitted = all[capacity];
  const horizon = coveredThrough ? new Date(`${coveredThrough}T23:59:59.999`) : null;
  return { jobs: all.slice(0, capacity), coverageEndsAt: snapshot.settings.notificationsEnabled && horizon
    ? new Date(Math.min(horizon.getTime(), firstOmitted ? Date.parse(firstOmitted.at) - 1 : Infinity)).toISOString() : null };
};
