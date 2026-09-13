import type { CommandResult } from '../application/contracts';
import { scheduleFormResolver, toScheduleRule, type ScheduleFormValues } from '../hooks/form-schema';
import { useFormCommand } from '../hooks/use-form-command';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { getLocalDateKey } from '@/domain/schedule';
import type { Medication, ScheduleRule } from '@/domain/types';
import { useLargeTextLayout } from '@/hooks/use-large-text-layout';
import { colors, radii, spacing } from '@/theme/tokens';
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

  const handleSave = handleSubmit(async values => {
    await submit(commandId => onSave({
      ...toScheduleRule(values, ruleId, rule?.isActive ?? true)
    }, commandId), onClose, JSON.stringify(values));
  });

  return (
    <Modal animationType="slide" onRequestClose={onClose} presentationStyle={Platform.OS === 'ios' ? 'formSheet' : 'fullScreen'} visible={visible}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.modal, { backgroundColor: palette.background }]}>
      <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled">
        <View style={[styles.heading, isLargeText && styles.headingLarge]}>
          <View style={[styles.headingCopy, isLargeText && styles.headingCopyLarge]}>
            <Text style={[styles.kicker, { color: palette.primary }]}>РАСПИСАНИЕ</Text>
            <Text style={[styles.title, { color: palette.text }]}>{rule ? 'Изменить приём' : 'Добавить приём'}</Text>
          </View>
          <ActionButton label="Закрыть" onPress={onClose} palette={palette} tone="secondary" />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: palette.text }]}>Препарат</Text>
          <Controller control={control} name="medicationId" render={({ field }) => (
            <View accessibilityLabel="Препарат" accessibilityRole="radiogroup" style={styles.options}>
              {medications.map(medication => (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ checked: medication.id === field.value }}
                  android_ripple={{ color: palette.primarySoft }}
                  key={medication.id}
                  onPress={() => field.onChange(medication.id)}
                  style={[
                    styles.option,
                    { backgroundColor: palette.surfaceMuted },
                    medication.id === field.value && { backgroundColor: palette.primarySoft }
                  ]}
                >
                  <Text style={{ color: palette.text, fontWeight: '600' }}>{medication.name}</Text>
                </Pressable>
              ))}
            </View>
          )} />
          {errors.medicationId?.message ? <Text accessibilityRole="alert" style={[styles.fieldError, { color: palette.danger }]}>{errors.medicationId.message}</Text> : null}
        </View>

        <View style={styles.row}>
          <View style={[styles.field, styles.half]}>
            <Text style={[styles.label, { color: palette.text }]}>Время, ЧЧ:ММ</Text>
            <Controller control={control} name="time" render={({ field }) => (
              <TextInput accessibilityHint={errors.time?.message} accessibilityLabel="Время приёма" keyboardAppearance={isDark ? 'dark' : 'light'} keyboardType="numbers-and-punctuation" onBlur={field.onBlur} onChangeText={field.onChange} selectionColor={palette.primary} style={inputStyle('time')} value={field.value} />
            )} />
            {errors.time?.message ? <Text accessibilityRole="alert" style={[styles.fieldError, { color: palette.danger }]}>{errors.time.message}</Text> : null}
          </View>
          <View style={[styles.field, styles.half]}>
            <Text style={[styles.label, { color: palette.text }]}>Количество</Text>
            <Controller control={control} name="doseUnits" render={({ field }) => (
              <TextInput accessibilityHint={errors.doseUnits?.message} accessibilityLabel="Количество препарата" keyboardAppearance={isDark ? 'dark' : 'light'} keyboardType="decimal-pad" onBlur={field.onBlur} onChangeText={field.onChange} selectionColor={palette.primary} style={inputStyle('doseUnits')} value={field.value} />
            )} />
            {errors.doseUnits?.message ? <Text accessibilityRole="alert" style={[styles.fieldError, { color: palette.danger }]}>{errors.doseUnits.message}</Text> : null}
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
                    accessibilityState={{ checked }}
                    android_ripple={{ color: palette.primarySoft, borderless: true }}
                    key={day.value}
                    onPress={() => field.onChange(checked ? field.value.filter(value => value !== day.value) : [...field.value, day.value])}
                    style={[styles.day, { backgroundColor: palette.surfaceMuted }, checked && { backgroundColor: palette.primary }]}
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
            <Text style={[styles.label, { color: palette.text }]}>Начало, ГГГГ-ММ-ДД</Text>
            <Controller control={control} name="startDate" render={({ field }) => (
              <TextInput accessibilityHint={errors.startDate?.message} accessibilityLabel="Дата начала курса" clearButtonMode="while-editing" keyboardAppearance={isDark ? 'dark' : 'light'} onBlur={field.onBlur} onChangeText={field.onChange} selectionColor={palette.primary} style={inputStyle('startDate')} value={field.value} />
            )} />
            {errors.startDate?.message ? <Text accessibilityRole="alert" style={[styles.fieldError, { color: palette.danger }]}>{errors.startDate.message}</Text> : null}
          </View>
          <View style={[styles.field, styles.half]}>
            <Text style={[styles.label, { color: palette.text }]}>Окончание</Text>
            <Controller control={control} name="endDate" render={({ field }) => (
              <TextInput accessibilityHint={errors.endDate?.message} accessibilityLabel="Дата окончания курса" clearButtonMode="while-editing" keyboardAppearance={isDark ? 'dark' : 'light'} onBlur={field.onBlur} onChangeText={field.onChange} placeholder="Не ограничено" placeholderTextColor={palette.textMuted} selectionColor={palette.primary} style={inputStyle('endDate')} value={field.value} />
            )} />
            {errors.endDate?.message ? <Text accessibilityRole="alert" style={[styles.fieldError, { color: palette.danger }]}>{errors.endDate.message}</Text> : null}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: palette.text }]}>Комментарий</Text>
          <Controller control={control} name="comment" render={({ field }) => (
            <TextInput accessibilityHint={errors.comment?.message} accessibilityLabel="Комментарий к приёму" clearButtonMode="while-editing" keyboardAppearance={isDark ? 'dark' : 'light'} onBlur={field.onBlur} onChangeText={field.onChange} selectionColor={palette.primary} style={inputStyle('comment')} value={field.value} />
          )} />
          {errors.comment?.message ? <Text accessibilityRole="alert" style={[styles.fieldError, { color: palette.danger }]}>{errors.comment.message}</Text> : null}
        </View>

        {error ? <Text accessibilityRole="alert" style={{ color: palette.danger }}>{error}</Text> : null}
        <ActionButton
          disabled={isPending}
          label={isPending ? 'Сохраняем…' : 'Сохранить'}
          onPress={() => void handleSave()}
          palette={palette}
        />
      </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: { flex: 1 },
  content: { alignSelf: 'center', flexGrow: 1, gap: spacing.xl, maxWidth: 680, padding: spacing.xl, width: '100%' },
  heading: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.lg, justifyContent: 'space-between' },
  headingLarge: { flexDirection: 'column' },
  headingCopy: { flex: 1, gap: spacing.sm },
  headingCopyLarge: { flex: undefined, width: '100%' },
  kicker: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  field: { gap: spacing.sm },
  fieldError: { fontSize: 13, lineHeight: 18 },
  label: { fontSize: 14, fontWeight: '600' },
  input: { borderRadius: radii.md, borderWidth: StyleSheet.hairlineWidth, fontSize: 16, minHeight: 50, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  half: { flexBasis: 220, flexGrow: 1 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  option: { borderRadius: radii.pill, minHeight: 44, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  days: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  day: { alignItems: 'center', borderRadius: radii.pill, justifyContent: 'center', minHeight: 44, minWidth: 44, padding: spacing.sm }
});
