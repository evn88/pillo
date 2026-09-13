import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, PanResponder, Pressable, StyleSheet, Text, View, type GestureResponderEvent, type PanResponderGestureState } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';
import { AppSymbol } from './app-symbol';
import { radii, spacing } from '@/theme/tokens';

export type RowAction = { id: string; label: string; icon: SFSymbol; color: string; onPress: () => void };
type Props = { children: ReactNode; actions: RowAction[]; label: string; onActivate: () => void; disabled?: boolean; backgroundColor: string };

export const SwipeActionsRow = ({ children, actions, label, onActivate, disabled = false, backgroundColor }: Props) => {
  const [offset] = useState(() => new Animated.Value(0));
  const [isOpen, setOpen] = useState(false);
  const [responder, setResponder] = useState<ReturnType<typeof PanResponder.create> | null>(null);
  const position = useRef(0);
  const reduceMotion = useRef(false);
  const width = actions.length * 76;
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(value => { reduceMotion.current = value; });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', value => { reduceMotion.current = value; });
    return () => subscription.remove();
  }, []);
  const close = () => { position.current = 0; offset.setValue(0); setOpen(false); };
  useEffect(() => {
    if (disabled) offset.stopAnimation(() => { position.current = 0; offset.setValue(0); setOpen(false); });
  }, [disabled, offset]);
  useEffect(() => {
    const settle = (open: boolean) => {
      const target = open ? -width : 0;
      position.current = target;
      setOpen(open);
      if (reduceMotion.current) offset.setValue(target);
      else Animated.spring(offset, { toValue: target, damping: 24, stiffness: 240, mass: 0.8, useNativeDriver: true }).start();
    };
    const wantsGesture = (_: GestureResponderEvent, gesture: PanResponderGestureState) => !disabled && Math.abs(gesture.dx) > 10 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.4 && (gesture.dx < 0 || position.current < 0);
    setResponder(PanResponder.create({
      onMoveShouldSetPanResponder: wantsGesture,
      onMoveShouldSetPanResponderCapture: wantsGesture,
      onPanResponderGrant: () => { offset.stopAnimation(value => { position.current = value; }); },
      onPanResponderMove: (_, gesture) => offset.setValue(Math.max(-width, Math.min(0, position.current + gesture.dx))),
      onPanResponderRelease: (_, gesture) => settle(position.current + gesture.dx < -width / 3),
      onPanResponderTerminate: () => settle(false)
    }));
  }, [disabled, offset, width]);
  const runAction = (action: RowAction) => { if (!disabled) { close(); action.onPress(); } };
  return <View style={[styles.container, { backgroundColor }]}>
    <View style={[styles.actions, { width }]} pointerEvents={isOpen ? 'auto' : 'none'} accessibilityElementsHidden={!isOpen} importantForAccessibility={isOpen ? 'auto' : 'no-hide-descendants'}>
      {actions.map(action => <Pressable key={action.id} accessibilityRole="button" accessibilityLabel={action.label} disabled={disabled}
        onPress={() => runAction(action)} style={({ pressed }) => [styles.action, { backgroundColor: action.color, opacity: pressed ? 0.7 : 1 }]}>
        <AppSymbol name={action.icon} fallback={action.label} color="#FFFFFF" />
        <Text style={styles.actionLabel}>{action.label}</Text>
      </Pressable>)}
    </View>
    <Animated.View {...responder?.panHandlers} style={{ transform: [{ translateX: offset }] }} accessible={!isOpen}
      accessibilityLabel={label} accessibilityRole="button" accessibilityState={{ disabled }}
      accessibilityHint="Смахните влево для дополнительных действий"
      accessibilityActions={isOpen ? [] : [{ name: 'activate', label: 'Отметить приём' }, { name: 'showActions', label: 'Показать действия' }, ...actions.map(action => ({ name: action.id, label: action.label }))]}
      onAccessibilityAction={event => {
        if (disabled) return;
        if (event.nativeEvent.actionName === 'activate') onActivate();
        else if (event.nativeEvent.actionName === 'showActions') { position.current = -width; offset.setValue(-width); setOpen(true); }
        else { const action = actions.find(item => item.id === event.nativeEvent.actionName); if (action) runAction(action); }
      }}>
      <View pointerEvents={isOpen ? 'none' : 'auto'} accessibilityElementsHidden={isOpen} importantForAccessibility={isOpen ? 'no-hide-descendants' : 'auto'}>{children}</View>
      {isOpen ? <Pressable accessibilityRole="button" accessibilityLabel="Закрыть действия" onPress={close} style={styles.cover} /> : null}
    </Animated.View>
  </View>;
};

const styles = StyleSheet.create({
  cover: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  container: { borderRadius: radii.lg, borderCurve: 'continuous', overflow: 'hidden' },
  actions: { position: 'absolute', top: 0, bottom: 0, right: 0, flexDirection: 'row' },
  action: { width: 76, minHeight: 44, paddingHorizontal: spacing.xs, alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  actionLabel: { color: '#FFFFFF', fontSize: 11, fontWeight: '600', textAlign: 'center' }
});
