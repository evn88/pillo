import { useEffect, useId, useState } from 'react';
import { AccessibilityInfo, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, usePathname } from 'expo-router';
import { Button, GlassEffectContainer, Host, HStack, Image, Namespace } from '@expo/ui/swift-ui';
import { accessibilityAddTraits, accessibilityLabel, animation, Animation, background, buttonStyle, disabled, frame, glassEffect, glassEffectId, padding, shapes } from '@expo/ui/swift-ui/modifiers';
import { useScreenPrimaryAction } from './screen-actions';
import type { PilloPalette } from '@/theme/use-pillo-theme';
import { spacing } from '@/theme/tokens';

const tabs = [
  { path: '/', label: 'Сегодня', icon: 'house', selectedIcon: 'house.fill' },
  { path: '/medications', label: 'Препараты', icon: 'pill', selectedIcon: 'pill.fill' },
  { path: '/schedule', label: 'Расписание', icon: 'calendar', selectedIcon: 'calendar' },
  { path: '/settings', label: 'Настройки', icon: 'gearshape', selectedIcon: 'gearshape.fill' }
] as const;
const barHeight = 64;

type Props = { isDark: boolean; palette: PilloPalette; onManualIntake: () => void; disabled: boolean };

export const GlassTabBar = ({ isDark, palette, onManualIntake, disabled: isDisabled }: Props) => {
  const pathname = usePathname();
  const namespaceId = useId();
  const [reduceMotion, setReduceMotion] = useState(true);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [reduceTransparency, setReduceTransparency] = useState(true);
  useEffect(() => {
    void AccessibilityInfo.isReduceTransparencyEnabled().then(setReduceTransparency);
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const motionSubscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceTransparencyChanged', setReduceTransparency);
    return () => { subscription.remove(); motionSubscription.remove(); };
  }, []);
  const primaryAction = useScreenPrimaryAction();
  const barWidth = Math.min(width - insets.left - insets.right - spacing.lg * 2, 600);
  const showAction = pathname !== '/settings';
  const groupWidth = showAction ? barWidth - barHeight - spacing.md : barWidth;
  const actionLabel = primaryAction?.label ?? 'Отметить приём';
  return <View pointerEvents="box-none" style={[styles.position, { bottom: Math.max(insets.bottom, spacing.sm) }]}>
    <Host ignoreSafeArea="all" colorScheme={isDark ? 'dark' : 'light'} style={{ width: barWidth, height: barHeight }}>
      <Namespace id={namespaceId}>
        <GlassEffectContainer spacing={spacing.sm} modifiers={[
          animation(Animation.spring({ duration: reduceMotion || reduceTransparency ? 0 : 0.45 }), showAction)
        ]}>
          <HStack spacing={spacing.md}>
            <HStack spacing={0} modifiers={[
              padding({ all: spacing.xs }),
              frame({ width: groupWidth, height: barHeight }),
              ...(reduceTransparency ? [background(palette.surface, shapes.capsule())] : [
                glassEffect({ glass: { variant: 'regular' }, shape: 'capsule' }),
                glassEffectId('navigation', namespaceId)
              ])
            ]}>
              {tabs.map(tab => {
                const selected = pathname === tab.path;
                return <Button key={tab.path} onPress={() => router.navigate(tab.path)} modifiers={[
                  buttonStyle('plain'), accessibilityLabel(tab.label),
                  accessibilityAddTraits(selected ? ['isSelected'] : []),
                  background(selected ? palette.primarySoft : 'transparent', shapes.capsule())
                ]}>
                  <Image systemName={selected ? tab.selectedIcon : tab.icon} size={25}
                    color={selected ? palette.primary : palette.textMuted}
                    modifiers={[frame({ width: (groupWidth - spacing.xs * 2) / tabs.length, height: barHeight - spacing.xs * 2 })]} />
                </Button>;
              })}
            </HStack>
            {showAction ? <Button onPress={primaryAction?.onPress ?? onManualIntake} modifiers={[
              buttonStyle('plain'),
              ...(reduceTransparency ? [background(palette.surface, shapes.circle())] : [
                glassEffect({ glass: { variant: 'regular', interactive: true }, shape: 'circle' }),
                glassEffectId('primary-action', namespaceId)
              ]),
              disabled(primaryAction ? Boolean(primaryAction.disabled) : isDisabled), accessibilityLabel(actionLabel)
            ]}>
              <Image systemName="plus" size={26} color={palette.primary} modifiers={[frame({ width: barHeight, height: barHeight })]} />
            </Button> : null}
          </HStack>
        </GlassEffectContainer>
      </Namespace>
    </Host>
  </View>;
};

const styles = StyleSheet.create({
  position: { position: 'absolute', left: 0, right: 0, alignItems: 'center' }
});
