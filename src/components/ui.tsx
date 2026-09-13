import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { NativeActionButton } from '@/components/native-action-button';
import { colors, radii, spacing } from '@/theme/tokens';

type Palette = {
  background: string;
  surface: string;
  surfaceMuted: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
  primarySoft: string;
  danger: string;
};

export const ActionButton = ({
  disabled,
  fill,
  label,
  onPress,
  palette,
  tone = 'primary'
}: {
  disabled?: boolean;
  fill?: boolean;
  label: string;
  onPress: () => void;
  palette: Palette;
  tone?: 'primary' | 'secondary' | 'danger';
}) => {
  return (
    <NativeActionButton
      disabled={disabled}
      fill={fill}
      isDark={palette === colors.dark}
      label={label}
      onPress={onPress}
      tintColor={tone === 'danger' ? palette.danger : palette.primary}
      tone={tone}
    />
  );
};

export const Surface = ({
  children,
  palette,
  style
}: {
  children: ReactNode;
  palette: Palette;
  style?: StyleProp<ViewStyle>;
}) => (
  <View style={[styles.surface, { backgroundColor: palette.surface, borderColor: palette.border }, style]}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  surface: { borderRadius: radii.lg, borderWidth: 1, padding: spacing.lg }
});
