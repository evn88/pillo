import { Pressable, Text } from 'react-native';
import { act, create } from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';

import { MedicationForm } from '../medication-form';

vi.mock('../native-action-button', () => ({
  NativeActionButton: ({ disabled, label, onPress }: { disabled?: boolean; label: string; onPress: () => void }) => (
    <Pressable accessibilityLabel={label} accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}>
      <Text>{label}</Text>
    </Pressable>
  )
}));

vi.mock('../../hooks/use-form-command', () => ({
  useFormCommand: () => ({
    error: null,
    isPending: false,
    submit: async (save: (commandId: string) => Promise<{ ok: boolean }>, onSuccess: () => void) => {
      const result = await save('test-command');
      if (result.ok) onSuccess();
    }
  })
}));

describe('MedicationForm', () => {
  it('показывает ошибку имени у поля и не отправляет невалидные данные', async () => {
    const onSave = vi.fn().mockResolvedValue({ ok: true });

    let screen: ReturnType<typeof create>;
    await act(async () => {
      screen = create(
        <MedicationForm
          isDark={false}
          medication={null}
          newId="m1"
          onClose={vi.fn()}
          onSave={onSave}
          visible
        />
      );
    });
    await act(async () => {
      screen!.root.findByProps({ accessibilityLabel: 'Название препарата' }).props.onChangeText('');
      screen!.root.findByProps({ accessibilityLabel: 'Сохранить' }).props.onPress();
    });

    expect(screen!.root.findByProps({ accessibilityRole: 'alert' }).props.children).toBe('Название: заполните поле.');
    expect(onSave).not.toHaveBeenCalled();
  });
});
