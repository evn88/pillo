import { Platform, StyleSheet } from 'react-native';
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
  disabled?: boolean;
  fill?: boolean;
  fullWidth?: boolean;
  isDark: boolean;
  label: string;
  onPress: () => void;
  tintColor: string;
  tone?: 'primary' | 'secondary' | 'danger';
  systemImage?: SFSymbol;
};

export const NativeActionButton = ({
  disabled = false,
  fill = false,
  fullWidth = false,
  isDark,
  label,
  onPress,
  systemImage,
  tintColor,
  tone = 'primary'
}: NativeActionButtonProps) => {
  const isDanger = tone === 'danger';
  const hostStyle = [styles.host, fullWidth && styles.fullWidthHost, fill && styles.fillHost];
  const buttonFrame = fullWidth || fill
    ? frame({ maxWidth: 1000, minHeight: 44 })
    : frame({ minHeight: 44 });

  if (Platform.OS === 'ios') {
    return (
      <SwiftUIHost colorScheme={isDark ? 'dark' : 'light'} matchContents={!fullWidth && !fill} style={hostStyle}>
        <SwiftUIButton
          label={label}
          onPress={onPress}
          role={isDanger ? 'destructive' : undefined}
          systemImage={systemImage}
          modifiers={[
            buttonStyle(tone === 'primary' ? (Number(Platform.Version) >= 26 ? 'glassProminent' : 'borderedProminent') : tone === 'secondary' ? 'bordered' : 'borderless'),
            buttonBorderShape('capsule'),
            controlSize('large'),
            disabledModifier(disabled),
            buttonFrame,
            tint(tintColor),
            ...(tone === 'primary' ? [foregroundStyle(isDark ? '#343434' : '#FFFFFF')] : [])
          ]}
        />
      </SwiftUIHost>
    );
  }

  return (
    <UniversalHost colorScheme={isDark ? 'dark' : 'light'} matchContents={!fullWidth && !fill} seedColor={tintColor} style={hostStyle}>
      <UniversalButton
        disabled={disabled}
        label={systemImage === 'plus' ? `＋  ${label}` : label}
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
      <SwiftUIHost colorScheme={isDark ? 'dark' : 'light'} style={styles.iconHost}>
        <SwiftUIButton
          label="История"
          onPress={onPress}
          systemImage="clock.arrow.circlepath"
          modifiers={[
            buttonStyle('glass'),
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
  fullWidthHost: { alignSelf: 'stretch' },
  fillHost: { flex: 1 },
  iconHost: { height: 60, width: 60 },
  historyHost: { minHeight: 48 },
  universalButton: { borderRadius: 999, height: 48 },
  fullWidthButton: { alignSelf: 'stretch' },
  universalHistory: { borderRadius: 999, height: 48 }
});
