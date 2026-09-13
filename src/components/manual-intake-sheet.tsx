import type { CommandResult } from '../application/contracts';
import { manualIntakeResolver, type ManualIntakeFormValues } from '../hooks/form-schema';
import { parseQuantity } from '../domain/validation';
import { useFormCommand } from '../hooks/use-form-command';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import type { Medication } from '@/domain/types';
import { useLargeTextLayout } from '@/hooks/use-large-text-layout';
import { colors, radii, spacing } from '@/theme/tokens';
import { ActionButton } from './ui';

type ManualIntakeSheetProps = {
  initialMedicationId?: string;
  isDark: boolean;
  medications: Medication[];
  onClose: () => void;
  onSave: (medicationId: string, doseUnits: number, commandId?: string) => Promise<CommandResult>;
  visible: boolean;
};

export const ManualIntakeSheet = ({ initialMedicationId, isDark, medications, onClose, onSave, visible }: ManualIntakeSheetProps) => {
  const palette = isDark ? colors.dark : colors.light;
  const isLargeText = useLargeTextLayout();
  const { control, formState: { errors }, handleSubmit } = useForm<ManualIntakeFormValues>({
    defaultValues: { medicationId: initialMedicationId ?? medications[0]?.id ?? '', dose: '1' },
    mode: 'onBlur',
    reValidateMode: 'onChange',
    resolver: manualIntakeResolver(new Set(medications.map(medication => medication.id)))
  });
  const { isPending, error, submit } = useFormCommand();
  const medicationId = useWatch({ control, name: 'medicationId' });
  const dose = useWatch({ control, name: 'dose' });
  const selectedMedication = medications.find(medication => medication.id === medicationId);
  const previewDose = Number(dose.trim().replace(',', '.'));
  const hasStockDiscrepancy = selectedMedication && Number.isFinite(previewDose) && previewDose > selectedMedication.stockUnits;

  const handleSave = handleSubmit(async values => {
    if (isPending) return;
    await submit(commandId => onSave(values.medicationId, parseQuantity(values.dose, 'Количество', true), commandId), onClose, JSON.stringify(values));
  });

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle={Platform.OS === 'ios' ? 'formSheet' : 'fullScreen'}
      visible={visible}
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.container, { backgroundColor: palette.background }]}>
        <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled">
          <View style={[styles.heading, isLargeText && styles.headingLarge]}>
            <View style={[styles.headingCopy, isLargeText && styles.headingCopyLarge]}>
              <Text style={[styles.title, { color: palette.text }]}>{initialMedicationId ? 'Принять сейчас' : 'Ручная отметка приёма'}</Text>
              <Text style={[styles.description, { color: palette.textMuted }]}>{initialMedicationId ? 'Укажите фактически принятую дозу. Она будет списана из учётного запаса.' : 'Используйте этот сценарий, если приняли препарат вне расписания.'}</Text>
            </View>
            <ActionButton label="Закрыть" onPress={onClose} palette={palette} tone="secondary" />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: palette.text }]}>Препарат</Text>
            <Controller control={control} name="medicationId" render={({ field }) => (
              <View accessibilityLabel="Препарат" accessibilityRole="radiogroup" style={styles.options}>
                {medications.filter(medication => !initialMedicationId || medication.id === initialMedicationId).map(medication => {
                  const selected = medication.id === field.value;

                  return (
                    <Pressable
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected }}
                      key={medication.id}
                      onPress={initialMedicationId ? undefined : () => field.onChange(medication.id)}
                      style={({ pressed }) => [
                        styles.option,
                        {
                          backgroundColor: selected ? palette.primarySoft : palette.surface,
                          borderColor: selected ? palette.primary : palette.border
                        },
                        pressed && styles.pressed
                      ]}
                    >
                      <Text style={[styles.optionText, { color: selected ? palette.primary : palette.text }]}>{medication.name}</Text>
                      <Text style={[styles.optionMeta, { color: palette.textMuted }]}>{medication.dosage || medication.form}</Text>
                    </Pressable>
                  );
                })}
              </View>
            )} />
            {errors.medicationId?.message ? <Text accessibilityRole="alert" style={[styles.fieldError, { color: palette.danger }]}>{errors.medicationId.message}</Text> : null}
          </View>

          {hasStockDiscrepancy ? (
            <View accessibilityRole="alert" style={[styles.warning, { backgroundColor: palette.warningSoft }]}>
              <Text style={[styles.warningText, { color: palette.warning }]}>Учётный запас меньше указанной дозы: {selectedMedication.stockUnits} из {previewDose} ед. Приём сохранится, а остаток станет 0. Проверьте фактический запас и скорректируйте карточку препарата.</Text>
            </View>
          ) : null}

          <View style={styles.field}>
            <Text style={[styles.label, { color: palette.text }]}>Количество</Text>
            <Controller control={control} name="dose" render={({ field }) => (
              <TextInput
                accessibilityHint={errors.dose?.message}
                accessibilityLabel="Количество препарата"
                keyboardAppearance={isDark ? 'dark' : 'light'}
                keyboardType="decimal-pad"
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                selectionColor={palette.primary}
                style={[styles.input, { backgroundColor: palette.surface, borderColor: errors.dose ? palette.danger : palette.border, color: palette.text }]}
                value={field.value}
              />
            )} />
            <Text style={[styles.hint, { color: palette.textMuted }]}>Можно указать целое число или дробь: 0,5; 1; 1,5.</Text>
            {errors.dose?.message ? <Text accessibilityRole="alert" style={[styles.fieldError, { color: palette.danger }]}>{errors.dose.message}</Text> : null}
          </View>

          {error ? <Text accessibilityRole="alert" style={{ color: palette.danger }}>{error}</Text> : null}
          <View style={styles.actions}>
            <ActionButton label="Отмена" onPress={onClose} palette={palette} tone="secondary" />
            <ActionButton
              disabled={isPending}
              label={isPending ? 'Сохраняем…' : 'Отметить вручную'}
              onPress={() => void handleSave()}
              palette={palette}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { alignSelf: 'center', gap: spacing.xl, maxWidth: 680, padding: spacing.xl, width: '100%' },
  heading: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.lg },
  headingLarge: { flexDirection: 'column' },
  headingCopy: { flex: 1, gap: spacing.sm },
  headingCopyLarge: { flex: undefined, width: '100%' },
  title: { fontSize: 27, fontWeight: '800', letterSpacing: -0.6 },
  description: { fontSize: 15, lineHeight: 21 },
  field: { gap: spacing.md },
  fieldError: { fontSize: 13, lineHeight: 18 },
  label: { fontSize: 16, fontWeight: '700' },
  options: { gap: spacing.sm },
  option: { borderRadius: radii.md, borderWidth: 1, minHeight: 64, padding: spacing.lg },
  optionText: { fontSize: 16, fontWeight: '700' },
  optionMeta: { fontSize: 13, marginTop: spacing.xs },
  input: { borderRadius: radii.md, borderWidth: 1, fontSize: 18, minHeight: 56, paddingHorizontal: spacing.lg },
  hint: { fontSize: 13, lineHeight: 19 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, justifyContent: 'flex-end' },
  pressed: { opacity: 0.7 },
  warning: { borderRadius: radii.md, padding: spacing.lg },
  warningText: { fontSize: 14, fontWeight: '700', lineHeight: 20 }
});
