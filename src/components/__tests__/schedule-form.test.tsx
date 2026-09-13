import { Pressable, Text } from 'react-native';
import { act, create } from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';

import { medication } from '@/domain/__tests__/fixtures';
import { ScheduleForm } from '../schedule-form';

vi.mock('expo-router', () => ({ router: { navigate: vi.fn() } }));
vi.mock('../app-symbol', () => ({ AppSymbol: () => null }));
vi.mock('../medication-picker-sheet', () => ({ MedicationPickerSheet: () => null }));
vi.mock('../schedule-date-input', () => ({ ScheduleDateInput: () => null }));
vi.mock('../native-action-button', () => ({
  NativeActionButton: ({ disabled, label, onPress }: { disabled?: boolean; label: string; onPress: () => void }) => (
    <Pressable accessibilityLabel={label} disabled={disabled} onPress={onPress}><Text>{label}</Text></Pressable>
  )
}));
vi.mock('../../hooks/use-form-command', () => ({
  useFormCommand: () => ({ error: null, isPending: false, submit: async (save: (id: string) => Promise<{ ok: boolean }>, close: () => void) => {
    if ((await save('test-command')).ok) close();
  } })
}));

describe('Форма расписания', () => {
  it('сохраняет половину единицы как дозу одного приёма', async () => {
    const onClose = vi.fn();
    const onSave = vi.fn().mockResolvedValue({ ok: true });
    let screen: ReturnType<typeof create>;
    await act(async () => {
      screen = create(<ScheduleForm isDark={false} medications={[medication]} newId="r-new" onClose={onClose} onSave={onSave} rule={null} visible />);
    });

    await act(async () => {
      screen!.root.findAllByType(Pressable).find(node => node.props.accessibilityLabel === 'Половина единицы')?.props.onPress();
      screen!.root.findByProps({ accessibilityLabel: 'Сохранить' }).props.onPress();
    });

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ doseUnits: 0.5, medicationId: medication.id }), 'test-command');
    expect(onClose).toHaveBeenCalledOnce();
  });
});
