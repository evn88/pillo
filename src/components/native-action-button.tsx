import { AppSymbol } from './app-symbol';
import { Platform, Pressable, StyleSheet } from 'react-native';
import { Button as UniversalButton, Host as UniversalHost } from '@expo/ui';
import { Button as SwiftUIButton, Host as SwiftUIHost } from '@expo/ui/swift-ui';
import {
  accessibilityLabel,
  buttonBorderShape,
  buttonStyle,
  controlSize,
  disabled as disabledModifier,
  frame,
  foregroundStyle,
  labelStyle,
  tint
} from '@expo/ui/swift-ui/modifiers';
import type { SFSymbol } from 'sf-symbols-typescript';

type NativeActionButtonProps = {
  accessibilityText?: string;
  compact?: boolean;
  disabled?: boolean;
  fill?: boolean;
  fullWidth?: boolean;
  isDark: boolean;
  iconOnly?: boolean;
  toolbar?: boolean;
  role?: 'cancel';
  label: string;
  onPress: () => void;
  tintColor: string;
  tone?: 'primary' | 'secondary' | 'danger';
  systemImage?: SFSymbol;
};

export const NativeActionButton = ({
  accessibilityText,
  compact = false,
  disabled = false,
  fill = false,
  fullWidth = false,
  isDark,
  iconOnly = false,
  toolbar = false,
  role,
  label,
  onPress,
  systemImage,
  tintColor,
  tone = 'primary'
}: NativeActionButtonProps) => {
  const isDanger = tone === 'danger';
  const hostStyle = [styles.host, fullWidth && styles.fullWidthHost, fill && styles.fillHost, iconOnly && styles.iconOnlyHost];
  const buttonFrame = fullWidth || fill
    ? frame({ maxWidth: 1000, minHeight: 44 })
    : frame({ minHeight: 44 });

  if (Platform.OS === 'ios') {
    return (
      <SwiftUIHost ignoreSafeArea="all" colorScheme={isDark ? 'dark' : 'light'} matchContents={!fullWidth && !fill} style={hostStyle}>
        <SwiftUIButton
          label={label}
          onPress={onPress}
          role={isDanger ? 'destructive' : role}
          systemImage={systemImage}
          modifiers={[
            buttonStyle(tone === 'primary' ? (Number.parseInt(String(Platform.Version), 10) >= 26 ? 'glassProminent' : 'borderedProminent') : tone === 'secondary' ? (toolbar && Number.parseInt(String(Platform.Version), 10) >= 26 ? 'glass' : 'bordered') : 'borderless'),
            buttonBorderShape(iconOnly ? 'circle' : 'capsule'),
            controlSize(compact && !toolbar ? 'regular' : 'large'),
            disabledModifier(disabled),
            iconOnly ? frame({ width: 44, height: 44 }) : buttonFrame,
            ...(iconOnly ? [labelStyle('iconOnly')] : []),
            tint(tintColor),
            accessibilityLabel(accessibilityText ?? label),
            ...(tone === 'primary' && !disabled ? [foregroundStyle(disabled ? (isDark ? '#FFFFFF' : '#343434') : isDark ? '#343434' : '#FFFFFF')] : [])
          ]}
        />
      </SwiftUIHost>
    );
  }

  if (iconOnly) return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityText ?? label}
    accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.iconOnlyHost, { alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.4 : pressed ? 0.7 : 1 }]}>
    <AppSymbol name={systemImage ?? 'arrow.uturn.backward'} fallback={label} color={tintColor} />
  </Pressable>;

  return (
    <UniversalHost colorScheme={isDark ? 'dark' : 'light'} matchContents={!fullWidth && !fill} seedColor={tintColor} style={hostStyle}>
      <UniversalButton
        disabled={disabled}
        label={systemImage === 'plus' ? `＋  ${label}` : label}
        modifiers={[accessibilityLabel(accessibilityText ?? label)]}
        onPress={onPress}
        variant={tone === 'primary' ? 'filled' : 'outlined'}
        style={{ ...styles.universalButton, ...(fullWidth ? styles.fullWidthButton : {}) }}
      />
    </UniversalHost>
  );
};

export const NativePrimaryButton = ({ disabled = false, isDark, label, onPress, tintColor }: Pick<NativeActionButtonProps, 'disabled' | 'isDark' | 'label' | 'onPress' | 'tintColor'>) => (
  <NativeActionButton
    disabled={disabled}
    fullWidth
    isDark={isDark}
    label={label}
    onPress={onPress}
    systemImage="plus"
    tintColor={tintColor}
  />
);

export const NativeHistoryButton = ({ isDark, onPress, tintColor }: Pick<NativeActionButtonProps, 'isDark' | 'onPress' | 'tintColor'>) => {
  if (Platform.OS === 'ios') {
    return (
      <SwiftUIHost ignoreSafeArea="all" colorScheme={isDark ? 'dark' : 'light'} style={styles.iconHost}>
        <SwiftUIButton
          label="История"
          onPress={onPress}
          systemImage="clock.arrow.circlepath"
          modifiers={[
            buttonStyle(Number.parseInt(String(Platform.Version), 10) >= 26 ? 'glass' : 'bordered'),
            buttonBorderShape('circle'),
            controlSize('extraLarge'),
            frame({ width: 56, height: 48 }),
            labelStyle('iconOnly'),
            accessibilityLabel('История приёма'),
            tint(tintColor)
          ]}
        />
      </SwiftUIHost>
    );
  }

  return (
    <UniversalHost colorScheme={isDark ? 'dark' : 'light'} seedColor={tintColor} style={styles.historyHost}>
      <UniversalButton label="История" onPress={onPress} style={styles.universalHistory} variant="outlined" />
    </UniversalHost>
  );
};

const styles = StyleSheet.create({
  host: { minHeight: 48 },
  iconOnlyHost: { width: 48, height: 48, flexShrink: 0 },
  fullWidthHost: { alignSelf: 'stretch' },
  fillHost: { flex: 1 },
  iconHost: { height: 60, width: 60 },
  historyHost: { minHeight: 48 },
  universalButton: { borderRadius: 999, height: 48 },
  fullWidthButton: { alignSelf: 'stretch' },
  universalHistory: { borderRadius: 999, height: 48 }
});
