import { Pressable } from 'react-native';
import { useState } from 'react';
import { act, create } from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';

import { DoseInput } from '../dose-input';

describe('Выбор дозы', () => {
  it('показывает поле по выбору «Другое» и скрывает при возврате к пресету', async () => {
    const Form = () => {
      const [value, setValue] = useState('1');
      return <DoseInput isDark={false} onBlur={vi.fn()} onChange={setValue} value={value} />;
    };
    let screen: ReturnType<typeof create>;
    await act(async () => { screen = create(<Form />); });
    expect(screen!.root.findAllByProps({ accessibilityLabel: 'Количество препарата' })).toHaveLength(0);
    await act(async () => { screen!.root.findByProps({ accessibilityLabel: 'Другое количество' }).props.onPress(); });
    const input = screen!.root.findByProps({ accessibilityLabel: 'Количество препарата' });
    expect(input.props.value).toBe('1');
    await act(async () => { input.props.onChangeText('0,75'); });
    expect(screen!.root.findByProps({ accessibilityLabel: 'Количество препарата' }).props.value).toBe('0,75');
    await act(async () => { screen!.root.findByProps({ accessibilityLabel: 'Половина единицы' }).props.onPress(); });
    expect(screen!.root.findAllByProps({ accessibilityLabel: 'Количество препарата' })).toHaveLength(0);
    expect(screen!.root.findByProps({ accessibilityLabel: 'Половина единицы' }).props.accessibilityState.checked).toBe(true);
    await act(async () => { screen!.unmount(); });
  });

  it('сразу показывает сохранённую нестандартную дозу без вызова клавиатуры', async () => {
    let screen: ReturnType<typeof create>;
    await act(async () => { screen = create(<DoseInput isDark value="0,75" onBlur={vi.fn()} onChange={vi.fn()} />); });
    const input = screen!.root.findByProps({ accessibilityLabel: 'Количество препарата' });
    expect(input.props.value).toBe('0,75');
    expect(input.props.autoFocus).toBe(false);
    await act(async () => { screen!.unmount(); });
  });

  it('подставляет половину единицы из быстрого выбора', async () => {
    const onBlur = vi.fn();
    const onChange = vi.fn();
    let screen: ReturnType<typeof create>;
    await act(async () => {
      screen = create(<DoseInput isDark={false} onBlur={onBlur} onChange={onChange} value="1" />);
    });

    await act(async () => {
      screen!.root.findAllByType(Pressable).find(node => node.props.accessibilityLabel === 'Половина единицы')?.props.onPress();
    });

    expect(onChange).toHaveBeenCalledWith('0,5');
    expect(onBlur).toHaveBeenCalledOnce();
  });

  it('помечает выбранное дробное значение', async () => {
    let screen: ReturnType<typeof create>;
    await act(async () => {
      screen = create(<DoseInput isDark onBlur={vi.fn()} onChange={vi.fn()} value="0.25" />);
    });

    expect(screen!.root.findAllByType(Pressable).find(node => node.props.accessibilityLabel === 'Четверть единицы')?.props.accessibilityState.checked).toBe(true);
  });
});
