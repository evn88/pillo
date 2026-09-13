import type { CommandResult } from '../application/contracts';
import { parseQuantity } from '../domain/validation';
import { useFormCommand } from '../hooks/use-form-command';
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

import type { Intake, Medication } from '@/domain/types';
import { useLargeTextLayout } from '@/hooks/use-large-text-layout';
import { colors, spacing } from '@/theme/tokens';
import { ActionButton, Surface } from './ui';

type LegacyStockReturnSheetProps = {
  intake: Intake;
  isDark: boolean;
  medication: Medication | undefined;
  onClose: () => void;
  onConfirm: (quantity: number, commandId: string) => Promise<CommandResult>;
};

export const LegacyStockReturnSheet = ({
  intake,
  isDark,
  medication,
  onClose,
  onConfirm
}: LegacyStockReturnSheetProps) => {
  const palette = isDark ? colors.dark : colors.light;
  const isLargeText = useLargeTextLayout();
  const [quantity, setQuantity] = useState(String(intake.doseUnits).replace('.', ','));
  const { error, isPending, submit } = useFormCommand();

  const handleConfirm = async () => {
    await submit(
      commandId => onConfirm(parseQuantity(quantity, 'Возвращаемое количество'), commandId),
      onClose,
      quantity
    );
  };

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle={Platform.OS === 'ios' ? 'formSheet' : 'fullScreen'}
      visible
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.container, { backgroundColor: palette.background }]}
      >
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm }}>
          <ActionButton label="Отмена" onPress={onClose} palette={palette} tone="secondary" />
          <ActionButton
              disabled={isPending}
              label={isPending ? 'Сохраняем…' : 'Отменить отметку'}
              onPress={() => void handleConfirm()}
              palette={palette}
            />
        </View>
        <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled">
          <View style={[styles.heading, isLargeText && styles.headingLarge]}>
            <View style={[styles.headingCopy, isLargeText && styles.headingCopyLarge]}>
              <Text style={[styles.title, { color: palette.text }]}>Уточните возвращаемый остаток</Text>
              <Text style={[styles.description, { color: palette.textMuted }]}>Для этой старой записи PillDan не знает, сколько единиц было списано. Укажите фактическое количество, которое нужно вернуть в учётный запас.</Text>
            </View>
          </View>

          <Surface palette={palette}>
            <Text style={[styles.medicationName, { color: palette.text }]}>{intake.medicationName || medication?.name || 'Удалённый препарат'}</Text>
            <Text style={[styles.description, { color: palette.textMuted }]}>Записанная доза: {intake.doseUnits} ед. · текущий учётный запас: {medication?.stockUnits ?? 'неизвестен'} ед.</Text>
          </Surface>

          <View style={styles.field}>
            <Text style={[styles.label, { color: palette.text }]}>Вернуть в запас</Text>
            <TextInput
              accessibilityLabel="Количество для возврата в запас"
              keyboardAppearance={isDark ? 'dark' : 'light'}
              keyboardType="decimal-pad"
              onChangeText={setQuantity}
              selectionColor={palette.primary}
              style={[styles.input, { backgroundColor: palette.surface, borderColor: palette.border, color: palette.text }]}
              value={quantity}
            />
            <Text style={[styles.description, { color: palette.textMuted }]}>Можно вернуть от 0 до {intake.doseUnits} ед. Значение 0 отменит отметку без изменения остатка.</Text>
          </View>

          {error ? <Text accessibilityRole="alert" style={{ color: palette.danger }}>{error}</Text> : null}

        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, justifyContent: 'flex-end' },
  container: { flex: 1 },
  content: { alignSelf: 'center', gap: spacing.xl, maxWidth: 680, padding: spacing.xl, width: '100%' },
  description: { fontSize: 14, lineHeight: 21 },
  field: { gap: spacing.md },
  heading: { alignItems: 'flex-start', flexDirection: 'column', gap: spacing.lg },
  headingLarge: { flexDirection: 'column' },
  headingCopy: { width: '100%', gap: spacing.sm },
  headingCopyLarge: { flex: undefined, width: '100%' },
  input: { borderRadius: 14, borderWidth: 1, fontSize: 18, minHeight: 56, paddingHorizontal: spacing.lg },
  label: { fontSize: 16, fontWeight: '700' },
  medicationName: { fontSize: 18, fontWeight: '700', marginBottom: spacing.sm },
  title: { fontSize: 27, fontWeight: '800', letterSpacing: -0.6 }
});
