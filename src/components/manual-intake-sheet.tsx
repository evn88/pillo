import { useState } from 'react';
import { router } from 'expo-router';
import type { CommandResult } from '../application/contracts';
import { manualIntakeResolver, type ManualIntakeFormValues } from '../hooks/form-schema';
import { parseQuantity } from '../domain/validation';
import { useFormCommand } from '../hooks/use-form-command';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { Medication } from '@/domain/types';
import { useLargeTextLayout } from '@/hooks/use-large-text-layout';
import { colors, radii, spacing } from '@/theme/tokens';
import { AppSymbol } from './app-symbol';
import { DoseInput } from './dose-input';
import { MedicationPickerSheet } from './medication-picker-sheet';
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
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const { control, formState: { errors }, handleSubmit } = useForm<ManualIntakeFormValues>({
    defaultValues: { medicationId: initialMedicationId ?? '', dose: '1' },
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

  const handleClose = () => {
    setIsPickerVisible(false);
    onClose();
  };

  const handleSave = handleSubmit(async values => {
    if (isPending) return;
    await submit(commandId => onSave(values.medicationId, parseQuantity(values.dose, 'Количество', true), commandId), handleClose, JSON.stringify(values));
  });

  return (
    <Modal
      animationType="slide"
      onRequestClose={handleClose}
      presentationStyle={Platform.OS === 'ios' ? 'formSheet' : 'fullScreen'}
      visible={visible}
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'android' ? 'height' : undefined} style={[styles.container, { backgroundColor: palette.background }]}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm }}>
          <ActionButton toolbar role="cancel" accessibilityText="Закрыть без сохранения" label="Закрыть" disabled={isPending} onPress={handleClose} palette={palette} tone="secondary" />
          <ActionButton toolbar
              disabled={isPending || !selectedMedication}
              label={isPending ? 'Сохраняем…' : 'Записать приём'}
              onPress={() => void handleSave()}
              palette={palette}
            />
        </View>
        <ScrollView automaticallyAdjustKeyboardInsets contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic" keyboardDismissMode="interactive" keyboardShouldPersistTaps="handled">
          <View style={[styles.heading, isLargeText && styles.headingLarge]}>
            <View style={[styles.headingCopy, isLargeText && styles.headingCopyLarge]}>
              <Text style={[styles.title, { color: palette.text }]}>Добавить приём</Text>
              <Text style={[styles.description, { color: palette.textMuted }]}>Выберите препарат и укажите, сколько уже приняли. Запись появится в истории, а количество спишется из запаса.</Text>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: palette.text }]}>Препарат</Text>
            <Controller control={control} name="medicationId" render={({ field }) => (
              <>
                <Pressable
                  accessibilityLabel={selectedMedication ? `Выбран препарат ${selectedMedication.name}. Изменить` : 'Выбрать препарат'}
                  accessibilityRole="button"
                  disabled={isPending}
                  onPress={() => setIsPickerVisible(true)}
                  style={({ pressed }) => [
                    styles.medicationField,
                    { backgroundColor: palette.surface, borderColor: errors.medicationId ? palette.danger : palette.border },
                    pressed && styles.pressed
                  ]}
                >
                  <View style={[styles.medicationIcon, { backgroundColor: palette.primarySoft }]}>
                    <AppSymbol color={palette.primary} fallback="Rx" name="pill.fill" />
                  </View>
                  <View style={styles.medicationCopy}>
                    <Text numberOfLines={2} style={[styles.medicationName, { color: selectedMedication ? palette.text : palette.textMuted }]}>{selectedMedication?.name ?? 'Выбрать препарат'}</Text>
                    {selectedMedication ? <Text numberOfLines={1} style={[styles.medicationMeta, { color: palette.textMuted }]}>{[selectedMedication.dosage, selectedMedication.form].filter(Boolean).join(' · ')}</Text> : null}
                  </View>
                  <Text style={[styles.changeLabel, { color: palette.primary }]}>{selectedMedication ? 'Изменить' : 'Выбрать'}</Text>
                </Pressable>
                <MedicationPickerSheet
                  isDark={isDark}
                  medications={medications}
                  onClose={() => setIsPickerVisible(false)}
                  onOpenMedications={() => { setIsPickerVisible(false); onClose(); router.navigate('/medications'); }}
                  onSelect={field.onChange}
                  selectedId={field.value}
                  visible={visible && isPickerVisible}
                />
              </>
            )} />
            <Text style={[styles.hint, { color: palette.textMuted }]}>{selectedMedication ? 'Нажмите, чтобы выбрать другой препарат.' : 'Выберите препарат из добавленных ранее. Поиск откроется отдельно.'}</Text>
            {!medications.length ? (
              <ActionButton disabled={isPending} label="Открыть препараты" onPress={() => { handleClose(); router.navigate('/medications'); }} palette={palette} tone="secondary" />
            ) : null}
            {errors.medicationId?.message ? <Text accessibilityRole="alert" style={[styles.fieldError, { color: palette.danger }]}>{errors.medicationId.message}</Text> : null}
          </View>

          {hasStockDiscrepancy ? (
            <View accessibilityRole="alert" style={[styles.warning, { backgroundColor: palette.warningSoft }]}>
              <Text style={[styles.warningText, { color: palette.warning }]}>Учётный запас меньше указанной дозы: {selectedMedication.stockUnits} из {previewDose} ед. Приём сохранится, а остаток станет 0. Проверьте фактический запас и скорректируйте карточку препарата.</Text>
            </View>
          ) : null}

          <View style={styles.field}>
            {selectedMedication ? <Text style={[styles.hint, { color: palette.textMuted }]}>Для препарата: {selectedMedication.name} · {selectedMedication.dosage || selectedMedication.form}</Text> : <Text style={[styles.hint, { color: palette.textMuted }]}>Сначала выберите препарат.</Text>}
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
          </View>

          {error ? <Text accessibilityRole="alert" style={{ color: palette.danger }}>{error}</Text> : null}

        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { alignSelf: 'center', gap: spacing.xl, maxWidth: 680, padding: spacing.xl, width: '100%' },
  heading: { alignItems: 'flex-start', flexDirection: 'column', gap: spacing.lg },
  headingLarge: { flexDirection: 'column' },
  headingCopy: { width: '100%', gap: spacing.sm },
  headingCopyLarge: { flex: undefined, width: '100%' },
  title: { fontSize: 27, fontWeight: '800', letterSpacing: -0.6 },
  description: { fontSize: 15, lineHeight: 21 },
  field: { gap: spacing.md },
  fieldError: { fontSize: 13, lineHeight: 18 },
  label: { fontSize: 16, fontWeight: '700' },
  closeButton: { alignSelf: 'flex-start', justifyContent: 'center', minHeight: 48, paddingHorizontal: spacing.sm },
  closeText: { fontSize: 17 },
  link: { fontSize: 15, fontWeight: '600' },
  medicationField: { alignItems: 'center', borderRadius: radii.md, borderWidth: 1, flexDirection: 'row', gap: spacing.md, minHeight: 72, padding: spacing.md },
  medicationIcon: { alignItems: 'center', borderRadius: radii.md, height: 44, justifyContent: 'center', width: 44 },
  medicationCopy: { flex: 1, gap: spacing.xs },
  medicationName: { fontSize: 17, fontWeight: '700', lineHeight: 22 },
  medicationMeta: { fontSize: 13, lineHeight: 18 },
  changeLabel: { fontSize: 15, fontWeight: '700' },
  hint: { fontSize: 13, lineHeight: 19 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, justifyContent: 'flex-end' },
  pressed: { opacity: 0.7 },
  warning: { borderRadius: radii.md, padding: spacing.lg },
  warningText: { fontSize: 14, fontWeight: '700', lineHeight: 20 }
});
