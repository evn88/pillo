import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle
} from 'react-native';
import { AppSymbol } from './app-symbol';

const actionWidth = 92;
const fullSwipeThreshold = 148;

type SwipeableCardProps = {
  accessibilityLabel: string;
  children: ReactNode;
  footer?: ReactNode;
  deleteColor: string;
  onDelete: () => void;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

export const SwipeableCard = ({ accessibilityLabel, children, footer, deleteColor, onDelete, onPress, style }: SwipeableCardProps) => {
  const [translateX] = useState(() => new Animated.Value(0));
  const [panResponder, setPanResponder] = useState<ReturnType<typeof PanResponder.create> | null>(null);
  const currentOffset = useRef(0);

  const animateTo = useCallback((value: number) => {
    currentOffset.current = value;
    Animated.spring(translateX, {
      damping: 22,
      mass: 0.8,
      stiffness: 240,
      toValue: value,
      useNativeDriver: true
    }).start();
  }, [translateX]);

  const deleteCard = useCallback(() => {
    animateTo(0);
    onDelete();
  }, [animateTo, onDelete]);

  useEffect(() => {
    setPanResponder(PanResponder.create({
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
    }));
  }, [animateTo, deleteCard, translateX]);

  const handlePress = useCallback(() => {
    if (currentOffset.current !== 0) {
      animateTo(0);
      return;
    }

    onPress();
  }, [animateTo, onPress]);

  return (
    <View style={[styles.container, style]}>
      <Pressable
        accessible={false}
        accessibilityElementsHidden
        accessibilityLabel="Удалить"
        accessibilityRole="button"
        importantForAccessibility="no-hide-descendants"
        onPress={deleteCard}
        style={[styles.deleteAction, { backgroundColor: deleteColor }]}
      >
        <AppSymbol color="#FFFFFF" fallback="Удалить" name="trash.fill" />
        <Text style={styles.deleteLabel}>Удалить</Text>
      </Pressable>
      <Animated.View style={{ transform: [{ translateX }] }} {...panResponder?.panHandlers}>
        <Pressable
          accessibilityActions={[{ name: 'activate', label: 'Изменить' }, { name: 'delete', label: 'Удалить' }]}
          accessibilityHint="Нажмите для редактирования. Смахните влево для удаления."
          accessibilityLabel={accessibilityLabel}
          accessibilityRole="button"
          onAccessibilityAction={event => event.nativeEvent.actionName === 'delete' ? deleteCard() : handlePress()}
          onPress={handlePress}
        >
          {children}
        </Pressable>
        {footer}
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
  deleteLabel: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' }
});
