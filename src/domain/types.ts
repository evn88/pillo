export type IntakeStatus = 'PENDING' | 'TAKEN' | 'SKIPPED';

export type Medication = {
  id: string;
  name: string;
  dosage: string;
  form: string;
  stockUnits: number;
  unitsPerPackage: number;
  minThresholdUnits: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ScheduleRule = {
  id: string;
  medicationId: string;
  time: string;
  doseUnits: number;
  daysOfWeek: number[];
  startDate: string;
  endDate: string | null;
  comment: string;
  isActive: boolean;
};

export type Intake = {
  id: string;
  medicationId: string;
  scheduleRuleId: string | null;
  localDate: string;
  localTime: string;
  doseUnits: number;
  status: IntakeStatus;
  takenAt: string | null;
  source: 'SCHEDULED' | 'MANUAL';
  stockEffectUnits: number | null;
  medicationName: string;
  medicationDosage: string;
  contextSource: 'RECORDED' | 'LEGACY';
  recordedAt: string | null;
};

export type PilloSettings = {
  notificationsEnabled: boolean;
  theme: 'SYSTEM' | 'LIGHT' | 'DARK';
};

export type PilloSnapshot = {
  medications: Medication[];
  scheduleRules: ScheduleRule[];
  intakes: Intake[];
  settings: PilloSettings;
};

export const emptySnapshot: PilloSnapshot = {
  medications: [],
  scheduleRules: [],
  intakes: [],
  settings: {
    notificationsEnabled: false,
    theme: 'SYSTEM'
  }
};

export type MedicationInput = Pick<Medication,
  'id' | 'name' | 'dosage' | 'form' | 'stockUnits' | 'unitsPerPackage' | 'minThresholdUnits'>;

export type CalendarCoverage = { from: string; through: string };

export type PilloDocument = {
  schemaVersion: 2;
  revision: number;
  snapshot: PilloSnapshot;
  calendarCoverage: CalendarCoverage[];
  notifications: {
    desiredRevision: number;
    appliedRevision: number;
    coverageEndsAt: string | null;
  };
  recentCommandIds: string[];
};

export const createDocument = (snapshot: PilloSnapshot = emptySnapshot): PilloDocument => ({
  schemaVersion: 2,
  revision: 0,
  snapshot,
  calendarCoverage: [],
  notifications: { desiredRevision: 0, appliedRevision: -1, coverageEndsAt: null },
  recentCommandIds: []
});
