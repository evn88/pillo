import { Pressable, Text } from 'react-native';
import type { ReactNode } from 'react';
import { act, create } from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';

import { MedicationForm } from '../medication-form';

vi.mock('@/hooks/use-medication-photo', () => ({ useMedicationPhoto: () => ({ photo: null, isPicking: false, error: null, choose: vi.fn(), remove: vi.fn(), save: (fn: () => Promise<unknown>) => fn() }) }));
vi.mock('../medication-photo-field', () => ({ MedicationPhotoField: () => null }));

vi.mock('@expo/ui/swift-ui', () => ({
  Host: ({ children }: { children: ReactNode }) => children,
  Picker: ({ children, label, onSelectionChange }: { children: ReactNode; label: string; onSelectionChange: (value: string) => void }) => (
    <Pressable accessibilityLabel={label} onPress={() => onSelectionChange('капсула')}>{children}</Pressable>
  ),
  Text: ({ children }: { children: ReactNode }) => <Text>{children}</Text>
}));

vi.mock('@expo/ui/swift-ui/modifiers', () => ({
  disabled: vi.fn(),
  pickerStyle: vi.fn(),
  tag: vi.fn(),
  tint: vi.fn()
}));

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
      screen!.root.findByProps({ accessibilityLabel: 'Добавить' }).props.onPress();
    });

    expect(screen!.root.findByProps({ accessibilityRole: 'alert' }).props.children).toBe('Название: заполните поле.');
    expect(onSave).not.toHaveBeenCalled();
  });

  it('сохраняет понятные значения по умолчанию и выбранную лекарственную форму', async () => {
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
      screen!.root.findByProps({ accessibilityLabel: 'Название препарата' }).props.onChangeText('Витамин D');
      screen!.root.findByProps({ accessibilityLabel: 'Выбрать форму' }).props.onPress();
      screen!.root.findByProps({ accessibilityLabel: 'Добавить' }).props.onPress();
    });

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      dosage: '',
      form: 'капсула',
      id: 'm1',
      minThresholdUnits: 5,
      name: 'Витамин D',
      stockUnits: 0,
      unitsPerPackage: 30
    }), 'test-command');
  });

  it('не подменяет нестандартную форму при редактировании', async () => {
    const onSave = vi.fn().mockResolvedValue({ ok: true });

    let screen: ReturnType<typeof create>;
    await act(async () => {
      screen = create(
        <MedicationForm
          isDark={false}
          medication={{
            createdAt: '2026-09-13T00:00:00.000Z',
            dosage: '',
            form: 'пластырь',
            id: 'm1',
            isActive: true,
            minThresholdUnits: 5,
            name: 'Препарат',
            stockUnits: 0,
            unitsPerPackage: 30,
            updatedAt: '2026-09-13T00:00:00.000Z'
          }}
          newId="unused"
          onClose={vi.fn()}
          onSave={onSave}
          visible
        />
      );
    });

    expect(screen!.root.findByProps({ accessibilityLabel: 'Другая лекарственная форма' }).props.value).toBe('пластырь');
  });
});
