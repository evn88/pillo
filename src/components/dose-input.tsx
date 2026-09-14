import { useState } from 'react';
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
  const [customRequested, setCustomRequested] = useState(false);
  const normalizedValue = Number(value.trim().replace(',', '.'));

  const isPreset = dosePresets.some(preset => Number(preset.value.replace(',', '.')) === normalizedValue);
  const showCustom = customRequested || !isPreset;

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: palette.text }]}>{label}</Text>
      <View accessibilityLabel="Быстрый выбор дозы" accessibilityRole="radiogroup" style={styles.presets}>
        {dosePresets.map(preset => {
          const selected = !showCustom && Number.isFinite(normalizedValue) && normalizedValue === Number(preset.value.replace(',', '.'));
          return (
            <Pressable
              accessibilityLabel={preset.accessibilityLabel}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected, disabled }}
              disabled={disabled}
              key={preset.value}
              onPress={() => {
                setCustomRequested(false);
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
        <Pressable accessibilityLabel="Другое количество" accessibilityRole="radio"
          accessibilityState={{ checked: showCustom, disabled }} disabled={disabled}
          onPress={() => setCustomRequested(true)}
          style={({ pressed }) => [styles.preset, { backgroundColor: showCustom ? palette.primary : palette.surfaceMuted, borderColor: showCustom ? palette.primary : palette.border }, (pressed || disabled) && styles.pressed]}>
          <Text style={[styles.presetText, { color: showCustom ? palette.surface : palette.text }]}>Другое</Text>
        </Pressable>
      </View>
      {showCustom ? <View style={[styles.inputControl, { backgroundColor: palette.surface, borderColor: error ? palette.danger : palette.border }]}>
        <TextInput
          autoFocus={customRequested}
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
      </View> : null}
      <Text style={[styles.hint, { color: palette.textMuted }]}>Для произвольного количества выберите «Другое».</Text>
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
    minWidth: 44,
    paddingHorizontal: spacing.md
  },
  presetText: { fontSize: 18, fontWeight: '700' },
  inputControl: { alignItems: 'center', borderRadius: radii.md, borderWidth: 1, flexDirection: 'row', minHeight: 54, paddingHorizontal: spacing.lg },
  input: { flex: 1, fontSize: 20, fontVariant: ['tabular-nums'], paddingVertical: spacing.md },
  unit: { fontSize: 15, marginLeft: spacing.sm },
  hint: { fontSize: 13, lineHeight: 18 },
  error: { fontSize: 13, lineHeight: 18 },
  pressed: { opacity: 0.72 }
});
