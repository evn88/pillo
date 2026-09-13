import { AppSymbol } from '@/components/app-symbol';
import { useState } from 'react';
import { ScreenActions, supportsTabAccessory } from '@/components/screen-actions';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { IntakeAction } from '@/components/intake-action';
import { SwipeActionsRow } from '@/components/swipe-actions-row';
import { HistorySheet } from '@/components/history-sheet';
import { LegacyStockReturnSheet } from '@/components/legacy-stock-return-sheet';
import { ManualIntakeSheet } from '@/components/manual-intake-sheet';
import { ScheduledIntakeSheet } from '@/components/scheduled-intake-sheet';
import { ActionButton, Surface } from '@/components/ui';
import { getLocalDateKey } from '@/domain/schedule';
import type { Intake, Medication } from '@/domain/types';
import { usePilloContext } from '@/providers/pillo-provider';
import { colors, radii, spacing } from '@/theme/tokens';
import { usePilloTheme } from '@/theme/use-pillo-theme';

const formatDose = (value: number): string => `${String(value).replace('.', ',')} ед.`;

export const TodayScreen = ({ focusedIntakeId, isLargeText }: { focusedIntakeId?: string; isLargeText: boolean }) => {
  const { calendarCoverage, isSaving, setIntakeStatus, snapshot, takeMedicationNow, takeScheduledIntake } = usePilloContext();
  const { isDark, palette } = usePilloTheme(snapshot.settings.theme);
  const [isHistoryOpen, setHistoryOpen] = useState(false);
  const [isManualIntakeOpen, setManualIntakeOpen] = useState(false);
  const [doseIntake, setDoseIntake] = useState<Intake | null>(null);
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

  const intakeMenu = (intake: Intake) => [
    { id: 'dose', label: 'Доза', icon: 'slider.horizontal.3' as const, color: colors.light.primary, onPress: () => setDoseIntake(intake) },
    { id: 'skip', label: 'Пропустить', icon: 'forward.end' as const, color: colors.light.textMuted, onPress: () => changeStatus(intake, 'SKIPPED') },
    { id: 'manual', label: 'Вручную', icon: 'plus' as const, color: colors.light.success, onPress: () => setManualIntakeOpen(true) }
  ];

  return (
    <View style={styles.screenRoot}>
      <ScrollView contentContainerStyle={styles.screenContent} contentInsetAdjustmentBehavior="automatic">
        <View style={styles.headingRow}>
          <Text accessibilityRole="header" maxFontSizeMultiplier={1.5} style={[styles.eyebrow, { color: palette.text }]}>Сегодня</Text>
          {!supportsTabAccessory ? <ActionButton compact label="Приём" onPress={() => setManualIntakeOpen(true)} disabled={isSaving || snapshot.medications.length === 0} palette={palette} /> : null}
          <ActionButton compact label="История" onPress={() => setHistoryOpen(true)} palette={palette} tone="secondary" />
        </View>
        <View style={styles.singleColumn}>
          <View style={styles.primaryColumn}>
            {displayedIntakes.length === 0 ? <Surface palette={palette} style={styles.emptySurface}><Text style={styles.emptyIcon}>✓</Text><Text style={[styles.emptyTitle, { color: palette.text }]}>На сегодня приёмов нет</Text><Text style={[styles.emptyText, { color: palette.textMuted }]}>Можно отдохнуть или отметить внеплановый приём вручную.</Text><View style={styles.inlineAction}><ActionButton label="Добавить препарат" onPress={() => router.navigate('/medications')} palette={palette} /></View></Surface> : (
              <View style={styles.list}>{displayedIntakes.map(intake => {
                const medication = medicationById.get(intake.medicationId);
                const isLowStock = medication ? medication.stockUnits <= medication.minThresholdUnits : false;
                const hasStockDiscrepancy = intake.status === 'PENDING' && medication ? medication.stockUnits < intake.doseUnits : false;
                const isFocused = focusedIntake?.id === intake.id;
                const card = <Surface key={intake.id} palette={palette} style={isFocused ? { borderColor: palette.primary, borderWidth: 2 } : isLowStock ? { borderColor: palette.warning } : undefined}>
                  <View style={styles.cardHeader}>
                    {!isLargeText ? <View style={[styles.medicationGlyph, { backgroundColor: palette.primarySoft }]}><AppSymbol name="pill.fill" fallback="Rx" color={palette.primary} /></View> : null}
                    <Pressable accessibilityRole={intake.status === 'PENDING' ? 'button' : undefined}
                      accessibilityLabel={intake.status === 'PENDING' ? `Изменить дозу приёма ${medication?.name ?? 'препарата'}` : undefined}
                      disabled={intake.status !== 'PENDING' || !medication || isSaving}
                      onPress={() => setDoseIntake(intake)} style={styles.cardHeaderCopy}>
                      <Text style={[styles.cardTitle, { color: palette.text }]}>{medication?.name ?? intake.medicationName}</Text>
                      <Text style={[styles.cardMeta, { color: palette.textMuted }]}>{intake.localTime} · {formatDose(intake.doseUnits)}{medication?.dosage ? ` · ${medication.dosage}` : ''}</Text>
                      {intake.status !== 'PENDING' ? <Text style={[styles.cardMeta, { color: intake.status === 'TAKEN' ? palette.success : palette.textMuted }]}>{intake.status === 'TAKEN' ? 'Принято' : 'Пропущено'}</Text> : null}
                    </Pressable>
                    {intake.status === 'PENDING' ? <IntakeAction
                      accessibilityText={`Принять ${medication?.name ?? 'препарат'} в дозе ${formatDose(intake.doseUnits)}`}
                      disabled={isSaving || !medication} isDark={isDark} items={[]}
                      onPress={() => void takeScheduledIntake(intake.id, intake.doseUnits)} tintColor={palette.primary}
                    /> : null}
                  </View>
                  {isLowStock || hasStockDiscrepancy ? <View style={[styles.stockWarning, { backgroundColor: palette.warningSoft }]}><Text accessibilityRole={hasStockDiscrepancy ? 'alert' : undefined} style={[styles.stockWarningText, { color: palette.warning }]}>{hasStockDiscrepancy ? `Учётный запас меньше дозы: ${medication?.stockUnits ?? 0} из ${intake.doseUnits} ед. При отметке остаток станет 0 — проверьте фактический запас.` : `Запас подходит к концу · осталось ${medication?.stockUnits ?? 0} ед.`}</Text></View> : null}
                  {intake.status !== 'PENDING' ? <View style={styles.cardActions}><ActionButton compact disabled={isSaving} label="Отменить отметку" onPress={() => changeStatus(intake, 'PENDING')} palette={palette} tone="secondary" /></View> : null}
                </Surface>;
                return intake.status === 'PENDING' ? <SwipeActionsRow key={intake.id}
                  actions={intakeMenu(intake)} backgroundColor={palette.surface} disabled={isSaving || !medication}
                  label={`${medication?.name ?? intake.medicationName}, ${intake.localTime}, ${formatDose(intake.doseUnits)}`}
                  onActivate={() => void takeScheduledIntake(intake.id, intake.doseUnits)}>{card}</SwipeActionsRow> : card;
              })}</View>
            )}
          </View>
          {lowStock.length ? <View style={styles.secondaryColumn}><Text style={[styles.columnTitle, { color: palette.text }]}>Требует внимания</Text>{lowStock.map(medication => <LowStockCard key={medication.id} medication={medication} palette={palette} />)}</View> : null}
        </View>

      {displayedIntakes.some(intake => intake.status === 'PENDING') ? <Text style={[styles.gestureHint, { color: palette.textMuted }]}>Смахните приём влево, чтобы изменить дозу или пропустить.</Text> : null}
      </ScrollView>
      <ScreenActions route="/" inlineFallback={false} actions={[{
        label: 'Отметить приём', onPress: () => setManualIntakeOpen(true), disabled: isSaving || snapshot.medications.length === 0
      }]} />
      <ManualIntakeSheet isDark={isDark} key={isManualIntakeOpen ? 'manual-open:select' : 'manual-closed'} medications={snapshot.medications} onClose={() => setManualIntakeOpen(false)} onSave={takeMedicationNow} visible={isManualIntakeOpen} />
      {doseIntake && medicationById.get(doseIntake.medicationId) ? <ScheduledIntakeSheet
        intake={doseIntake}
        isDark={isDark}
        key={doseIntake.id}
        medication={medicationById.get(doseIntake.medicationId)!}
        onClose={() => setDoseIntake(null)}
        onSave={takeScheduledIntake}
      /> : null}
      {isHistoryOpen ? <HistorySheet calendarCoverage={calendarCoverage} intakes={snapshot.intakes} isDark={isDark} medications={snapshot.medications} onClose={() => setHistoryOpen(false)} visible /> : null}
      {legacyUndoIntake ? <LegacyStockReturnSheet intake={legacyUndoIntake} isDark={isDark} medication={medicationById.get(legacyUndoIntake.medicationId)} onClose={() => setLegacyUndoIntake(null)} onConfirm={(quantity, commandId) => setIntakeStatus(legacyUndoIntake.id, 'PENDING', quantity, commandId)} /> : null}
    </View>
  );
};

