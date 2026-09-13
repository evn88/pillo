import { AppSymbol } from '@/components/app-symbol';
import { useState } from 'react';
import { ScreenActions } from '@/components/screen-actions';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { HistorySheet } from '@/components/history-sheet';
import { LegacyStockReturnSheet } from '@/components/legacy-stock-return-sheet';
import { ManualIntakeSheet } from '@/components/manual-intake-sheet';
import { ActionButton, Surface } from '@/components/ui';
import { getLocalDateKey } from '@/domain/schedule';
import type { Intake, Medication } from '@/domain/types';
import { usePilloContext } from '@/providers/pillo-provider';
import { radii, spacing } from '@/theme/tokens';
import { usePilloTheme } from '@/theme/use-pillo-theme';

const formatDose = (value: number): string => `${value} ед.`;

export const TodayScreen = ({ focusedIntakeId, isLargeText }: { focusedIntakeId?: string; isLargeText: boolean }) => {
  const { calendarCoverage, setIntakeStatus, snapshot, takeMedicationNow } = usePilloContext();
  const { isDark, palette } = usePilloTheme(snapshot.settings.theme);
  const [isHistoryOpen, setHistoryOpen] = useState(false);
  const [isManualIntakeOpen, setManualIntakeOpen] = useState(false);
  const [legacyUndoIntake, setLegacyUndoIntake] = useState<Intake | null>(null);
  const todayKey = getLocalDateKey(new Date());
  const medicationById = new Map(snapshot.medications.map(medication => [medication.id, medication]));
  const todayIntakes = snapshot.intakes.filter(intake => intake.localDate === todayKey).sort((a, b) => a.localTime.localeCompare(b.localTime));
  const focusedIntake = focusedIntakeId ? snapshot.intakes.find(intake => intake.id === focusedIntakeId) : undefined;
  const displayedIntakes = focusedIntake && !todayIntakes.some(intake => intake.id === focusedIntake.id) ? [focusedIntake, ...todayIntakes] : todayIntakes;
  const lowStock = snapshot.medications.filter(medication => medication.stockUnits <= medication.minThresholdUnits);

  const changeStatus = (intake: Intake, status: Intake['status']) => {
    if (status === 'PENDING' && intake.status === 'TAKEN' && intake.stockEffectUnits === null) {
      setLegacyUndoIntake(intake);
      return;
    }
    void setIntakeStatus(intake.id, status);
  };

  return (
    <View style={styles.screenRoot}>
      <ScrollView contentContainerStyle={styles.screenContent} contentInsetAdjustmentBehavior="automatic">
        <Text accessibilityRole="header" maxFontSizeMultiplier={1.5} style={[styles.eyebrow, { color: palette.text }]}>Сегодня</Text>
        <View style={styles.singleColumn}>
          <View style={styles.primaryColumn}>
            {displayedIntakes.length === 0 ? <Surface palette={palette} style={styles.emptySurface}><Text style={styles.emptyIcon}>✓</Text><Text style={[styles.emptyTitle, { color: palette.text }]}>На сегодня приёмов нет</Text><Text style={[styles.emptyText, { color: palette.textMuted }]}>Можно отдохнуть или отметить внеплановый приём вручную.</Text><View style={styles.inlineAction}><ActionButton label="Добавить препарат" onPress={() => router.navigate('/medications')} palette={palette} /></View></Surface> : (
              <View style={styles.list}>{displayedIntakes.map(intake => {
                const medication = medicationById.get(intake.medicationId);
                const isLowStock = medication ? medication.stockUnits <= medication.minThresholdUnits : false;
                const hasStockDiscrepancy = intake.status === 'PENDING' && medication ? medication.stockUnits < intake.doseUnits : false;
                const isFocused = focusedIntake?.id === intake.id;
                return <Surface key={intake.id} palette={palette} style={isFocused ? { borderColor: palette.primary, borderWidth: 2 } : isLowStock ? { borderColor: palette.warning } : undefined}>
                  <View style={[styles.cardHeader, isLargeText && styles.cardHeaderLarge]}><View style={[styles.medicationGlyph, { backgroundColor: palette.primarySoft }]}><AppSymbol name="pill.fill" fallback="Rx" color={palette.primary} /></View><View style={[styles.cardHeaderCopy, isLargeText && styles.cardHeaderCopyLarge]}><Text style={[styles.cardTitle, { color: palette.text }]}>{medication?.name ?? 'Удалённый препарат'}</Text><Text style={[styles.cardMeta, { color: palette.textMuted }]}>{intake.localTime} · {formatDose(intake.doseUnits)}{medication?.dosage ? ` · ${medication.dosage}` : ''}</Text></View><View style={[styles.statusBadge, { backgroundColor: intake.status === 'TAKEN' ? palette.successSoft : intake.status === 'SKIPPED' ? palette.dangerSoft : palette.primarySoft }]}><Text style={[styles.statusText, { color: intake.status === 'TAKEN' ? palette.success : intake.status === 'SKIPPED' ? palette.danger : palette.primary }]}>{intake.status === 'TAKEN' ? 'ПРИНЯТО' : intake.status === 'SKIPPED' ? 'ПРОПУЩЕНО' : 'ОЖИДАЕТ'}</Text></View></View>
                  {isLowStock || hasStockDiscrepancy ? <View style={[styles.stockWarning, { backgroundColor: palette.warningSoft }]}><Text accessibilityRole={hasStockDiscrepancy ? 'alert' : undefined} style={[styles.stockWarningText, { color: palette.warning }]}>{hasStockDiscrepancy ? `Учётный запас меньше дозы: ${medication?.stockUnits ?? 0} из ${intake.doseUnits} ед. При отметке остаток станет 0 — проверьте фактический запас.` : `Запас подходит к концу · осталось ${medication?.stockUnits ?? 0} ед.`}</Text></View> : null}
                  <View style={styles.cardActions}>{intake.status === 'PENDING' ? <><ActionButton label="Принял" onPress={() => changeStatus(intake, 'TAKEN')} palette={palette} /><ActionButton label="Пропустить" onPress={() => changeStatus(intake, 'SKIPPED')} palette={palette} tone="secondary" /></> : <ActionButton label="Отменить отметку" onPress={() => changeStatus(intake, 'PENDING')} palette={palette} tone="secondary" />}</View>
                </Surface>;
              })}</View>
            )}
          </View>
          {lowStock.length ? <View style={styles.secondaryColumn}><Text style={[styles.columnTitle, { color: palette.text }]}>Требует внимания</Text>{lowStock.map(medication => <LowStockCard key={medication.id} medication={medication} palette={palette} />)}</View> : null}
        </View>

      <ScreenActions route="/" actions={[{ label: 'Вне расписания', onPress: () => setManualIntakeOpen(true), disabled: snapshot.medications.length === 0 }, { label: 'История', onPress: () => setHistoryOpen(true) }]} />
      </ScrollView>
      <ManualIntakeSheet isDark={isDark} key={isManualIntakeOpen ? 'manual-open:select' : 'manual-closed'} medications={snapshot.medications} onClose={() => setManualIntakeOpen(false)} onSave={takeMedicationNow} visible={isManualIntakeOpen} />
      {isHistoryOpen ? <HistorySheet calendarCoverage={calendarCoverage} intakes={snapshot.intakes} isDark={isDark} medications={snapshot.medications} onClose={() => setHistoryOpen(false)} visible /> : null}
      {legacyUndoIntake ? <LegacyStockReturnSheet intake={legacyUndoIntake} isDark={isDark} medication={medicationById.get(legacyUndoIntake.medicationId)} onClose={() => setLegacyUndoIntake(null)} onConfirm={(quantity, commandId) => setIntakeStatus(legacyUndoIntake.id, 'PENDING', quantity, commandId)} /> : null}
    </View>
  );
};

