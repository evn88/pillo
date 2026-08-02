import { useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { getLocalDateKey } from '@/domain/schedule';
import type { Medication, ScheduleRule } from '@/domain/types';
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
  onSave: (rule: Omit<ScheduleRule, 'id'> & { id?: string }) => Promise<void>;
  rule: ScheduleRule | null;
  visible: boolean;
};

export const ScheduleForm = ({ isDark, medications, onClose, onSave, rule, visible }: ScheduleFormProps) => {
  const palette = isDark ? colors.dark : colors.light;
  const [medicationId, setMedicationId] = useState(rule?.medicationId ?? medications[0]?.id ?? '');
  const [time, setTime] = useState(rule?.time ?? '09:00');
  const [doseUnits, setDoseUnits] = useState(String(rule?.doseUnits ?? 1));
  const [selectedDays, setSelectedDays] = useState(rule?.daysOfWeek ?? days.map(day => day.value));
  const [startDate, setStartDate] = useState(rule?.startDate ?? getLocalDateKey(new Date()));
  const [endDate, setEndDate] = useState(rule?.endDate ?? '');
  const [comment, setComment] = useState(rule?.comment ?? '');
  const inputStyle = [styles.input, { backgroundColor: palette.surface, borderColor: palette.border, color: palette.text }];

  const toggleDay = (value: number) => {
    setSelectedDays(current => current.includes(value) ? current.filter(day => day !== value) : [...current, value]);
  };

  const handleSave = async () => {
    await onSave({
      id: rule?.id,
      medicationId,
      time,
      doseUnits: Math.max(0.25, Number(doseUnits) || 1),
      daysOfWeek: selectedDays,
      startDate,
      endDate: endDate || null,
      comment: comment.trim(),
      isActive: rule?.isActive ?? true
    });
    onClose();
  };

  return (
    <Modal animationType="slide" onRequestClose={onClose} presentationStyle={Platform.OS === 'ios' ? 'formSheet' : 'fullScreen'} visible={visible}>
      <ScrollView contentContainerStyle={[styles.content, { backgroundColor: palette.background }]}>
        <View style={styles.heading}>
          <View style={styles.headingCopy}>
            <Text style={[styles.kicker, { color: palette.primary }]}>РАСПИСАНИЕ</Text>
            <Text style={[styles.title, { color: palette.text }]}>{rule ? 'Изменить приём' : 'Добавить приём'}</Text>
          </View>
          <ActionButton label="Закрыть" onPress={onClose} palette={palette} tone="secondary" />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: palette.text }]}>Препарат</Text>
          <View style={styles.options}>
            {medications.map(medication => (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ checked: medication.id === medicationId }}
                android_ripple={{ color: palette.primarySoft }}
                key={medication.id}
                onPress={() => setMedicationId(medication.id)}
                style={[
                  styles.option,
                  { backgroundColor: palette.surfaceMuted },
                  medication.id === medicationId && { backgroundColor: palette.primarySoft }
                ]}
              >
                <Text style={{ color: palette.text, fontWeight: '600' }}>{medication.name}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.field, styles.half]}>
            <Text style={[styles.label, { color: palette.text }]}>Время, ЧЧ:ММ</Text>
            <TextInput keyboardAppearance={isDark ? 'dark' : 'light'} keyboardType="numbers-and-punctuation" onChangeText={setTime} selectionColor={palette.primary} style={inputStyle} value={time} />
          </View>
          <View style={[styles.field, styles.half]}>
            <Text style={[styles.label, { color: palette.text }]}>Количество</Text>
            <TextInput keyboardAppearance={isDark ? 'dark' : 'light'} keyboardType="decimal-pad" onChangeText={setDoseUnits} selectionColor={palette.primary} style={inputStyle} value={doseUnits} />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: palette.text }]}>Дни недели</Text>
          <View style={styles.days}>
            {days.map(day => (
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selectedDays.includes(day.value) }}
                android_ripple={{ color: palette.primarySoft, borderless: true }}
                key={day.value}
                onPress={() => toggleDay(day.value)}
                style={[
                  styles.day,
                  { backgroundColor: palette.surfaceMuted },
                  selectedDays.includes(day.value) && { backgroundColor: palette.primary }
                ]}
              >
                <Text style={{ color: selectedDays.includes(day.value) ? palette.surface : palette.text, fontWeight: '700' }}>{day.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.field, styles.half]}>
            <Text style={[styles.label, { color: palette.text }]}>Начало, ГГГГ-ММ-ДД</Text>
            <TextInput clearButtonMode="while-editing" keyboardAppearance={isDark ? 'dark' : 'light'} onChangeText={setStartDate} selectionColor={palette.primary} style={inputStyle} value={startDate} />
          </View>
          <View style={[styles.field, styles.half]}>
            <Text style={[styles.label, { color: palette.text }]}>Окончание</Text>
            <TextInput clearButtonMode="while-editing" keyboardAppearance={isDark ? 'dark' : 'light'} onChangeText={setEndDate} placeholder="Не ограничено" placeholderTextColor={palette.textMuted} selectionColor={palette.primary} style={inputStyle} value={endDate} />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: palette.text }]}>Комментарий</Text>
          <TextInput clearButtonMode="while-editing" keyboardAppearance={isDark ? 'dark' : 'light'} onChangeText={setComment} selectionColor={palette.primary} style={inputStyle} value={comment} />
        </View>

        <ActionButton
          disabled={!medicationId || selectedDays.length === 0 || !/^\d{2}:\d{2}$/.test(time)}
          label="Сохранить"
          onPress={() => void handleSave()}
          palette={palette}
        />
      </ScrollView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  content: { alignSelf: 'center', flexGrow: 1, gap: spacing.xl, maxWidth: 680, padding: spacing.xl, width: '100%' },
  heading: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.lg, justifyContent: 'space-between' },
  headingCopy: { flex: 1, gap: spacing.sm },
  kicker: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  field: { gap: spacing.sm },
  label: { fontSize: 14, fontWeight: '600' },
  input: { borderRadius: radii.md, borderWidth: StyleSheet.hairlineWidth, fontSize: 16, minHeight: 50, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  half: { flexBasis: 220, flexGrow: 1 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  option: { borderRadius: radii.pill, minHeight: 44, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  days: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  day: { alignItems: 'center', borderRadius: radii.pill, height: 44, justifyContent: 'center', width: 44 }
});
