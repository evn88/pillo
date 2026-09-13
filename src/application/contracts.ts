import type { CalendarCoverage, IntakeStatus, MedicationInput, PilloDocument, PilloSettings, PilloSnapshot, ScheduleRule } from '../domain/types';

export type CommandResult = { ok: true } | { ok: false; kind: 'validation' | 'persistence' | 'unavailable'; message: string; field?: string };

export type { PilloCommand } from '../domain/command-types';

export interface PilloRepository {
  load: () => Promise<PilloDocument>;
  save: (document: PilloDocument, expectedRevision: number, purgeRecovery?: boolean) => Promise<void>;
  close: () => Promise<void>;
}

export type NotificationAccess = { authorization: 'granted' | 'quiet' | 'denied'; exact: 'unknown' | 'system' };
export type PlannedNotification = { id: string; at: string; intakeId: string; fingerprint: string };
export interface NotificationGateway {
  access: (request: boolean) => Promise<NotificationAccess>;
  list: () => Promise<{ id: string; fingerprint: string | null }[]>;
  schedule: (notification: PlannedNotification) => Promise<void>;
  cancel: (id: string) => Promise<void>;
}

export type PilloState = {
  status: 'checking' | 'unlocked' | 'error';
  snapshot: PilloSnapshot;
  calendarCoverage: CalendarCoverage[];
  error: string | null;
  isSaving: boolean;
  notificationStatus: 'checking' | 'syncing' | 'ready' | 'disabled' | 'blocked' | 'error';
  notificationError: string | null;
  notificationAccess: NotificationAccess | null;
  coverageEndsAt: string | null;
};

export type PilloActions = {
  retry: () => void;
  retryNotifications: () => void;
  createMedicationId: () => string;
  saveMedication: (input: MedicationInput, commandId?: string) => Promise<CommandResult>;
  deleteMedication: (id: string) => Promise<CommandResult>;
  addPackage: (id: string) => Promise<CommandResult>;
  saveScheduleRule: (rule: Omit<ScheduleRule, 'id'> & { id?: string }, commandId?: string) => Promise<CommandResult>;
  deleteScheduleRule: (id: string) => Promise<CommandResult>;
  setIntakeStatus: (id: string, status: IntakeStatus, legacyStockReturnUnits?: number) => Promise<CommandResult>;
  takeMedicationNow: (id: string, dose: number, commandId?: string) => Promise<CommandResult>;
  updateSettings: (settings: Partial<PilloSettings>) => Promise<CommandResult>;
  clearData: () => Promise<CommandResult>;
};

export type PilloContextValue = PilloState & PilloActions;
