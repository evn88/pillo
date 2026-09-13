import { Pressable } from 'react-native';
import { act, create } from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';

import { DoseInput } from '../dose-input';

describe('Выбор дозы', () => {
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
