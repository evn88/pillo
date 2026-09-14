import { Pressable, Text } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';
import { ManualIntakeSheet } from '../manual-intake-sheet';
import { medication } from '../../domain/__tests__/fixtures';

vi.mock('expo-router', () => ({ router: { navigate: vi.fn() } }));
vi.mock('../app-symbol', () => ({ AppSymbol: () => null }));
vi.mock('../native-action-button', () => ({
  NativeActionButton: ({ accessibilityText, disabled, label, onPress }: { accessibilityText?: string; disabled?: boolean; label: string; onPress: () => void }) => (
    <Pressable accessibilityLabel={accessibilityText ?? label} disabled={disabled} onPress={onPress}><Text>{label}</Text></Pressable>
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
    await act(async () => { screen!.root.findByProps({ accessibilityLabel: 'Выбран препарат Первый препарат. Изменить' }).props.onPress(); });
    await act(async () => { screen!.root.findByProps({ accessibilityLabel: secondLabel }).props.onPress(); });
    expect(screen!.root.findByProps({ accessibilityLabel: 'Выбран препарат Другой препарат. Изменить' })).toBeTruthy();
    expect(screen!.root.findAllByProps({ accessibilityLabel: secondLabel })).toHaveLength(0);
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
    await act(async () => { screen!.root.findByProps({ accessibilityLabel: 'Выбрать препарат' }).props.onPress(); });
    await act(async () => { screen!.root.findByProps({ accessibilityLabel: 'Найти препарат' }).props.onChangeText('ДРУГОЙ'); });
    expect(screen!.root.findAllByProps({ accessibilityLabel: 'Выбрать Первый препарат, 10 мг, таблетка' })).toHaveLength(0);
    await act(async () => { screen!.root.findByProps({ accessibilityLabel: secondLabel }).props.onPress(); });
    expect(screen!.root.findByProps({ accessibilityLabel: 'Записать приём' }).props.disabled).toBe(false);
    await act(async () => { screen!.root.findByProps({ accessibilityLabel: 'Закрыть без сохранения' }).props.onPress(); });
    expect(onSave).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledOnce();
    await act(async () => { screen!.unmount(); });
  });

  it('фильтрует длинный список в отдельном виртуализированном листе', async () => {
    const manyMedications = Array.from({ length: 120 }, (_, index) => ({
      ...medication,
      id: `m${index}`,
      name: `Препарат ${index}`,
      dosage: `${index} мг`
    }));
    let screen: ReactTestRenderer;
    await act(async () => { screen = create(<ManualIntakeSheet isDark={false} medications={manyMedications} onClose={vi.fn()} onSave={vi.fn()} visible />); });
    await act(async () => { screen!.root.findByProps({ accessibilityLabel: 'Выбрать препарат' }).props.onPress(); });
    expect(screen!.root.findByProps({ accessibilityLabel: 'Список препаратов' })).toBeTruthy();
    await act(async () => { screen!.root.findByProps({ accessibilityLabel: 'Найти препарат' }).props.onChangeText('119 мг'); });
    expect(screen!.root.findByProps({ accessibilityLabel: 'Выбрать Препарат 119, 119 мг, таблетка' })).toBeTruthy();
    expect(screen!.root.findAllByProps({ accessibilityLabel: 'Выбрать Препарат 11, 11 мг, таблетка' })).toHaveLength(0);
    await act(async () => { screen!.unmount(); });
  });
});
