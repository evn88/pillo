import { getLocalDateKey } from '../domain/schedule';
import { Modal, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { CalendarCoverage, Intake, Medication } from '@/domain/types';
import { colors, radii, spacing } from '@/theme/tokens';
import { ActionButton, Surface } from './ui';

type HistorySheetProps = {
  intakes: Intake[];
  calendarCoverage: CalendarCoverage[];
  isDark: boolean;
  medications: Medication[];
  onClose: () => void;
  visible: boolean;
};

const formatDate = (dateKey: string): string => {
  const date = new Date(`${dateKey}T12:00:00`);

  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    weekday: 'short'
  }).format(date);
};

export const HistorySheet = ({ intakes, calendarCoverage, isDark, medications, onClose, visible }: HistorySheetProps) => {
  const palette = isDark ? colors.dark : colors.light;
  const medicationById = new Map(medications.map(medication => [medication.id, medication]));
  const history = [...intakes]
    .filter(intake => intake.localDate <= getLocalDateKey(new Date()))
    .sort((first, second) => {
      const firstKey = `${first.localDate}-${first.localTime}`;
      const secondKey = `${second.localDate}-${second.localTime}`;
      return secondKey.localeCompare(firstKey);
    });
  const groupedHistory = history.reduce<Map<string, Intake[]>>((groups, intake) => {
    const entries = groups.get(intake.localDate) ?? [];
    groups.set(intake.localDate, [...entries, intake]);
    return groups;
  }, new Map());

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
      visible={visible}
    >
      <View style={[styles.container, { backgroundColor: palette.background }]}>
        <View style={[styles.header, { borderColor: palette.border }]}>
          <View style={styles.headerCopy}>
            <Text style={[styles.title, { color: palette.text }]}>История приёма</Text>
            <Text style={[styles.description, { color: palette.textMuted }]}>
              Здесь собраны приёмы по расписанию и ручные отметки. Периоды вне сохранённого покрытия неизвестны.
            </Text>
          </View>
          <ActionButton label="Готово" onPress={onClose} palette={palette} tone="secondary" />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={{ color: palette.textMuted }}>Покрытие плана: {calendarCoverage.map(item => `${item.from} — ${item.through}`).join('; ') || 'неизвестно'}.</Text>
          {history.length === 0 ? (
            <Surface palette={palette}>
              <Text style={[styles.emptyTitle, { color: palette.text }]}>История пока пуста</Text>
              <Text style={[styles.description, { color: palette.textMuted }]}>
                Завершённые и пропущенные приёмы появятся здесь автоматически.
              </Text>
            </Surface>
          ) : (
            [...groupedHistory.entries()].map(([date, entries]) => (
              <View key={date} style={styles.group}>
                <Text style={[styles.date, { color: palette.textMuted }]}>{formatDate(date)}</Text>
                <Surface palette={palette} style={styles.entries}>
                  {entries.map((intake, index) => {
                    const medication = medicationById.get(intake.medicationId);
                    const isTaken = intake.status === 'TAKEN';

                    return (
                      <View
                        key={intake.id}
                        style={[
                          styles.entry,
                          index > 0 && { borderColor: palette.border, borderTopWidth: StyleSheet.hairlineWidth }
                        ]}
                      >
                        <View style={styles.entryCopy}>
                          <Text style={[styles.entryTitle, { color: palette.text }]}>
                            {intake.medicationName || medication?.name || 'Удалённый препарат'}
                          </Text>
                          <Text style={[styles.entryMeta, { color: palette.textMuted }]}>
                            {intake.localTime} · {intake.doseUnits} ед. · {intake.source === 'MANUAL' ? 'вручную' : 'по расписанию'}
                            {intake.recordedAt ? ` · отмечено ${new Date(intake.recordedAt).toLocaleString('ru-RU')}` : ''}
                            {intake.contextSource === 'LEGACY' ? ' · данные препарата восстановлены' : ''}
                          </Text>
                        </View>
                        <View style={[styles.badge, { backgroundColor: isTaken ? palette.successSoft : palette.dangerSoft }]}>
                          <Text style={[styles.badgeText, { color: isTaken ? palette.success : palette.danger }]}>
                            {isTaken ? 'ПРИНЯТО' : intake.status === 'PENDING' ? 'НЕ ОТМЕЧЕНО' : 'ПРОПУЩЕНО'}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </Surface>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    alignItems: 'flex-start',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.lg,
    padding: spacing.xl
  },
  headerCopy: { flex: 1, gap: spacing.sm },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.7 },
  description: { fontSize: 15, lineHeight: 21 },
  content: { gap: spacing.xl, padding: spacing.xl, paddingBottom: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: spacing.sm },
  group: { gap: spacing.sm },
  date: { fontSize: 13, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' },
  entries: { paddingVertical: spacing.xs },
  entry: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.lg },
  entryCopy: { flex: 1 },
  entryTitle: { fontSize: 17, fontWeight: '700' },
  entryMeta: { fontSize: 13, lineHeight: 18, marginTop: spacing.xs },
  badge: { borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  badgeText: { fontSize: 11, fontWeight: '800' }
});
