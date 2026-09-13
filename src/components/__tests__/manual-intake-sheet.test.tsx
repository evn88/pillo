import { Pressable, Text } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';
import { ManualIntakeSheet } from '../manual-intake-sheet';
import { medication } from '../../domain/__tests__/fixtures';

vi.mock('expo-router', () => ({ router: { navigate: vi.fn() } }));
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

const medications = [
  { ...medication, id: 'm1', name: 'Первый препарат', stockUnits: 20 },
  { ...medication, id: 'm2', name: 'Другой препарат', stockUnits: 20 }
];
const secondLabel = 'Выбрать Другой препарат, 10 мг, таблетка';

describe('Ручной приём', () => {
  it('позволяет сменить препарат при открытии из карточки и сохраняет выбранный ID с дозой', async () => {
    const onSave = vi.fn().mockResolvedValue({ ok: true });
    const onClose = vi.fn();
    let screen: ReactTestRenderer;
    await act(async () => { screen = create(<ManualIntakeSheet initialMedicationId="m1" isDark={false} medications={medications} onClose={onClose} onSave={onSave} visible />); });
    await act(async () => { screen!.root.findByProps({ accessibilityLabel: secondLabel }).props.onPress(); });
    expect(screen!.root.findByProps({ accessibilityLabel: secondLabel }).props.accessibilityState.checked).toBe(true);
    await act(async () => {
      screen!.root.findByProps({ accessibilityLabel: 'Количество препарата' }).props.onChangeText('0,5');
    });
    await act(async () => { screen!.root.findByProps({ accessibilityLabel: 'Записать приём' }).props.onPress(); });
    expect(onSave).toHaveBeenCalledWith('m2', 0.5, 'test-command');
    expect(onClose).toHaveBeenCalledOnce();
    await act(async () => { screen!.unmount(); });
  });

  it('требует явного выбора из общего входа, поддерживает поиск и закрытие без записи', async () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    let screen: ReactTestRenderer;
    await act(async () => { screen = create(<ManualIntakeSheet isDark medications={medications} onClose={onClose} onSave={onSave} visible />); });
    expect(screen!.root.findByProps({ accessibilityLabel: 'Записать приём' }).props.disabled).toBe(true);
    await act(async () => { screen!.root.findByProps({ accessibilityLabel: 'Найти препарат' }).props.onChangeText('ДРУГОЙ'); });
    expect(screen!.root.findAllByProps({ accessibilityLabel: 'Выбрать Первый препарат, 10 мг, таблетка' })).toHaveLength(0);
    await act(async () => { screen!.root.findByProps({ accessibilityLabel: secondLabel }).props.onPress(); });
    expect(screen!.root.findByProps({ accessibilityLabel: 'Записать приём' }).props.disabled).toBe(false);
    await act(async () => { screen!.root.findByProps({ accessibilityLabel: 'Закрыть без сохранения' }).props.onPress(); });
    expect(onSave).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledOnce();
    await act(async () => { screen!.unmount(); });
  });
});
