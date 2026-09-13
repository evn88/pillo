import { Pressable, Text, View } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PilloContextValue } from '@/application/contracts';
import { emptySnapshot } from '@/domain/types';
import { colors } from '@/theme/tokens';
import { SettingsScreen } from '@/screens/settings-screen';

const context = vi.hoisted(() => ({ current: {} as PilloContextValue }));

vi.mock('@/providers/pillo-provider', () => ({ usePilloContext: () => context.current }));
vi.mock('@/theme/use-pillo-theme', () => ({ usePilloTheme: () => ({ isDark: false, palette: colors.light }) }));
vi.mock('@/components/app-symbol', () => ({ AppSymbol: () => null }));
vi.mock('@/components/theme-picker', () => ({ ThemePicker: () => null }));
vi.mock('@/components/ui', () => ({
  ActionButton: ({ label, onPress }: { label: string; onPress: () => void }) => <Pressable accessibilityLabel={label} accessibilityRole="button" onPress={onPress}><Text>{label}</Text></Pressable>,
  Surface: ({ children }: { children: React.ReactNode }) => <View>{children}</View>
}));

const createContext = (overrides: Partial<PilloContextValue> = {}): PilloContextValue => ({
  status: 'unlocked',
  snapshot: { ...emptySnapshot, settings: { ...emptySnapshot.settings, notificationsEnabled: true } },
  calendarCoverage: [],
  error: null,
  isSaving: false,
  notificationStatus: 'ready',
  notificationError: null,
  notificationAccess: { authorization: 'granted', exact: 'system', channel: 'unsupported', canAskAgain: false, requested: false },
  coverageEndsAt: '2026-09-20T10:00:00.000Z',
  retry: vi.fn(),
  retryNotifications: vi.fn(),
  openNotificationSettings: vi.fn().mockResolvedValue({ ok: true }),
  createMedicationId: vi.fn(),
  saveMedication: vi.fn(),
  deleteMedication: vi.fn(),
  addPackage: vi.fn(),
  saveScheduleRule: vi.fn(),
  deleteScheduleRule: vi.fn(),
  setIntakeStatus: vi.fn(),
  takeMedicationNow: vi.fn(),
  updateSettings: vi.fn(),
  clearData: vi.fn(),
  ...overrides
});

const renderSettings = async () => {
  let screen: ReactTestRenderer;
  await act(async () => { screen = create(<SettingsScreen isLargeText={false} />); });
  return screen!;
};

beforeEach(() => { context.current = createContext(); });

describe('Восстановление системных напоминаний', () => {
  it('не показывает ручное обновление при исправной синхронизации', async () => {
    const screen = await renderSettings();

    expect(screen.root.findAllByProps({ accessibilityLabel: 'Обновить напоминания' })).toHaveLength(0);
    expect(screen.root.findAllByProps({ accessibilityLabel: 'Повторить обновление' })).toHaveLength(0);
    await act(async () => { screen.unmount(); });
  });

  it('предлагает повторить только после ошибки синхронизации', async () => {
    const retryNotifications = vi.fn();
    context.current = createContext({ notificationStatus: 'error', notificationError: 'Ошибка синхронизации', retryNotifications });
    const screen = await renderSettings();

    await act(async () => { screen.root.findByProps({ accessibilityLabel: 'Повторить обновление' }).props.onPress(); });
    expect(retryNotifications).toHaveBeenCalledOnce();
    await act(async () => { screen.unmount(); });
  });

  it('ведёт в системные настройки при окончательном запрете', async () => {
    const openNotificationSettings = vi.fn().mockResolvedValue({ ok: true });
    context.current = createContext({
      notificationStatus: 'blocked',
      notificationAccess: { authorization: 'denied', exact: 'system', channel: 'unsupported', canAskAgain: false, requested: true },
      openNotificationSettings
    });
    const screen = await renderSettings();

    expect(screen.root.findAllByProps({ accessibilityLabel: 'Разрешить уведомления' })).toHaveLength(0);
    await act(async () => { screen.root.findByProps({ accessibilityLabel: 'Открыть настройки уведомлений' }).props.onPress(); });
    expect(openNotificationSettings).toHaveBeenCalledOnce();
    await act(async () => { screen.unmount(); });
  });
});
