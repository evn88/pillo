import type { CommandResult } from '../application/contracts';
import { medicationFormResolver, toMedicationInput, type MedicationFormValues } from '../hooks/form-schema';
import { useFormCommand } from '../hooks/use-form-command';
import { Controller, useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

import type { Medication } from '@/domain/types';
import { colors, radii, spacing } from '@/theme/tokens';
import { ActionButton } from './ui';

type MedicationFormProps = {
  isDark: boolean;
  medication: Medication | null;
  newId: string;
  onClose: () => void;
  onSave: (medication: Pick<Medication, 'id' | 'name' | 'dosage' | 'form' | 'stockUnits' | 'unitsPerPackage' | 'minThresholdUnits'>, commandId?: string) => Promise<CommandResult>;
  visible: boolean;
};

export const MedicationForm = ({
  isDark,
  medication,
  newId,
  onClose,
  onSave,
  visible
}: MedicationFormProps) => {
  const palette = isDark ? colors.dark : colors.light;
  const medicationId = medication?.id ?? newId;
  const { isPending, error, submit } = useFormCommand();
  const { control, formState: { errors }, handleSubmit } = useForm<MedicationFormValues>({
    defaultValues: {
      name: medication?.name ?? '',
      dosage: medication?.dosage ?? '',
      form: medication?.form ?? 'таблетка',
      stockUnits: String(medication?.stockUnits ?? 0),
      unitsPerPackage: String(medication?.unitsPerPackage ?? 30),
      minThresholdUnits: String(medication?.minThresholdUnits ?? 5)
    },
    mode: 'onBlur',
    reValidateMode: 'onChange',
    resolver: medicationFormResolver(medicationId, medication, () => new Date())
  });

  const fieldStyle = (field: keyof MedicationFormValues) => [styles.input, {
    backgroundColor: palette.surface,
    borderColor: errors[field] ? palette.danger : palette.border,
    color: palette.text
  }];

  const handleSave = handleSubmit(async values => {
    await submit(commandId => onSave({
      ...toMedicationInput(values, medicationId)
    }, commandId), onClose, JSON.stringify(values));
  });

  return (
    <Modal animationType="slide" onRequestClose={onClose} presentationStyle={Platform.OS === 'ios' ? 'formSheet' : 'fullScreen'} visible={visible}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.modal, { backgroundColor: palette.background }]}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.heading}>
            <View style={styles.headingCopy}>
              <Text style={[styles.kicker, { color: palette.primary }]}>ПРЕПАРАТ</Text>
              <Text style={[styles.title, { color: palette.text }]}>
                {medication ? 'Изменить данные' : 'Добавить препарат'}
              </Text>
            </View>
            <ActionButton label="Закрыть" onPress={onClose} palette={palette} tone="secondary" />
          </View>

          <View style={styles.fields}>
            <View style={styles.field}>
              <Text style={[styles.label, { color: palette.text }]}>Название</Text>
              <Controller control={control} name="name" render={({ field }) => (
                <TextInput
                  accessibilityHint={errors.name?.message}
                  accessibilityLabel="Название препарата"
                  autoFocus
                  clearButtonMode="while-editing"
                  keyboardAppearance={isDark ? 'dark' : 'light'}
                  onBlur={field.onBlur}
                  onChangeText={field.onChange}
                  placeholder="Например, витамин D"
                  placeholderTextColor={palette.textMuted}
                  returnKeyType="next"
                  selectionColor={palette.primary}
                  style={fieldStyle('name')}
                  value={field.value}
                />
              )} />
              {errors.name?.message ? <Text accessibilityRole="alert" style={[styles.fieldError, { color: palette.danger }]}>{errors.name.message}</Text> : null}
            </View>
            <View style={styles.row}>
              <View style={[styles.field, styles.half]}>
                <Text style={[styles.label, { color: palette.text }]}>Дозировка</Text>
                <Controller control={control} name="dosage" render={({ field }) => (
                  <TextInput accessibilityHint={errors.dosage?.message} accessibilityLabel="Дозировка" clearButtonMode="while-editing" keyboardAppearance={isDark ? 'dark' : 'light'} onBlur={field.onBlur} onChangeText={field.onChange} placeholder="10 мг" placeholderTextColor={palette.textMuted} selectionColor={palette.primary} style={fieldStyle('dosage')} value={field.value} />
                )} />
                {errors.dosage?.message ? <Text accessibilityRole="alert" style={[styles.fieldError, { color: palette.danger }]}>{errors.dosage.message}</Text> : null}
              </View>
              <View style={[styles.field, styles.half]}>
                <Text style={[styles.label, { color: palette.text }]}>Форма</Text>
                <Controller control={control} name="form" render={({ field }) => (
                  <TextInput accessibilityHint={errors.form?.message} accessibilityLabel="Форма препарата" clearButtonMode="while-editing" keyboardAppearance={isDark ? 'dark' : 'light'} onBlur={field.onBlur} onChangeText={field.onChange} selectionColor={palette.primary} style={fieldStyle('form')} value={field.value} />
                )} />
                {errors.form?.message ? <Text accessibilityRole="alert" style={[styles.fieldError, { color: palette.danger }]}>{errors.form.message}</Text> : null}
              </View>
            </View>
            <View style={styles.row}>
              <View style={[styles.field, styles.third]}>
                <Text style={[styles.label, { color: palette.text }]}>Остаток</Text>
                <Controller control={control} name="stockUnits" render={({ field }) => (
                  <TextInput accessibilityHint={errors.stockUnits?.message} accessibilityLabel="Остаток препарата" keyboardAppearance={isDark ? 'dark' : 'light'} keyboardType="decimal-pad" onBlur={field.onBlur} onChangeText={field.onChange} selectionColor={palette.primary} style={fieldStyle('stockUnits')} value={field.value} />
                )} />
                {errors.stockUnits?.message ? <Text accessibilityRole="alert" style={[styles.fieldError, { color: palette.danger }]}>{errors.stockUnits.message}</Text> : null}
              </View>
              <View style={[styles.field, styles.third]}>
                <Text style={[styles.label, { color: palette.text }]}>В упаковке</Text>
                <Controller control={control} name="unitsPerPackage" render={({ field }) => (
                  <TextInput accessibilityHint={errors.unitsPerPackage?.message} accessibilityLabel="Количество в упаковке" keyboardAppearance={isDark ? 'dark' : 'light'} keyboardType="number-pad" onBlur={field.onBlur} onChangeText={field.onChange} selectionColor={palette.primary} style={fieldStyle('unitsPerPackage')} value={field.value} />
                )} />
                {errors.unitsPerPackage?.message ? <Text accessibilityRole="alert" style={[styles.fieldError, { color: palette.danger }]}>{errors.unitsPerPackage.message}</Text> : null}
              </View>
              <View style={[styles.field, styles.third]}>
                <Text style={[styles.label, { color: palette.text }]}>Низкий запас</Text>
                <Controller control={control} name="minThresholdUnits" render={({ field }) => (
                  <TextInput accessibilityHint={errors.minThresholdUnits?.message} accessibilityLabel="Порог низкого запаса" keyboardAppearance={isDark ? 'dark' : 'light'} keyboardType="decimal-pad" onBlur={field.onBlur} onChangeText={field.onChange} selectionColor={palette.primary} style={fieldStyle('minThresholdUnits')} value={field.value} />
                )} />
                {errors.minThresholdUnits?.message ? <Text accessibilityRole="alert" style={[styles.fieldError, { color: palette.danger }]}>{errors.minThresholdUnits.message}</Text> : null}
              </View>
            </View>
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
  content: { alignSelf: 'center', gap: spacing.xl, maxWidth: 680, padding: spacing.xl, width: '100%' },
  heading: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.lg, justifyContent: 'space-between' },
  headingCopy: { flex: 1, gap: spacing.sm },
  kicker: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  fields: { gap: spacing.lg },
  field: { gap: spacing.sm },
  fieldError: { fontSize: 13, lineHeight: 18 },
  label: { fontSize: 14, fontWeight: '600' },
  input: { borderRadius: radii.md, borderWidth: StyleSheet.hairlineWidth, fontSize: 16, minHeight: 50, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  half: { flexBasis: 220, flexGrow: 1 },
  third: { flexBasis: 130, flexGrow: 1 }
});
