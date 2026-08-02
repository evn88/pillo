import { useRef, type ReactNode } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View
} from 'react-native';

const actionWidth = 92;
const fullSwipeThreshold = 148;

type SwipeableCardProps = {
  children: ReactNode;
  deleteColor: string;
  onDelete: () => void;
  onPress: () => void;
};

export const SwipeableCard = ({ children, deleteColor, onDelete, onPress }: SwipeableCardProps) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const currentOffset = useRef(0);

  const animateTo = (value: number) => {
    currentOffset.current = value;
    Animated.spring(translateX, {
      damping: 22,
      mass: 0.8,
      stiffness: 240,
      toValue: value,
      useNativeDriver: true
    }).start();
  };

  const deleteCard = () => {
    animateTo(0);
    onDelete();
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 8 && Math.abs(gesture.dx) > Math.abs(gesture.dy) && gesture.dx < 0,
      onPanResponderGrant: () => {
        translateX.stopAnimation();
      },
      onPanResponderMove: (_, gesture) => {
        const nextValue = Math.max(-fullSwipeThreshold, Math.min(0, currentOffset.current + gesture.dx));
        translateX.setValue(nextValue);
      },
      onPanResponderRelease: (_, gesture) => {
        const nextValue = currentOffset.current + gesture.dx;

        if (nextValue <= -fullSwipeThreshold + 8) {
          deleteCard();
          return;
        }

        animateTo(nextValue < -actionWidth / 2 ? -actionWidth : 0);
      },
      onPanResponderTerminate: () => animateTo(0)
    })
  ).current;

  const handlePress = () => {
    if (currentOffset.current !== 0) {
      animateTo(0);
      return;
    }

    onPress();
  };

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityLabel="Удалить"
        accessibilityRole="button"
        onPress={deleteCard}
        style={[styles.deleteAction, { backgroundColor: deleteColor }]}
      >
        <Text style={styles.deleteIcon}>⌫</Text>
        <Text style={styles.deleteLabel}>Удалить</Text>
      </Pressable>
      <Animated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
        <Pressable
          accessibilityActions={[{ name: 'activate', label: 'Изменить' }, { name: 'delete', label: 'Удалить' }]}
          accessibilityHint="Нажмите для редактирования. Смахните влево для удаления."
          accessibilityRole="button"
          onAccessibilityAction={event => event.nativeEvent.actionName === 'delete' ? deleteCard() : handlePress()}
          onPress={handlePress}
        >
          {children}
        </Pressable>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { borderCurve: 'continuous', borderRadius: 18, overflow: 'hidden' },
  deleteAction: {
    alignItems: 'center',
    bottom: 0,
    gap: 4,
    justifyContent: 'center',
    position: 'absolute',
    right: 0,
    top: 0,
    width: actionWidth
  },
  deleteIcon: { color: '#FFFFFF', fontSize: 22, fontWeight: '700' },
  deleteLabel: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' }
});
