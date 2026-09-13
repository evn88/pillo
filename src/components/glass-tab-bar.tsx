import { useEffect, useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, usePathname } from 'expo-router';
import { Button, Host, HStack, RNHostView } from '@expo/ui/swift-ui';
import { accessibilityLabel, background, buttonBorderShape, buttonStyle, controlSize, disabled, frame, glassEffect, labelStyle, shapes, tint } from '@expo/ui/swift-ui/modifiers';
import { AppSymbol } from './app-symbol';
import { useScreenPrimaryAction } from './screen-actions';
import type { PilloPalette } from '@/theme/use-pillo-theme';
import { spacing } from '@/theme/tokens';

const tabs = [
  { path: '/', label: 'Сегодня', icon: 'house', selectedIcon: 'house.fill' },
  { path: '/medications', label: 'Препараты', icon: 'pill', selectedIcon: 'pill.fill' },
  { path: '/schedule', label: 'Расписание', icon: 'calendar', selectedIcon: 'calendar' },
  { path: '/settings', label: 'Настройки', icon: 'gearshape', selectedIcon: 'gearshape.fill' }
] as const;

type Props = { isDark: boolean; palette: PilloPalette; onManualIntake: () => void; disabled: boolean };

export const GlassTabBar = ({ isDark, palette, onManualIntake, disabled: isDisabled }: Props) => {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [reduceTransparency, setReduceTransparency] = useState(true);
  useEffect(() => {
    void AccessibilityInfo.isReduceTransparencyEnabled().then(setReduceTransparency);
    const subscription = AccessibilityInfo.addEventListener('reduceTransparencyChanged', setReduceTransparency);
    return () => subscription.remove();
  }, []);
  const primaryAction = useScreenPrimaryAction();
  const barWidth = Math.min(width - insets.left - insets.right - spacing.lg * 2, 600);
  const groupWidth = barWidth - 56 - spacing.md;
  const actionLabel = primaryAction?.label ?? 'Отметить приём';
  return <View pointerEvents="box-none" style={[styles.position, { bottom: Math.max(insets.bottom, spacing.sm) }]}>
    <Host colorScheme={isDark ? 'dark' : 'light'} style={{ width: barWidth, height: 64 }}>
      <HStack spacing={spacing.md}>
        <HStack modifiers={[
          ...(reduceTransparency ? [background(palette.surface, shapes.capsule())] : [glassEffect({ glass: { variant: 'regular' }, shape: 'capsule' })])
        ]}>
        <RNHostView matchContents>
          <View style={[styles.tabs, { width: groupWidth }]}>
            {tabs.map(tab => {
              const selected = pathname === tab.path;
              return <Pressable key={tab.path} accessibilityRole="tab" accessibilityLabel={tab.label}
                accessibilityState={{ selected }} onPress={() => router.navigate(tab.path)}
                style={({ pressed }) => [styles.tab, { backgroundColor: selected ? palette.primarySoft : 'transparent', opacity: pressed ? 0.7 : 1 }]}>
                <AppSymbol name={selected ? tab.selectedIcon : tab.icon} fallback={tab.label} color={selected ? palette.primary : palette.textMuted} />
                <Text numberOfLines={1} maxFontSizeMultiplier={1.2} style={[styles.label, { color: selected ? palette.primary : palette.textMuted }]}>{tab.label}</Text>
              </Pressable>;
            })}
          </View>
        </RNHostView>
        </HStack>
        <Button label={actionLabel} systemImage="plus" onPress={primaryAction?.onPress ?? onManualIntake} modifiers={[
          buttonStyle(reduceTransparency ? 'bordered' : 'glass'), buttonBorderShape('circle'), controlSize('extraLarge'),
          frame({ width: 56, height: 56 }), labelStyle('iconOnly'), tint(palette.primary),
          disabled(primaryAction ? Boolean(primaryAction.disabled) : isDisabled), accessibilityLabel(actionLabel)
        ]} />
      </HStack>
    </Host>
  </View>;
};

const styles = StyleSheet.create({
  position: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  tabs: { height: 64, padding: spacing.xs, flexDirection: 'row', alignItems: 'center' },
  tab: { flex: 1, minWidth: 44, minHeight: 52, borderRadius: 28, alignItems: 'center', justifyContent: 'center', gap: 2 },
  label: { fontSize: 10, fontWeight: '600' }
});
