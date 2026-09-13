import { Pressable, Text, View } from 'react-native';
import type { ReactNode } from 'react';
import { act, create } from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';

import type { PilloContextValue } from '@/application/contracts';
import { medication } from '@/domain/__tests__/fixtures';
import { getLocalDateKey } from '@/domain/schedule';
import type { Intake } from '@/domain/types';
import { colors } from '@/theme/tokens';
import { TodayScreen } from '@/screens/today-screen';

const context = vi.hoisted(() => ({ current: {} as PilloContextValue }));
vi.mock('expo-router', () => ({ router: { navigate: vi.fn() } }));
vi.mock('@/providers/pillo-provider', () => ({ usePilloContext: () => context.current }));
vi.mock('@/theme/use-pillo-theme', () => ({ usePilloTheme: () => ({ isDark: false, palette: colors.light }) }));
vi.mock('@/components/app-symbol', () => ({ AppSymbol: () => null }));
vi.mock('@/components/history-sheet', () => ({ HistorySheet: () => null }));
vi.mock('@/components/legacy-stock-return-sheet', () => ({ LegacyStockReturnSheet: () => null }));
vi.mock('@/components/manual-intake-sheet', () => ({ ManualIntakeSheet: () => null }));
vi.mock('@/components/scheduled-intake-sheet', () => ({ ScheduledIntakeSheet: ({ intake }: { intake: Intake }) => <Text accessibilityLabel={`Редактор дозы ${intake.id}`} /> }));
vi.mock('@/components/screen-actions', () => ({ ScreenActions: () => null }));
vi.mock('@/components/ui', () => ({
  ActionButton: ({ accessibilityText, label, onPress }: { accessibilityText?: string; label: string; onPress: () => void }) => <Pressable accessibilityLabel={accessibilityText ?? label} onPress={onPress}><Text>{label}</Text></Pressable>,
  Surface: ({ children }: { children: ReactNode }) => <View>{children}</View>
}));

const intake: Intake = {
  contextSource: 'RECORDED', doseUnits: 0.5, id: 'r1:today', localDate: getLocalDateKey(new Date()), localTime: '09:00',
  medicationDosage: medication.dosage, medicationId: medication.id, medicationName: medication.name, recordedAt: null,
  scheduleRuleId: 'r1', source: 'SCHEDULED', status: 'PENDING', stockEffectUnits: 0, takenAt: null
};

const createContext = (): PilloContextValue => ({
  addPackage: vi.fn(), calendarCoverage: [], clearData: vi.fn(), coverageEndsAt: null, createMedicationId: vi.fn(), deleteMedication: vi.fn(),
  deleteScheduleRule: vi.fn(), error: null, isSaving: false, notificationAccess: null, notificationError: null,
  notificationStatus: 'ready', openNotificationSettings: vi.fn(), retry: vi.fn(), retryNotifications: vi.fn(),
  saveMedication: vi.fn(), saveScheduleRule: vi.fn(), setIntakeStatus: vi.fn(), snapshot: {
    intakes: [intake], medications: [{ ...medication, stockUnits: 20 }], scheduleRules: [], settings: { notificationsEnabled: true, theme: 'SYSTEM' }
  }, status: 'unlocked', takeMedicationNow: vi.fn(), takeScheduledIntake: vi.fn().mockResolvedValue({ ok: true }), updateSettings: vi.fn()
});

describe('Плановый приём', () => {
  it('одним нажатием сохраняет дозу из расписания', async () => {
    context.current = createContext();
    let screen: ReturnType<typeof create>;
    await act(async () => { screen = create(<TodayScreen isLargeText={false} />); });

    await act(async () => {
      screen!.root.findByProps({ accessibilityLabel: 'Принять Препарат в дозе 0,5 ед.' }).props.onPress();
    });

    expect(context.current.takeScheduledIntake).toHaveBeenCalledWith(intake.id, 0.5);
  });

  it('открывает редактор фактической дозы отдельным действием', async () => {
    context.current = createContext();
    let screen: ReturnType<typeof create>;
    await act(async () => { screen = create(<TodayScreen isLargeText={false} />); });

    await act(async () => {
      screen!.root.findByProps({ accessibilityLabel: 'Изменить дозу приёма Препарат' }).props.onPress();
    });

    expect(screen!.root.findByProps({ accessibilityLabel: `Редактор дозы ${intake.id}` })).toBeTruthy();
  });
});
