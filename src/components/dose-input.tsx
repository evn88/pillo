import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, radii, spacing } from '@/theme/tokens';

const dosePresets = [
  { accessibilityLabel: 'Четверть единицы', label: '¼', value: '0,25' },
  { accessibilityLabel: 'Половина единицы', label: '½', value: '0,5' },
  { accessibilityLabel: 'Одна единица', label: '1', value: '1' },
  { accessibilityLabel: 'Две единицы', label: '2', value: '2' }
] as const;

export const DoseInput = ({
  disabled = false,
  error,
  isDark,
  label = 'Доза',
  onBlur,
  onChange,
  value
}: {
  disabled?: boolean;
  error?: string;
  isDark: boolean;
  label?: string;
  onBlur: () => void;
  onChange: (value: string) => void;
  value: string;
}) => {
  const palette = isDark ? colors.dark : colors.light;
  const normalizedValue = Number(value.trim().replace(',', '.'));

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: palette.text }]}>{label}</Text>
      <View accessibilityLabel="Быстрый выбор дозы" accessibilityRole="radiogroup" style={styles.presets}>
        {dosePresets.map(preset => {
          const selected = Number.isFinite(normalizedValue) && normalizedValue === Number(preset.value.replace(',', '.'));
          return (
            <Pressable
              accessibilityLabel={preset.accessibilityLabel}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected, disabled }}
              disabled={disabled}
              key={preset.value}
              onPress={() => {
                onChange(preset.value);
                onBlur();
              }}
              style={({ pressed }) => [
                styles.preset,
                { backgroundColor: selected ? palette.primary : palette.surfaceMuted, borderColor: selected ? palette.primary : palette.border },
                (pressed || disabled) && styles.pressed
              ]}
            >
              <Text style={[styles.presetText, { color: selected ? palette.surface : palette.text }]}>{preset.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={[styles.inputControl, { backgroundColor: palette.surface, borderColor: error ? palette.danger : palette.border }]}>
        <TextInput
          accessibilityHint={error}
          accessibilityLabel="Количество препарата"
          editable={!disabled}
          keyboardAppearance={isDark ? 'dark' : 'light'}
          keyboardType="decimal-pad"
          maxLength={14}
          onBlur={onBlur}
          onChangeText={onChange}
          selectTextOnFocus
          selectionColor={palette.primary}
          style={[styles.input, { color: palette.text }]}
          value={value}
        />
        <Text style={[styles.unit, { color: palette.textMuted }]}>ед.</Text>
      </View>
      <Text style={[styles.hint, { color: palette.textMuted }]}>Выберите ¼, ½, 1, 2 или введите своё количество.</Text>
      {error ? <Text accessibilityRole="alert" style={[styles.error, { color: palette.danger }]}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  field: { gap: spacing.sm },
  label: { fontSize: 16, fontWeight: '700' },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  preset: {
    alignItems: 'center',
    borderRadius: radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 56,
    paddingHorizontal: spacing.lg
  },
  presetText: { fontSize: 18, fontWeight: '700' },
  inputControl: { alignItems: 'center', borderRadius: radii.md, borderWidth: 1, flexDirection: 'row', minHeight: 54, paddingHorizontal: spacing.lg },
  input: { flex: 1, fontSize: 20, fontVariant: ['tabular-nums'], paddingVertical: spacing.md },
  unit: { fontSize: 15, marginLeft: spacing.sm },
  hint: { fontSize: 13, lineHeight: 18 },
  error: { fontSize: 13, lineHeight: 18 },
  pressed: { opacity: 0.72 }
});
