import { Host, Picker, Text as NativeText } from '@expo/ui/swift-ui';
import { pickerStyle, tag, tint } from '@expo/ui/swift-ui/modifiers';
import { Controller, useForm } from 'react-hook-form';
import { useState, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

import type { CommandResult } from '../application/contracts';
import type { Medication } from '@/domain/types';
import { medicationFormResolver, toMedicationInput, type MedicationFormValues } from '../hooks/form-schema';
import { useFormCommand } from '../hooks/use-form-command';
import { useLargeTextLayout } from '@/hooks/use-large-text-layout';
import { colors, radii, spacing } from '@/theme/tokens';
import { ActionButton, Surface } from './ui';

const customFormValue = '__custom__';
const medicationForms = [
  { value: 'таблетка', label: 'Таблетка' },
  { value: 'капсула', label: 'Капсула' },
  { value: 'капли', label: 'Капли' },
  { value: 'раствор', label: 'Раствор' },
  { value: 'спрей', label: 'Спрей' },
  { value: 'инъекция', label: 'Инъекция' },
  { value: 'мазь', label: 'Мазь' }
] as const;

type Palette = typeof colors.light | typeof colors.dark;

type MedicationFormProps = {
  isDark: boolean;
  medication: Medication | null;
  newId: string;
  onClose: () => void;
  onSave: (medication: Pick<Medication, 'id' | 'name' | 'dosage' | 'form' | 'stockUnits' | 'unitsPerPackage' | 'minThresholdUnits'>, commandId?: string) => Promise<CommandResult>;
  visible: boolean;
};

const FormSection = ({ children, description, palette, title }: {
  children: ReactNode;
  description: string;
  palette: Palette;
  title: string;
}) => (
  <View style={styles.section}>
    <View style={styles.sectionHeading}>
      <Text style={[styles.sectionTitle, { color: palette.text }]}>{title}</Text>
      <Text style={[styles.sectionDescription, { color: palette.textMuted }]}>{description}</Text>
    </View>
    <Surface palette={palette} style={styles.sectionSurface}>{children}</Surface>
  </View>
);

const FieldError = ({ message, palette }: { message?: string; palette: Palette }) => message ? (
  <Text accessibilityRole="alert" style={[styles.fieldError, { color: palette.danger }]}>{message}</Text>
) : null;

const StockField = ({ accessibilityLabel, description, error, label, onBlur, onChangeText, palette, value }: {
  accessibilityLabel: string;
  description: string;
  error?: string;
  label: string;
  onBlur: () => void;
  onChangeText: (value: string) => void;
  palette: Palette;
  value: string;
}) => (
  <View style={styles.stockField}>
    <View style={styles.stockRow}>
      <View style={styles.stockCopy}>
        <Text style={[styles.stockLabel, { color: palette.text }]}>{label}</Text>
        <Text style={[styles.stockDescription, { color: palette.textMuted }]}>{description}</Text>
      </View>
      <View style={[styles.quantityControl, { backgroundColor: palette.surfaceMuted, borderColor: error ? palette.danger : palette.border }]}>
        <TextInput
          accessibilityHint={error}
          accessibilityLabel={accessibilityLabel}
          keyboardAppearance={palette === colors.dark ? 'dark' : 'light'}
          keyboardType="decimal-pad"
          onBlur={onBlur}
          onChangeText={onChangeText}
          selectTextOnFocus
          selectionColor={palette.primary}
          style={[styles.quantityInput, { color: palette.text }]}
          value={value}
        />
        <Text style={[styles.quantityUnit, { color: palette.textMuted }]}>ед.</Text>
      </View>
    </View>
    <FieldError message={error} palette={palette} />
  </View>
);

export const MedicationForm = ({
  isDark,
  medication,
  newId,
  onClose,
  onSave,
  visible
}: MedicationFormProps) => {
  const palette = isDark ? colors.dark : colors.light;
  const isLargeText = useLargeTextLayout();
  const medicationId = medication?.id ?? newId;
  const initialForm = medication ? medication.form : 'таблетка';
  const [isCustomForm, setIsCustomForm] = useState(!medicationForms.some(option => option.value === initialForm));
  const { isPending, error, submit } = useFormCommand();
  const { control, formState: { errors }, handleSubmit } = useForm<MedicationFormValues>({
    defaultValues: {
      name: medication?.name ?? '',
      dosage: medication?.dosage ?? '',
      form: initialForm,
      stockUnits: String(medication?.stockUnits ?? 0),
      unitsPerPackage: String(medication?.unitsPerPackage ?? 30),
      minThresholdUnits: String(medication?.minThresholdUnits ?? 5)
    },
    mode: 'onBlur',
    reValidateMode: 'onChange',
    resolver: medicationFormResolver(medicationId, medication, () => new Date())
  });

  const inputStyle = (field: keyof MedicationFormValues) => [styles.input, {
    backgroundColor: palette.surfaceMuted,
    borderColor: errors[field] ? palette.danger : palette.border,
    color: palette.text
  }];

  const handleSave = handleSubmit(async values => {
    await submit(commandId => onSave({
      ...toMedicationInput(values, medicationId)
    }, commandId), onClose, JSON.stringify(values));
  });

  const submitLabel = medication ? 'Готово' : 'Добавить';
  const cancelAction = <ActionButton compact label="Отмена" onPress={onClose} palette={palette} tone="secondary" />;
  const submitAction = <ActionButton
    compact
    disabled={isPending}
    label={isPending ? (medication ? 'Сохраняем…' : 'Добавляем…') : submitLabel}
    onPress={() => void handleSave()}
    palette={palette}
  />;

  return (
    <Modal animationType="slide" onRequestClose={onClose} presentationStyle={Platform.OS === 'ios' ? 'formSheet' : 'fullScreen'} visible={visible}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'android' ? 'height' : undefined}
        style={[styles.modal, { backgroundColor: palette.background }]}
      >
        <View style={[styles.toolbar, isLargeText && styles.toolbarLarge, { borderBottomColor: palette.border }]}>
          {isLargeText ? <>
            <Text accessibilityRole="header" style={[styles.toolbarTitle, styles.toolbarTitleLarge, { color: palette.text }]}>
              {medication ? 'Препарат' : 'Новый препарат'}
            </Text>
            <View style={styles.toolbarActions}>{cancelAction}{submitAction}</View>
          </> : <>
            {cancelAction}
            <Text accessibilityRole="header" numberOfLines={1} style={[styles.toolbarTitle, { color: palette.text }]}>
              {medication ? 'Препарат' : 'Новый препарат'}
            </Text>
            {submitAction}
          </>}
        </View>

        <ScrollView
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={styles.content}
          contentInsetAdjustmentBehavior="automatic"
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.intro}>
            <Text style={[styles.introText, { color: palette.textMuted }]}>Добавьте название. Дозировку и запас можно уточнить позже.</Text>
          </View>

          <FormSection
            description="То, как препарат будет показан в расписании и истории."
            palette={palette}
            title="Основное"
          >
            <View style={styles.field}>
              <Text style={[styles.label, { color: palette.text }]}>Название</Text>
              <Controller control={control} name="name" render={({ field }) => (
                <TextInput
                  accessibilityHint={errors.name?.message}
                  accessibilityLabel="Название препарата"
                  autoCapitalize="sentences"
                  autoFocus
                  clearButtonMode="while-editing"
                  keyboardAppearance={isDark ? 'dark' : 'light'}
                  onBlur={field.onBlur}
                  onChangeText={field.onChange}
                  placeholder="Например, витамин D"
                  placeholderTextColor={palette.textMuted}
                  returnKeyType="next"
                  selectionColor={palette.primary}
                  style={inputStyle('name')}
                  value={field.value}
                />
              )} />
              <FieldError message={errors.name?.message} palette={palette} />
            </View>

            <View style={styles.field}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: palette.text }]}>Дозировка</Text>
                <Text style={[styles.optional, { color: palette.textMuted }]}>Необязательно</Text>
              </View>
              <Controller control={control} name="dosage" render={({ field }) => (
                <TextInput
                  accessibilityHint={errors.dosage?.message}
                  accessibilityLabel="Дозировка"
                  clearButtonMode="while-editing"
                  keyboardAppearance={isDark ? 'dark' : 'light'}
                  onBlur={field.onBlur}
                  onChangeText={field.onChange}
                  placeholder="Например, 10 мг"
                  placeholderTextColor={palette.textMuted}
                  selectionColor={palette.primary}
                  style={inputStyle('dosage')}
                  value={field.value}
                />
              )} />
              <FieldError message={errors.dosage?.message} palette={palette} />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: palette.text }]}>Лекарственная форма</Text>
              <Controller control={control} name="form" render={({ field }) => {
                const selectedValue = isCustomForm ? customFormValue : field.value;
                const handleSelection = (value: string | null) => {
                  if (!value) return;
                  if (value === customFormValue) {
                    setIsCustomForm(true);
                    if (medicationForms.some(option => option.value === field.value)) field.onChange('');
                    return;
                  }
                  setIsCustomForm(false);
                  field.onChange(value);
                  field.onBlur();
                };

                return <>
                  {Platform.OS === 'ios' ? (
                    <View style={[styles.pickerControl, { backgroundColor: palette.surfaceMuted, borderColor: errors.form ? palette.danger : palette.border }]}>
                      <Host colorScheme={isDark ? 'dark' : 'light'} style={styles.nativePicker}>
                        <Picker
                          label="Выбрать форму"
                          onSelectionChange={handleSelection}
                          selection={selectedValue}
                          systemImage="pills"
                          modifiers={[pickerStyle('menu'), tint(palette.primary)]}
                        >
                          {medicationForms.map(option => <NativeText key={option.value} modifiers={[tag(option.value)]}>{option.label}</NativeText>)}
                          <NativeText modifiers={[tag(customFormValue)]}>Другая…</NativeText>
                        </Picker>
                      </Host>
                    </View>
                  ) : (
                    <View accessibilityLabel="Лекарственная форма" accessibilityRole="radiogroup" style={styles.formOptions}>
                      {[...medicationForms, { value: customFormValue, label: 'Другая' }].map(option => {
                        const checked = option.value === selectedValue;
                        return <Pressable
                          accessibilityRole="radio"
                          accessibilityState={{ checked }}
                          key={option.value}
                          onPress={() => handleSelection(option.value)}
                          style={[styles.formOption, { backgroundColor: checked ? palette.primarySoft : palette.surfaceMuted }]}
                        >
                          <Text style={{ color: checked ? palette.primary : palette.text, fontWeight: '600' }}>{option.label}</Text>
                        </Pressable>;
                      })}
                    </View>
                  )}
                  {isCustomForm ? <TextInput
                    accessibilityHint={errors.form?.message}
                    accessibilityLabel="Другая лекарственная форма"
                    autoFocus={!medication}
                    clearButtonMode="while-editing"
                    keyboardAppearance={isDark ? 'dark' : 'light'}
                    onBlur={field.onBlur}
                    onChangeText={field.onChange}
                    placeholder="Укажите форму"
                    placeholderTextColor={palette.textMuted}
                    selectionColor={palette.primary}
                    style={inputStyle('form')}
                    value={field.value}
                  /> : null}
                </>;
              }} />
              <FieldError message={errors.form?.message} palette={palette} />
            </View>
          </FormSection>

          <FormSection
            description="Все значения указываются в единицах выбранной формы: таблетках, капсулах или других единицах."
            palette={palette}
            title="Запас"
          >
            <Controller control={control} name="stockUnits" render={({ field }) => (
              <StockField
                accessibilityLabel="Текущий остаток препарата"
                description="Сколько осталось сейчас"
                error={errors.stockUnits?.message}
                label="Сейчас"
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                palette={palette}
                value={field.value}
              />
            )} />
            <View style={[styles.divider, { backgroundColor: palette.border }]} />
            <Controller control={control} name="unitsPerPackage" render={({ field }) => (
              <StockField
                accessibilityLabel="Количество единиц в упаковке"
                description="Сколько добавлять за раз"
                error={errors.unitsPerPackage?.message}
                label="В упаковке"
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                palette={palette}
                value={field.value}
              />
            )} />
            <View style={[styles.divider, { backgroundColor: palette.border }]} />
            <Controller control={control} name="minThresholdUnits" render={({ field }) => (
              <StockField
                accessibilityLabel="Порог низкого запаса"
                description="Когда показать предупреждение"
                error={errors.minThresholdUnits?.message}
                label="Предупредить при"
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                palette={palette}
                value={field.value}
              />
            )} />
          </FormSection>

          {error ? <Text accessibilityRole="alert" style={[styles.commandError, { backgroundColor: palette.dangerSoft, color: palette.danger }]}>{error}</Text> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: { flex: 1 },
  toolbar: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
    minHeight: 60,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm
  },
  toolbarTitle: { flex: 1, fontSize: 17, fontWeight: '700', textAlign: 'center' },
  toolbarLarge: { alignItems: 'stretch', flexDirection: 'column' },
  toolbarTitleLarge: { flex: undefined, textAlign: 'left' },
  toolbarActions: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between' },
  content: { alignSelf: 'center', gap: spacing.xl, maxWidth: 680, padding: spacing.xl, paddingBottom: spacing.xxl * 2, width: '100%' },
  intro: { gap: spacing.sm },
  introText: { fontSize: 15, lineHeight: 21 },
  section: { gap: spacing.md },
  sectionHeading: { gap: spacing.xs, paddingHorizontal: spacing.xs },
  sectionTitle: { fontSize: 20, fontWeight: '700', letterSpacing: -0.2 },
  sectionDescription: { fontSize: 14, lineHeight: 19 },
  sectionSurface: { gap: spacing.lg },
  field: { gap: spacing.sm },
  labelRow: { alignItems: 'baseline', flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between' },
  label: { fontSize: 15, fontWeight: '600' },
  optional: { fontSize: 13 },
  fieldError: { fontSize: 13, lineHeight: 18 },
  input: { borderRadius: radii.md, borderWidth: StyleSheet.hairlineWidth, fontSize: 17, minHeight: 50, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  pickerControl: { borderRadius: radii.md, borderWidth: StyleSheet.hairlineWidth, minHeight: 50, overflow: 'hidden' },
  nativePicker: { height: 50, width: '100%' },
  formOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  formOption: { borderRadius: radii.pill, justifyContent: 'center', minHeight: 44, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  stockField: { gap: spacing.sm },
  stockRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, justifyContent: 'space-between', minHeight: 54 },
  stockCopy: { flex: 1, gap: 2 },
  stockLabel: { fontSize: 16, fontWeight: '600' },
  stockDescription: { fontSize: 13, lineHeight: 17 },
  quantityControl: { alignItems: 'center', borderRadius: radii.sm, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', minHeight: 44, paddingHorizontal: spacing.md },
  quantityInput: { fontSize: 17, fontVariant: ['tabular-nums'], minWidth: 54, paddingVertical: spacing.sm, textAlign: 'right' },
  quantityUnit: { fontSize: 14, marginLeft: spacing.xs },
  divider: { height: StyleSheet.hairlineWidth },
  commandError: { borderRadius: radii.md, fontSize: 14, lineHeight: 20, padding: spacing.lg }
});
