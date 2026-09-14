import { Controller, useForm, useWatch } from 'react-hook-form';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { CommandResult } from '@/application/contracts';
import type { Intake, Medication } from '@/domain/types';
import { parseQuantity } from '@/domain/validation';
import { manualIntakeResolver, type ManualIntakeFormValues } from '@/hooks/form-schema';
import { useFormCommand } from '@/hooks/use-form-command';
import { colors, radii, spacing } from '@/theme/tokens';
import { DoseInput } from './dose-input';
import { ActionButton, Surface } from './ui';

const formatDose = (value: number): string => `${String(value).replace('.', ',')} ед.`;

export const ScheduledIntakeSheet = ({ intake, isDark, medication, onClose, onSave }: {
  intake: Intake;
  isDark: boolean;
  medication: Medication;
  onClose: () => void;
  onSave: (intakeId: string, doseUnits: number, commandId?: string) => Promise<CommandResult>;
}) => {
  const palette = isDark ? colors.dark : colors.light;
  const { isPending, error, submit } = useFormCommand();
  const { control, formState: { errors }, handleSubmit } = useForm<ManualIntakeFormValues>({
    defaultValues: { medicationId: medication.id, dose: String(intake.doseUnits).replace('.', ',') },
    mode: 'onBlur',
    reValidateMode: 'onChange',
    resolver: manualIntakeResolver(new Set([medication.id]))
  });
  const dose = useWatch({ control, name: 'dose' });
  const previewDose = Number(dose.trim().replace(',', '.'));
  const hasStockDiscrepancy = Number.isFinite(previewDose) && previewDose > medication.stockUnits;
  const handleSave = handleSubmit(async values => {
    await submit(
      commandId => onSave(intake.id, parseQuantity(values.dose, 'Количество', true), commandId),
      onClose,
      JSON.stringify(values)
    );
  });

  return (
    <Modal animationType="slide" onRequestClose={() => { if (!isPending) onClose(); }} presentationStyle={Platform.OS === 'ios' ? 'formSheet' : 'fullScreen'} visible>
      <KeyboardAvoidingView behavior={Platform.OS === 'android' ? 'height' : undefined} style={[styles.container, { backgroundColor: palette.background }]}>
        <View style={[styles.toolbar, { borderBottomColor: palette.border }]}>
          <ActionButton toolbar role="cancel" accessibilityText="Закрыть без отметки" label="Закрыть" disabled={isPending} onPress={onClose} palette={palette} tone="secondary" />
          <ActionButton toolbar
            disabled={isPending}
            label={isPending ? 'Отмечаем…' : 'Отметить приём'}
            onPress={() => void handleSave()}
            palette={palette}
          />
        </View>
        <ScrollView automaticallyAdjustKeyboardInsets contentContainerStyle={styles.content} keyboardDismissMode="interactive" keyboardShouldPersistTaps="handled">
          <View style={styles.heading}>
            <Text style={[styles.title, { color: palette.text }]}>Фактическая доза</Text>
            <Text style={[styles.description, { color: palette.textMuted }]}>По расписанию — {formatDose(intake.doseUnits)} Изменение сохранится только для этого приёма.</Text>
          </View>

          <Surface palette={palette} style={styles.medicationCard}>
            <Text style={[styles.medicationName, { color: palette.text }]}>{medication.name}</Text>
            <Text style={[styles.medicationMeta, { color: palette.textMuted }]}>{[medication.dosage, medication.form, `${intake.localTime}`].filter(Boolean).join(' · ')}</Text>
          </Surface>

          <Controller control={control} name="dose" render={({ field }) => (
            <DoseInput
              disabled={isPending}
              error={errors.dose?.message}
              isDark={isDark}
              label="Сколько приняли?"
              onBlur={field.onBlur}
              onChange={field.onChange}
              value={field.value}
            />
          )} />

          {hasStockDiscrepancy ? <View accessibilityRole="alert" style={[styles.warning, { backgroundColor: palette.warningSoft }]}>
            <Text style={[styles.warningText, { color: palette.warning }]}>В учёте осталось {medication.stockUnits} ед. Приём сохранится, а остаток станет 0.</Text>
          </View> : null}
          {error ? <Text accessibilityRole="alert" style={[styles.commandError, { color: palette.danger }]}>{error}</Text> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  toolbar: { alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'space-between', minHeight: 60, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  closeButton: { justifyContent: 'center', minHeight: 48, paddingHorizontal: spacing.sm },
  closeText: { fontSize: 17 },
  content: { alignSelf: 'center', gap: spacing.xl, maxWidth: 600, padding: spacing.xl, paddingBottom: spacing.xxl * 2, width: '100%' },
  heading: { gap: spacing.sm },
  title: { fontSize: 27, fontWeight: '800', letterSpacing: -0.5 },
  description: { fontSize: 15, lineHeight: 21 },
  medicationCard: { gap: spacing.xs },
  medicationName: { fontSize: 18, fontWeight: '700' },
  medicationMeta: { fontSize: 14, lineHeight: 19 },
  warning: { borderRadius: radii.md, padding: spacing.lg },
  warningText: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  commandError: { fontSize: 14, lineHeight: 20 },
  pressed: { opacity: 0.7 }
});
