import type { Medication, PilloSnapshot, ScheduleRule } from '../types';

export const now = new Date(2026, 8, 13, 8);
export const medication: Medication = {
  id: 'm1', name: 'Препарат', dosage: '10 мг', form: 'таблетка', stockUnits: 0.5,
  unitsPerPackage: 30, minThresholdUnits: 5, isActive: true,
  createdAt: now.toISOString(), updatedAt: now.toISOString()
};
export const rule: ScheduleRule = {
  id: 'r1', medicationId: 'm1', time: '09:00', doseUnits: 1, daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
  startDate: '2026-09-13', endDate: null, comment: '', isActive: true
};
export const snapshot: PilloSnapshot = {
  medications: [medication], scheduleRules: [rule], intakes: [], settings: { theme: 'SYSTEM', notificationsEnabled: true }
};
