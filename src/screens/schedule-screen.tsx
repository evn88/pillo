import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { NativePrimaryButton } from '@/components/native-action-button';
import { ScheduleForm } from '@/components/schedule-form';
import { SwipeableCard } from '@/components/swipeable-card';
import { Surface } from '@/components/ui';
import type { ScheduleRule } from '@/domain/types';
import { usePilloContext } from '@/providers/pillo-provider';
import { radii, spacing } from '@/theme/tokens';
import { usePilloTheme } from '@/theme/use-pillo-theme';

const formatDose = (value: number): string => `${value} ед.`;

export const ScheduleScreen = () => {
  const { createMedicationId, deleteScheduleRule, saveScheduleRule, snapshot } = usePilloContext();
  const { isDark, palette } = usePilloTheme(snapshot.settings.theme);
  const [newRuleId, setNewRuleId] = useState('');
  const [editingRule, setEditingRule] = useState<ScheduleRule | null>(null);
  const [isScheduleFormOpen, setScheduleFormOpen] = useState(false);
  const medicationById = new Map(snapshot.medications.map(medication => [medication.id, medication]));

  const openNewRule = () => {
    setNewRuleId(createMedicationId());
    setEditingRule(null);
    setScheduleFormOpen(true);
  };

  return (
    <View style={styles.screenRoot}>
      <ScrollView contentContainerStyle={[styles.screenContent, styles.screenWithFloatingActions]} contentInsetAdjustmentBehavior="automatic">
        <Text style={[styles.eyebrow, { color: palette.textMuted }]}>ПРАВИЛА ПРИЁМА</Text>
        {snapshot.scheduleRules.length === 0 ? <Surface palette={palette}><Text style={[styles.emptyTitle, { color: palette.text }]}>Расписание не настроено</Text><Text style={[styles.emptyText, { color: palette.textMuted }]}>{snapshot.medications.length ? 'Добавьте время и дни приёма.' : 'Сначала добавьте хотя бы один препарат.'}</Text></Surface> : (
          <View style={styles.list}>{[...snapshot.scheduleRules].sort((a, b) => a.time.localeCompare(b.time)).map(rule => (
            <SwipeableCard accessibilityLabel={`Изменить расписание ${medicationById.get(rule.medicationId)?.name ?? 'удалённого препарата'} на ${rule.time}`} deleteColor={palette.danger} key={rule.id} onDelete={() => Alert.alert('Удалить правило?', 'Будущие приёмы по этому правилу будут удалены.', [{ text: 'Отмена', style: 'cancel' }, { text: 'Удалить', style: 'destructive', onPress: () => void deleteScheduleRule(rule.id) }])} onPress={() => { setEditingRule(rule); setScheduleFormOpen(true); }}>
              <Surface palette={palette}>
                <View style={styles.scheduleRow}><View style={[styles.medicationGlyph, { backgroundColor: palette.primarySoft }]}><Text style={[styles.medicationGlyphText, { color: palette.primary }]}>◷</Text></View><View style={styles.scheduleCopy}><Text style={[styles.cardTitle, { color: palette.text }]}>{medicationById.get(rule.medicationId)?.name ?? 'Удалённый препарат'}</Text><Text style={[styles.cardMeta, { color: palette.textMuted }]}>{rule.time} · {formatDose(rule.doseUnits)}</Text></View><View style={[styles.statusBadge, { backgroundColor: rule.isActive ? palette.successSoft : palette.surfaceMuted }]}><Text style={[styles.statusText, { color: rule.isActive ? palette.success : palette.textMuted }]}>{rule.isActive ? 'АКТИВНО' : 'НЕАКТИВНО'}</Text></View></View>
                <View style={styles.daysRow}>{[1, 2, 3, 4, 5, 6, 0].map((day, index) => <View key={day} style={[styles.dayBadge, { backgroundColor: rule.daysOfWeek.includes(day) ? palette.primarySoft : palette.surfaceMuted }]}><Text style={[styles.dayText, { color: rule.daysOfWeek.includes(day) ? palette.primary : palette.textMuted }]}>{['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'][index]}</Text></View>)}</View>
              </Surface>
            </SwipeableCard>
          ))}</View>
        )}
      </ScrollView>
      <View style={[styles.floatingFooter, { backgroundColor: palette.background }]}><NativePrimaryButton disabled={snapshot.medications.length === 0} isDark={isDark} label="Добавить расписание" onPress={openNewRule} tintColor={palette.primary} /></View>
      {isScheduleFormOpen ? <ScheduleForm isDark={isDark} key={editingRule?.id ?? 'new-rule'} medications={snapshot.medications} newId={newRuleId} onClose={() => setScheduleFormOpen(false)} onSave={saveScheduleRule} rule={editingRule} visible /> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  screenRoot: { flex: 1 },
  screenContent: { alignSelf: 'center', gap: spacing.xl, maxWidth: 1180, padding: spacing.lg, paddingBottom: 48, paddingTop: spacing.xl, width: '100%' },
  screenWithFloatingActions: { paddingBottom: 176 },
  floatingFooter: { bottom: 0, left: 0, padding: spacing.lg, position: 'absolute', right: 0 },
  eyebrow: { fontSize: 14, fontWeight: '800', letterSpacing: 2.6, marginHorizontal: spacing.sm },
  list: { gap: spacing.md },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: spacing.sm },
  emptyText: { fontSize: 14, lineHeight: 20 },
  scheduleRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.lg },
  medicationGlyph: { alignItems: 'center', borderRadius: radii.md, height: 52, justifyContent: 'center', width: 52 },
  medicationGlyphText: { fontSize: 22, fontWeight: '700' },
  scheduleCopy: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: '700' },
  cardMeta: { fontSize: 13, lineHeight: 19, marginTop: spacing.xs },
  statusBadge: { borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  statusText: { fontSize: 12, fontWeight: '700' },
  daysRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
  dayBadge: { alignItems: 'center', borderRadius: radii.pill, height: 38, justifyContent: 'center', width: 38 },
  dayText: { fontSize: 12, fontWeight: '800' }
});
