import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { radii, spacing } from '@/theme/tokens';

type Palette = {
  surface: string;
  surfaceMuted: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
  primarySoft: string;
  danger: string;
};

export const SectionHeading = ({
  action,
  description,
  palette,
  title
}: {
  action?: ReactNode;
  description?: string;
  palette: Palette;
  title: string;
}) => (
  <View style={styles.headingRow}>
    <View style={styles.headingCopy}>
      <Text style={[styles.heading, { color: palette.text }]}>{title}</Text>
      {description ? (
        <Text style={[styles.description, { color: palette.textMuted }]}>{description}</Text>
      ) : null}
    </View>
    {action}
  </View>
);

export const ActionButton = ({
  disabled,
  label,
  onPress,
  palette,
  tone = 'primary'
}: {
  disabled?: boolean;
  label: string;
  onPress: () => void;
  palette: Palette;
  tone?: 'primary' | 'secondary' | 'danger';
}) => {
  const backgroundColor =
    tone === 'primary' ? palette.primary : tone === 'danger' ? 'transparent' : palette.surfaceMuted;
  const color = tone === 'primary' ? palette.surface : tone === 'danger' ? palette.danger : palette.text;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor, borderColor: tone === 'danger' ? palette.danger : 'transparent' },
        pressed && styles.pressed,
        disabled && styles.disabled
      ]}
    >
      <Text style={[styles.buttonLabel, { color }]}>{label}</Text>
    </Pressable>
  );
};

export const Surface = ({
  children,
  palette,
  style
}: {
  children: ReactNode;
  palette: Palette;
  style?: ViewStyle;
}) => (
  <View style={[styles.surface, { backgroundColor: palette.surface, borderColor: palette.border }, style]}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  headingRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.lg,
    justifyContent: 'space-between'
  },
  headingCopy: { flex: 1, gap: spacing.xs },
  heading: { fontSize: 24, fontWeight: '700', letterSpacing: -0.4 },
  description: { fontSize: 14, lineHeight: 20, maxWidth: 620 },
  button: {
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md
  },
  buttonLabel: { fontSize: 14, fontWeight: '700' },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.45 },
  surface: { borderRadius: radii.lg, borderWidth: 1, padding: spacing.lg }
});