const LowStockCard = ({ medication, palette }: { medication: Medication; palette: ReturnType<typeof usePilloTheme>['palette'] }) => {
  return <Surface palette={palette}><Text style={[styles.cardTitle, { color: palette.text }]}>{medication.name}</Text><Text style={[styles.cardMeta, { color: palette.warning }]}>Осталось {medication.stockUnits}</Text></Surface>;
};

const styles = StyleSheet.create({
  screenRoot: { flex: 1 },
  screenContent: { alignSelf: 'center', gap: spacing.xl, maxWidth: 1180, padding: spacing.lg, paddingBottom: spacing.xxl, paddingTop: spacing.xl, width: '100%' },
  headingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm },
  eyebrow: { fontSize: 30, fontWeight: '700', letterSpacing: -0.6, marginHorizontal: spacing.sm },
  gestureHint: { fontSize: 13, lineHeight: 19, paddingHorizontal: spacing.sm },
  singleColumn: { gap: spacing.lg },
  primaryColumn: { gap: spacing.lg },
  secondaryColumn: { gap: spacing.md },
  columnTitle: { fontSize: 16, fontWeight: '700' },
  list: { gap: spacing.md },
  emptySurface: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyIcon: { fontSize: 28, marginBottom: spacing.md },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: spacing.sm },
  emptyText: { fontSize: 14, lineHeight: 20 },
  inlineAction: { alignSelf: 'flex-end', marginTop: spacing.lg },
  cardHeader: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  medicationGlyph: { alignItems: 'center', borderRadius: radii.md, height: 48, justifyContent: 'center', width: 44 },
  cardHeaderCopy: { flex: 1, minHeight: 48, justifyContent: 'center' },
  cardTitle: { fontSize: 17, fontWeight: '700' },
  cardMeta: { fontSize: 13, lineHeight: 19, marginTop: spacing.xs },
  stockWarning: { borderRadius: radii.md, marginTop: spacing.lg, padding: spacing.lg },
  stockWarningText: { fontSize: 14, fontWeight: '700', lineHeight: 20 },
  cardActions: { alignItems: 'flex-end', marginTop: spacing.sm }
});
