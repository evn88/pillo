import { Pressable, Text } from 'react-native';
import { act, create } from 'react-test-renderer';
import { expect, it, vi } from 'vitest';

import { SwipeableCard } from '../swipeable-card';

it('даёт карточке доступное имя и удаляет через accessibility action', async () => {
  const onDelete = vi.fn();
  const onPress = vi.fn();
  let screen: ReturnType<typeof create>;
  await act(async () => {
    screen = create(
      <SwipeableCard
        accessibilityLabel="Изменить препарат витамин D"
        deleteColor="#ff0000"
        onDelete={onDelete}
        onPress={onPress}
      >
        <Text>Витамин D</Text>
      </SwipeableCard>
    );
  });
  const deleteAction = screen!.root.findByProps({ accessibilityLabel: 'Удалить' });
  const card = screen!.root
    .findAllByProps({ accessibilityLabel: 'Изменить препарат витамин D' })
    .find(node => Array.isArray(node.props.accessibilityActions));

  if (!card) throw new Error('Не найдена доступная карточка препарата.');

  expect(deleteAction.props.accessible).toBe(false);
  expect(deleteAction.props.importantForAccessibility).toBe('no-hide-descendants');
  expect(card.props.accessibilityActions).toContainEqual({ name: 'delete', label: 'Удалить' });

  await act(async () => {
    card.props.onAccessibilityAction({ nativeEvent: { actionName: 'delete' } });
  });

  expect(onDelete).toHaveBeenCalledOnce();
  expect(onPress).not.toHaveBeenCalled();
});

it('держит действия вне области нажатия редактирования карточки', async () => {
  const edit = vi.fn();
  const record = vi.fn();
  let screen: ReturnType<typeof create>;
  await act(async () => {
    screen = create(<SwipeableCard accessibilityLabel="Изменить препарат" deleteColor="#ff0000" onDelete={vi.fn()} onPress={edit} footer={<Pressable accessibilityLabel="Записать приём" onPress={record}><Text>Записать приём</Text></Pressable>}><Text>Препарат</Text></SwipeableCard>);
  });
  const editArea = screen!.root.findAllByProps({ accessibilityLabel: 'Изменить препарат' }).find(node => node.props.accessibilityActions);
  expect(editArea?.findAllByProps({ accessibilityLabel: 'Записать приём' })).toHaveLength(0);
  await act(async () => { screen!.root.findByProps({ accessibilityLabel: 'Записать приём' }).props.onPress(); });
  expect(record).toHaveBeenCalledOnce();
  expect(edit).not.toHaveBeenCalled();
  await act(async () => { screen!.unmount(); });
});
