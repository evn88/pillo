import { ScheduleDateInput } from './schedule-date-input';
import { useState } from 'react';
import { router } from 'expo-router';
import type { CommandResult } from '../application/contracts';
import { scheduleFormResolver, toScheduleRule, type ScheduleFormValues } from '../hooks/form-schema';
import { useFormCommand } from '../hooks/use-form-command';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { getLocalDateKey } from '@/domain/schedule';
import type { Medication, ScheduleRule } from '@/domain/types';
import { useLargeTextLayout } from '@/hooks/use-large-text-layout';
import { colors, radii, spacing } from '@/theme/tokens';
import { AppSymbol } from './app-symbol';
import { DoseInput } from './dose-input';
import { MedicationPickerSheet } from './medication-picker-sheet';
import { ActionButton } from './ui';

const days = [
  { value: 1, label: 'Пн' },
  { value: 2, label: 'Вт' },
  { value: 3, label: 'Ср' },
  { value: 4, label: 'Чт' },
  { value: 5, label: 'Пт' },
  { value: 6, label: 'Сб' },
  { value: 0, label: 'Вс' }
];

type ScheduleFormProps = {
  isDark: boolean;
  medications: Medication[];
  onClose: () => void;
  onSave: (rule: Omit<ScheduleRule, 'id'> & { id?: string }, commandId?: string) => Promise<CommandResult>;
  rule: ScheduleRule | null;
  newId: string;
  visible: boolean;
};

