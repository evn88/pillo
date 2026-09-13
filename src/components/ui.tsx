import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';

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
  accessibilityText,
  compact,
  disabled,
  fill,
  label,
  onPress,
  palette,
  systemImage,
  tone = 'primary'
}: {
  accessibilityText?: string;
  compact?: boolean;
  disabled?: boolean;
  fill?: boolean;
  label: string;
  onPress: () => void;
  palette: Palette;
  systemImage?: SFSymbol;
  tone?: 'primary' | 'secondary' | 'danger';
}) => {
  return (
    <NativeActionButton
      accessibilityText={accessibilityText}
      compact={compact}
      disabled={disabled}
      fill={fill}
      isDark={palette === colors.dark}
      label={label}
      onPress={onPress}
      systemImage={systemImage}
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
