import { act, create } from 'react-test-renderer';
import { Text } from 'react-native';
import { expect, it, vi } from 'vitest';
import { SwipeActionsRow } from '../swipe-actions-row';

vi.mock('../app-symbol', () => ({ AppSymbol: () => null }));

it('свайп раскрывает кнопки, но даже полное смахивание не выполняет действие', async () => {
  const changeDose = vi.fn();
  const take = vi.fn();
  let screen: ReturnType<typeof create>;
  await act(async () => {
    screen = create(<SwipeActionsRow label="Препарат, половина" backgroundColor="#fff" onActivate={take}
      actions={[{ id: 'dose', label: 'Доза', icon: 'slider.horizontal.3', color: '#934562', onPress: changeDose }]}><Text>Препарат</Text></SwipeActionsRow>);
  });
  const gesture = screen!.root.findAll(node => Boolean(node.props.onMoveShouldSetPanResponder))[0]!;
  expect(gesture.props.onMoveShouldSetPanResponder(null, { dx: -12, dy: 40 })).toBe(false);
  expect(gesture.props.onMoveShouldSetPanResponder(null, { dx: -40, dy: 5 })).toBe(true);
  await act(async () => { gesture.props.onPanResponderRelease(null, { dx: -400, dy: 0 }); });
  expect(changeDose).not.toHaveBeenCalled();
  expect(take).not.toHaveBeenCalled();
  expect(screen!.root.findByProps({ accessibilityLabel: 'Закрыть действия' })).toBeTruthy();
  await act(async () => { screen!.root.findByProps({ accessibilityLabel: 'Доза' }).props.onPress(); });
  expect(changeDose).toHaveBeenCalledOnce();
  expect(screen!.root.findAllByProps({ accessibilityLabel: 'Закрыть действия' })).toHaveLength(0);
  await act(async () => { screen!.unmount(); });
});

it('дублирует действия для VoiceOver и блокирует их во время сохранения', async () => {
  const skip = vi.fn();
  const render = (disabled: boolean) => <SwipeActionsRow label="Препарат" backgroundColor="#fff" disabled={disabled} onActivate={vi.fn()}
    actions={[{ id: 'skip', label: 'Пропустить', icon: 'forward.end', color: '#666', onPress: skip }]}><Text>Препарат</Text></SwipeActionsRow>;
  let screen: ReturnType<typeof create>;
  await act(async () => { screen = create(render(false)); });
  const row = () => screen!.root.findAll(node => Boolean(node.props.onAccessibilityAction))[0]!;
  await act(async () => { row().props.onAccessibilityAction({ nativeEvent: { actionName: 'skip' } }); });
  expect(skip).toHaveBeenCalledOnce();
  await act(async () => { screen!.update(render(true)); });
  await act(async () => { row().props.onAccessibilityAction({ nativeEvent: { actionName: 'skip' } }); });
  expect(skip).toHaveBeenCalledOnce();
  await act(async () => { screen!.unmount(); });
});
