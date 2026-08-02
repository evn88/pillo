import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Button as UniversalButton, Host as UniversalHost, Text as UniversalText } from '@expo/ui';
import { Button as SwiftUIButton, Host as SwiftUIHost } from '@expo/ui/swift-ui';
import {
  accessibilityLabel,
  buttonBorderShape,
  buttonStyle,
  controlSize,
  frame,
  labelStyle,
  tint
} from '@expo/ui/swift-ui/modifiers';

type NativePrimaryButtonProps = {
  disabled?: boolean;
  isDark: boolean;
  label: string;
  onPress: () => void;
  tintColor: string;
};

export const NativePrimaryButton = ({ disabled = false, isDark, label, onPress, tintColor }: NativePrimaryButtonProps) => {
  const { width } = useWindowDimensions();
  const buttonWidth = Math.min(width - 64, 720);

  if (Platform.OS === 'ios') {
    return (
      <SwiftUIHost colorScheme={isDark ? 'dark' : 'light'} style={[styles.primaryHost, { width: buttonWidth }]}>
        <SwiftUIButton
          label={label}
          onPress={onPress}
          systemImage="plus"
          modifiers={[
            buttonStyle('glassProminent'),
            buttonBorderShape('capsule'),
            controlSize('extraLarge'),
            frame({ width: buttonWidth, height: 56 }),
            tint(tintColor)
          ]}
        />
      </SwiftUIHost>
    );
  }

  return (
    <UniversalHost colorScheme={isDark ? 'dark' : 'light'} seedColor={tintColor} style={[styles.primaryHost, { width: buttonWidth }]}>
      <UniversalButton disabled={disabled} label={`＋  ${label}`} onPress={onPress} style={{ borderRadius: 999, height: 56, width: buttonWidth }} />
    </UniversalHost>
  );
};

export const NativeHistoryButton = ({ isDark, onPress, tintColor }: Pick<NativePrimaryButtonProps, 'isDark' | 'onPress' | 'tintColor'>) => {
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
        <UniversalButton onPress={onPress} style={styles.universalIcon}>
          <UniversalText textStyle={styles.universalIconText}>↶</UniversalText>
        </UniversalButton>
      </UniversalHost>
    </View>
  );
};

const styles = StyleSheet.create({
  primaryHost: { height: 60, width: '100%' },
  iconHost: { height: 60, width: 60 },
  universalIcon: { borderRadius: 999, height: 56, width: 56 },
  universalIconText: { fontSize: 24, fontWeight: '600' }
});
