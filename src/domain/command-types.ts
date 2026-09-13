import type { IntakeStatus, MedicationInput, PilloSettings, ScheduleRule } from './types';

export type PilloCommand =
  | { type: 'save-medication'; input: MedicationInput }
  | { type: 'delete-medication'; medicationId: string }
  | { type: 'add-package'; medicationId: string }
  | { type: 'save-rule'; rule: ScheduleRule }
  | { type: 'delete-rule'; ruleId: string }
  | { type: 'set-intake-status'; intakeId: string; status: IntakeStatus; legacyStockReturnUnits?: number }
  | { type: 'record-manual'; intakeId: string; medicationId: string; doseUnits: number }
  | { type: 'update-settings'; settings: Partial<PilloSettings> }
  | { type: 'refresh-calendar' }
  | { type: 'clear-data' };