const LowStockCard = ({ medication, palette }: { medication: Medication; palette: ReturnType<typeof usePilloTheme>['palette'] }) => {
  return <Surface palette={palette}><Text style={[styles.cardTitle, { color: palette.text }]}>{medication.name}</Text><Text style={[styles.cardMeta, { color: palette.warning }]}>Осталось {medication.stockUnits}</Text></Surface>;
};

const styles = StyleSheet.create({
  screenRoot: { flex: 1 }, screenContent: { alignSelf: 'center', gap: spacing.xl, maxWidth: 1180, padding: spacing.lg, paddingBottom: spacing.xxl, paddingTop: spacing.xl, width: '100%' }, inlineFooter: { marginTop: spacing.md }, eyebrow: { fontSize: 30, fontWeight: '700', letterSpacing: -0.6, marginHorizontal: spacing.sm }, singleColumn: { gap: spacing.lg }, primaryColumn: { gap: spacing.lg }, secondaryColumn: { gap: spacing.md }, columnTitle: { fontSize: 16, fontWeight: '700' }, list: { gap: spacing.md }, emptySurface: { alignItems: 'center', paddingVertical: spacing.xxl }, emptyIcon: { fontSize: 28, marginBottom: spacing.md }, emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: spacing.sm }, emptyText: { fontSize: 14, lineHeight: 20 }, inlineAction: { alignSelf: 'flex-start', marginTop: spacing.lg }, cardHeader: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.md }, cardHeaderLarge: { flexDirection: 'column' }, medicationGlyph: { alignItems: 'center', borderRadius: radii.md, height: 52, justifyContent: 'center', width: 52 }, medicationGlyphText: { fontSize: 22, fontWeight: '700' }, cardHeaderCopy: { flex: 1 }, cardHeaderCopyLarge: { flex: undefined, width: '100%' }, cardTitle: { fontSize: 17, fontWeight: '700' }, cardMeta: { fontSize: 13, lineHeight: 19, marginTop: spacing.xs }, statusBadge: { borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }, statusText: { fontSize: 12, fontWeight: '700' }, stockWarning: { borderRadius: radii.md, marginTop: spacing.lg, padding: spacing.lg }, stockWarningText: { fontSize: 14, fontWeight: '700', lineHeight: 20 }, cardActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg }, floatingActions: { alignItems: 'center', flexDirection: 'row', gap: spacing.md }, floatingPrimary: { flex: 1, minHeight: 60 }
});
