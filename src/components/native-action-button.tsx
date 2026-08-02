import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Button as UniversalButton, Host as UniversalHost } from '@expo/ui';
import { Button as SwiftUIButton, Host as SwiftUIHost } from '@expo/ui/swift-ui';
import {
  accessibilityLabel,
  buttonBorderShape,
  buttonStyle,
  controlSize,
  disabled as disabledModifier,
  frame,
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
  const { width } = useWindowDimensions();
  const buttonWidth = Math.min(width - 64, 720);
  const isDanger = tone === 'danger';
  const hostStyle = [styles.host, fullWidth && [styles.fullWidthHost, { width: buttonWidth }], fill && styles.fillHost];
  const buttonFrame = fullWidth
    ? frame({ width: buttonWidth, height: 56 })
    : fill
      ? frame({ maxWidth: 1000, minHeight: 56 })
      : frame({ minHeight: 56 });

  if (Platform.OS === 'ios') {
    return (
      <SwiftUIHost colorScheme={isDark ? 'dark' : 'light'} matchContents={!fullWidth && !fill} style={hostStyle}>
        <SwiftUIButton
          label={label}
          onPress={onPress}
          role={isDanger ? 'destructive' : undefined}
          systemImage={systemImage}
          modifiers={[
            buttonStyle('glass'),
            buttonBorderShape('capsule'),
            controlSize('extraLarge'),
            disabledModifier(disabled),
            buttonFrame,
            tint(tintColor)
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
        variant="outlined"
        style={{ ...styles.universalButton, ...(fullWidth ? { width: buttonWidth } : {}) }}
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
            frame({ width: 56, height: 56 }),
            labelStyle('iconOnly'),
            accessibilityLabel('История приёма'),
            tint(tintColor)
          ]}
        />
      </SwiftUIHost>
    );
  }

  return (
    <View accessibilityLabel="История приёма" accessibilityRole="button" style={styles.iconHost}>
      <UniversalHost colorScheme={isDark ? 'dark' : 'light'} seedColor={tintColor} style={styles.iconHost}>
        <UniversalButton label="↶" onPress={onPress} style={styles.universalIcon} />
      </UniversalHost>
    </View>
  );
};

const styles = StyleSheet.create({
  host: { height: 60 },
  fullWidthHost: { alignSelf: 'center' },
  fillHost: { flex: 1, width: '100%' },
  iconHost: { height: 60, width: 60 },
  universalButton: { borderRadius: 999, height: 56 },
  universalIcon: { borderRadius: 999, height: 56, width: 56 }
});