export const ScheduleForm = ({ isDark, medications, onClose, onSave, rule, newId, visible }: ScheduleFormProps) => {
  const palette = isDark ? colors.dark : colors.light;
  const isLargeText = useLargeTextLayout();
  const [isMedicationPickerOpen, setMedicationPickerOpen] = useState(false);
  const { isPending, error, submit } = useFormCommand();
  const ruleId = rule?.id ?? newId;
  const { control, formState: { errors }, handleSubmit } = useForm<ScheduleFormValues>({
    defaultValues: {
      medicationId: rule?.medicationId ?? medications[0]?.id ?? '',
      time: rule?.time ?? '09:00',
      doseUnits: String(rule?.doseUnits ?? 1),
      daysOfWeek: rule?.daysOfWeek ?? days.map(day => day.value),
      startDate: rule?.startDate ?? getLocalDateKey(new Date()),
      endDate: rule?.endDate ?? '',
      comment: rule?.comment ?? ''
    },
    mode: 'onBlur',
    reValidateMode: 'onChange',
    resolver: scheduleFormResolver(ruleId, rule?.isActive ?? true)
  });
  const inputStyle = (field: keyof ScheduleFormValues) => [styles.input, {
    backgroundColor: palette.surface,
    borderColor: errors[field] ? palette.danger : palette.border,
    color: palette.text
  }];
  const medicationId = useWatch({ control, name: 'medicationId' });
  const selectedMedication = medications.find(medication => medication.id === medicationId);

  const handleClose = () => {
    setMedicationPickerOpen(false);
    onClose();
  };

  const handleSave = handleSubmit(async values => {
    await submit(commandId => onSave({
      ...toScheduleRule(values, ruleId, rule?.isActive ?? true)
    }, commandId), handleClose, JSON.stringify(values));
  });

  return (
    <Modal animationType="slide" onRequestClose={handleClose} presentationStyle={Platform.OS === 'ios' ? 'formSheet' : 'fullScreen'} visible={visible}>
      <KeyboardAvoidingView behavior={Platform.OS === 'android' ? 'height' : undefined} style={[styles.modal, { backgroundColor: palette.background }]}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm }}>
        <ActionButton toolbar role="cancel" disabled={isPending} label="Отмена" onPress={handleClose} palette={palette} tone="secondary" />
        <ActionButton toolbar
          disabled={isPending}
          label={isPending ? 'Сохраняем…' : 'Сохранить'}
          onPress={() => void handleSave()}
          palette={palette}
        />
      </View>
      <ScrollView automaticallyAdjustKeyboardInsets contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic" keyboardDismissMode="interactive" keyboardShouldPersistTaps="handled">
        <View style={[styles.heading, isLargeText && styles.headingLarge]}>
          <View style={[styles.headingCopy, isLargeText && styles.headingCopyLarge]}>
            <Text style={[styles.title, { color: palette.text }]}>{rule ? 'Изменить приём' : 'Добавить приём'}</Text>
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
                onPress={() => setMedicationPickerOpen(true)}
                style={({ pressed }) => [styles.medicationField, { backgroundColor: palette.surface, borderColor: errors.medicationId ? palette.danger : palette.border }, pressed && styles.pressed]}
              >
                <View style={[styles.medicationIcon, { backgroundColor: palette.primarySoft }]}><AppSymbol color={palette.primary} fallback="Rx" name="pill.fill" /></View>
                <View style={styles.medicationCopy}>
                  <Text numberOfLines={2} style={[styles.medicationName, { color: selectedMedication ? palette.text : palette.textMuted }]}>{selectedMedication?.name ?? 'Выбрать препарат'}</Text>
                  {selectedMedication ? <Text numberOfLines={1} style={[styles.medicationMeta, { color: palette.textMuted }]}>{[selectedMedication.dosage, selectedMedication.form].filter(Boolean).join(' · ')}</Text> : null}
                </View>
                <Text style={[styles.changeLabel, { color: palette.primary }]}>Изменить</Text>
              </Pressable>
              <MedicationPickerSheet
                isDark={isDark}
                medications={medications}
                onClose={() => setMedicationPickerOpen(false)}
                onOpenMedications={() => { setMedicationPickerOpen(false); handleClose(); router.navigate('/medications'); }}
                onSelect={field.onChange}
                selectedId={field.value}
                visible={visible && isMedicationPickerOpen}
              />
            </>
          )} />
          {errors.medicationId?.message ? <Text accessibilityRole="alert" style={[styles.fieldError, { color: palette.danger }]}>{errors.medicationId.message}</Text> : null}
        </View>

        <View style={styles.row}>
          <View style={[styles.field, styles.half]}>
            <Text style={[styles.label, { color: palette.text }]}>Время</Text>
            <Controller control={control} name="time" render={({ field }) => (
              <ScheduleDateInput disabled={isPending} time isDark={isDark} label="Время приёма" onBlur={field.onBlur} onChange={field.onChange} value={field.value} />
            )} />
            {errors.time?.message ? <Text accessibilityRole="alert" style={[styles.fieldError, { color: palette.danger }]}>{errors.time.message}</Text> : null}
          </View>
          <View style={[styles.field, styles.half]}>
            <Controller control={control} name="doseUnits" render={({ field }) => (
              <DoseInput
                disabled={isPending}
                error={errors.doseUnits?.message}
                isDark={isDark}
                label="Доза за приём"
                onBlur={field.onBlur}
                onChange={field.onChange}
                value={field.value}
              />
            )} />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: palette.text }]}>Дни недели</Text>
          <Controller control={control} name="daysOfWeek" render={({ field }) => (
            <View style={styles.days}>
              {days.map(day => {
                const checked = field.value.includes(day.value);
                return (
                  <Pressable
                    accessibilityRole="checkbox"
                    disabled={isPending}
                    accessibilityState={{ checked, disabled: isPending }}
                    android_ripple={{ color: palette.primarySoft, borderless: true }}
                    key={day.value}
                    onPress={() => field.onChange(checked ? field.value.filter(value => value !== day.value) : [...field.value, day.value])}
                    style={({ pressed }) => [styles.day, { opacity: isPending ? 0.4 : pressed ? 0.7 : 1 }, { backgroundColor: palette.surfaceMuted }, checked && { backgroundColor: palette.primary }]}
                  >
                    <Text style={{ color: checked ? palette.surface : palette.text, fontWeight: '700' }}>{day.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          )} />
          {errors.daysOfWeek?.message ? <Text accessibilityRole="alert" style={[styles.fieldError, { color: palette.danger }]}>{errors.daysOfWeek.message}</Text> : null}
        </View>

        <View style={styles.row}>
          <View style={[styles.field, styles.half]}>
            <Text style={[styles.label, { color: palette.text }]}>Начало курса</Text>
            <Controller control={control} name="startDate" render={({ field }) => (
              <ScheduleDateInput disabled={isPending}  isDark={isDark} label="Дата начала курса" onBlur={field.onBlur} onChange={field.onChange} value={field.value} />
            )} />
            {errors.startDate?.message ? <Text accessibilityRole="alert" style={[styles.fieldError, { color: palette.danger }]}>{errors.startDate.message}</Text> : null}
          </View>
          <View style={[styles.field, styles.half]}>
            <Text style={[styles.label, { color: palette.text }]}>Окончание</Text>
            <Controller control={control} name="endDate" render={({ field }) => (
              <ScheduleDateInput disabled={isPending} optional isDark={isDark} label="Дата окончания курса" onBlur={field.onBlur} onChange={field.onChange} value={field.value} />
            )} />
            {errors.endDate?.message ? <Text accessibilityRole="alert" style={[styles.fieldError, { color: palette.danger }]}>{errors.endDate.message}</Text> : null}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: palette.text }]}>Комментарий</Text>
          <Controller control={control} name="comment" render={({ field }) => (
            <TextInput editable={!isPending} accessibilityHint={errors.comment?.message} accessibilityLabel="Комментарий к приёму" clearButtonMode="while-editing" keyboardAppearance={isDark ? 'dark' : 'light'} onBlur={field.onBlur} onChangeText={field.onChange} selectionColor={palette.primary} style={inputStyle('comment')} value={field.value} />
          )} />
          {errors.comment?.message ? <Text accessibilityRole="alert" style={[styles.fieldError, { color: palette.danger }]}>{errors.comment.message}</Text> : null}
        </View>

        {error ? <Text accessibilityRole="alert" style={{ color: palette.danger }}>{error}</Text> : null}

      </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: { flex: 1 },
  content: { alignSelf: 'center', flexGrow: 1, gap: spacing.xl, maxWidth: 680, padding: spacing.xl, width: '100%' },
  heading: { alignItems: 'flex-start', flexDirection: 'column', gap: spacing.lg, justifyContent: 'space-between' },
  headingLarge: { flexDirection: 'column' },
  headingCopy: { width: '100%', gap: spacing.sm },
  headingCopyLarge: { flex: undefined, width: '100%' },
  kicker: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  field: { gap: spacing.sm },
  fieldError: { fontSize: 13, lineHeight: 18 },
  label: { fontSize: 14, fontWeight: '600' },
  input: { borderRadius: radii.md, borderWidth: StyleSheet.hairlineWidth, fontSize: 16, minHeight: 50, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  half: { flexBasis: 220, flexGrow: 1 },
  medicationField: { alignItems: 'center', borderRadius: radii.md, borderWidth: 1, flexDirection: 'row', gap: spacing.md, minHeight: 72, padding: spacing.md },
  medicationIcon: { alignItems: 'center', borderRadius: radii.md, height: 44, justifyContent: 'center', width: 44 },
  medicationCopy: { flex: 1, gap: spacing.xs },
  medicationName: { fontSize: 17, fontWeight: '700', lineHeight: 22 },
  medicationMeta: { fontSize: 13, lineHeight: 18 },
  changeLabel: { fontSize: 15, fontWeight: '700' },
  pressed: { opacity: 0.7 },
  days: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  day: { alignItems: 'center', borderRadius: radii.pill, justifyContent: 'center', minHeight: 44, minWidth: 44, padding: spacing.sm }
});
