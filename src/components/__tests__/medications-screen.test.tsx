import { FlatList, Pressable, Text, View } from 'react-native';
import { act, create } from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';

import type { PilloContextValue } from '@/application/contracts';
import { medication, snapshot } from '@/domain/__tests__/fixtures';
import { colors } from '@/theme/tokens';
import { MedicationsScreen } from '@/screens/medications-screen';

const context = vi.hoisted(() => ({ current: {} as PilloContextValue }));

vi.mock('@/providers/pillo-provider', () => ({ usePilloContext: () => context.current }));
vi.mock('@/theme/use-pillo-theme', () => ({ usePilloTheme: () => ({ isDark: false, palette: colors.light }) }));
vi.mock('@/components/app-symbol', () => ({ AppSymbol: () => null }));
vi.mock('@/components/manual-intake-sheet', () => ({ ManualIntakeSheet: () => null }));
vi.mock('@/components/medication-form', () => ({ MedicationForm: () => null }));
vi.mock('@/components/screen-actions', () => ({ ScreenActions: () => null }));
vi.mock('@/components/swipeable-card', () => ({ SwipeableCard: ({ children, footer, trailingAction }: { children: React.ReactNode; footer?: React.ReactNode; trailingAction?: React.ReactNode }) => <View>{children}{trailingAction}{footer}</View> }));
vi.mock('@/components/ui', () => ({
  ActionButton: ({ accessibilityText, label, onPress }: { accessibilityText?: string; label: string; onPress: () => void }) => <Pressable accessibilityLabel={accessibilityText ?? label} onPress={onPress}><Text>{label}</Text></Pressable>,
  Surface: ({ children }: { children: React.ReactNode }) => <View>{children}</View>
}));

const createContext = (): PilloContextValue => ({
  status: 'unlocked',
  snapshot: { ...snapshot, medications: [{ ...medication, id: 'm1', name: 'Омега 3' }, { ...medication, id: 'm2', name: 'Ксалол' }] },
  calendarCoverage: [], error: null, isSaving: false,
  notificationStatus: 'ready', notificationError: null, notificationAccess: null, coverageEndsAt: null,
  retry: vi.fn(), retryNotifications: vi.fn(), openNotificationSettings: vi.fn(), createMedicationId: vi.fn(() => 'new'),
  saveMedication: vi.fn(), deleteMedication: vi.fn(), addPackage: vi.fn().mockResolvedValue({ ok: true }), saveScheduleRule: vi.fn(),
  deleteScheduleRule: vi.fn(), takeScheduledIntake: vi.fn(), setIntakeStatus: vi.fn(), takeMedicationNow: vi.fn(), updateSettings: vi.fn(), clearData: vi.fn()
});

describe('Список препаратов', () => {
  it('использует одну колонку на iPhone и не объединяет действия карточки', async () => {
    context.current = createContext();
    let screen: ReturnType<typeof create>;
    await act(async () => { screen = create(<MedicationsScreen isLargeText={false} isTablet={false} />); });

    expect(screen!.root.findByType(FlatList).props.numColumns).toBe(1);
    expect(screen!.root.findAllByType(Pressable).filter(node => node.props.accessibilityLabel === 'Записать приём препарата Омега 3')).toHaveLength(0);
    const addPackageButton = screen!.root.findAllByType(Pressable).find(node => node.props.accessibilityLabel === 'Добавить упаковку препарата Омега 3');
    if (!addPackageButton) throw new Error('Не найдена кнопка добавления упаковки.');
    await act(async () => { addPackageButton.props.onPress(); });
    expect(context.current.addPackage).toHaveBeenCalledWith('m1');
    await act(async () => { screen!.unmount(); });
  });

  it('переходит на две колонки только на iPad с обычным размером текста', async () => {
    context.current = createContext();
    let screen: ReturnType<typeof create>;
    await act(async () => { screen = create(<MedicationsScreen isLargeText={false} isTablet />); });
    expect(screen!.root.findByType(FlatList).props.numColumns).toBe(2);
    await act(async () => { screen!.update(<MedicationsScreen isLargeText isTablet />); });
    expect(screen!.root.findByType(FlatList).props.numColumns).toBe(1);
    await act(async () => { screen!.unmount(); });
  });
});
