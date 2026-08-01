import { useState } from 'react';
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
  onSave: (medication: Pick<Medication, 'id' | 'name' | 'dosage' | 'form' | 'stockUnits' | 'unitsPerPackage' | 'minThresholdUnits'>) => Promise<void>;
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
  const [name, setName] = useState(medication?.name ?? '');
  const [dosage, setDosage] = useState(medication?.dosage ?? '');
  const [form, setForm] = useState(medication?.form ?? 'таблетка');
  const [stockUnits, setStockUnits] = useState(String(medication?.stockUnits ?? 0));
  const [unitsPerPackage, setUnitsPerPackage] = useState(String(medication?.unitsPerPackage ?? 30));
  const [minThresholdUnits, setMinThresholdUnits] = useState(
    String(medication?.minThresholdUnits ?? 5)
  );
  const [isPending, setIsPending] = useState(false);

  const fieldStyle = [styles.input, { backgroundColor: palette.surfaceMuted, color: palette.text }];

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsPending(true);
    await onSave({
      id: medication?.id ?? newId,
      name: name.trim(),
      dosage: dosage.trim(),
      form: form.trim(),
      stockUnits: Math.max(0, Number(stockUnits) || 0),
      unitsPerPackage: Math.max(0, Number(unitsPerPackage) || 0),
      minThresholdUnits: Math.max(0, Number(minThresholdUnits) || 0)
    });
    setIsPending(false);
    onClose();
  };

  return (
    <Modal animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet" visible={visible}>
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
              <TextInput
                autoFocus
                onChangeText={setName}
                placeholder="Например, витамин D"
                placeholderTextColor={palette.textMuted}
                style={fieldStyle}
                value={name}
              />
            </View>
            <View style={styles.row}>
              <View style={[styles.field, styles.half]}>
                <Text style={[styles.label, { color: palette.text }]}>Дозировка</Text>
                <TextInput
                  onChangeText={setDosage}
                  placeholder="10 мг"
                  placeholderTextColor={palette.textMuted}
                  style={fieldStyle}
                  value={dosage}
                />
              </View>
              <View style={[styles.field, styles.half]}>
                <Text style={[styles.label, { color: palette.text }]}>Форма</Text>
                <TextInput onChangeText={setForm} style={fieldStyle} value={form} />
              </View>
            </View>
            <View style={styles.row}>
              <View style={[styles.field, styles.third]}>
                <Text style={[styles.label, { color: palette.text }]}>Остаток</Text>
                <TextInput keyboardType="decimal-pad" onChangeText={setStockUnits} style={fieldStyle} value={stockUnits} />
              </View>
              <View style={[styles.field, styles.third]}>
                <Text style={[styles.label, { color: palette.text }]}>В упаковке</Text>
                <TextInput keyboardType="number-pad" onChangeText={setUnitsPerPackage} style={fieldStyle} value={unitsPerPackage} />
              </View>
              <View style={[styles.field, styles.third]}>
                <Text style={[styles.label, { color: palette.text }]}>Низкий запас</Text>
                <TextInput keyboardType="decimal-pad" onChangeText={setMinThresholdUnits} style={fieldStyle} value={minThresholdUnits} />
              </View>
            </View>
          </View>

          <ActionButton
            disabled={!name.trim() || isPending}
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
  label: { fontSize: 14, fontWeight: '600' },
  input: { borderRadius: radii.md, fontSize: 16, minHeight: 48, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  half: { flexBasis: 220, flexGrow: 1 },
  third: { flexBasis: 130, flexGrow: 1 }
});
