import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ManualIntakeSheet } from '@/components/manual-intake-sheet';
import { MedicationForm } from '@/components/medication-form';
import { NativePrimaryButton } from '@/components/native-action-button';
import { SwipeableCard } from '@/components/swipeable-card';
import { ActionButton, Surface } from '@/components/ui';
import type { Medication } from '@/domain/types';
import { usePilloContext } from '@/providers/pillo-provider';
import { radii, spacing } from '@/theme/tokens';
import { usePilloTheme } from '@/theme/use-pillo-theme';

export const MedicationsScreen = () => {
  const { addPackage, createMedicationId, deleteMedication, saveMedication, snapshot, takeMedicationNow } = usePilloContext();
  const { isDark, palette } = usePilloTheme(snapshot.settings.theme);
  const [newMedicationId, setNewMedicationId] = useState('');
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [isMedicationFormOpen, setMedicationFormOpen] = useState(false);
  const [quickIntakeMedication, setQuickIntakeMedication] = useState<Medication | null>(null);

  const openNewMedication = () => {
    setNewMedicationId(createMedicationId());
    setEditingMedication(null);
    setMedicationFormOpen(true);
  };

  return (
    <View style={styles.screenRoot}>
      <ScrollView contentContainerStyle={[styles.screenContent, styles.screenWithFloatingActions]}>
        <Text style={[styles.eyebrow, { color: palette.textMuted }]}>МОИ ПРЕПАРАТЫ</Text>
        {snapshot.medications.length === 0 ? (
          <Surface palette={palette} style={styles.emptySurface}><Text style={styles.emptyIcon}>＋</Text><Text style={[styles.emptyTitle, { color: palette.text }]}>Список пока пуст</Text><Text style={[styles.emptyText, { color: palette.textMuted }]}>Добавьте первый препарат, затем настройте расписание.</Text></Surface>
        ) : (
          <View style={styles.cardGrid}>{snapshot.medications.map(medication => {
            const isLowStock = medication.stockUnits <= medication.minThresholdUnits;
            const packageSize = Math.max(1, medication.unitsPerPackage);
            const progress = Math.min(100, Math.round((medication.stockUnits / packageSize) * 100));

            return (
              <SwipeableCard deleteColor={palette.danger} key={medication.id} onDelete={() => Alert.alert('Удалить препарат?', 'Расписание и история этого препарата тоже будут удалены.', [{ text: 'Отмена', style: 'cancel' }, { text: 'Удалить', style: 'destructive', onPress: () => void deleteMedication(medication.id) }])} onPress={() => { setEditingMedication(medication); setMedicationFormOpen(true); }} style={styles.gridCardContainer}>
                <Surface palette={palette} style={[styles.gridCard, isLowStock ? { borderColor: palette.warning } : undefined]}>
                  <View style={styles.cardHeader}><View style={[styles.medicationGlyph, { backgroundColor: palette.primarySoft }]}><Text style={[styles.medicationGlyphText, { color: palette.primary }]}>✦</Text></View><View style={styles.cardHeaderCopy}><Text style={[styles.cardTitle, { color: palette.text }]}>{medication.name}</Text><Text style={[styles.cardMeta, { color: palette.textMuted }]}>{medication.dosage || 'Без дозировки'} · {medication.form}</Text></View></View>
                  <View style={styles.stockRow}><Text style={[styles.stockNumber, { color: palette.text }]}>{medication.stockUnits}</Text><Text style={[styles.stockUnit, { color: palette.textMuted }]}>ед. в наличии</Text><View style={[styles.stockBadge, { backgroundColor: isLowStock ? palette.warningSoft : palette.successSoft }]}><Text style={{ color: isLowStock ? palette.warning : palette.success, fontWeight: '800' }}>{isLowStock ? 'СКОРО ЗАКОНЧИТСЯ' : 'ЗАПАС ЕСТЬ'}</Text></View></View>
                  <View style={[styles.progressTrack, { backgroundColor: palette.surfaceMuted }]}><View style={[styles.progressFill, { backgroundColor: isLowStock ? palette.warning : palette.primary, width: `${progress}%` }]} /></View>
                  <View style={styles.cardActions}><ActionButton label="Принять сейчас" onPress={() => setQuickIntakeMedication(medication)} palette={palette} tone="secondary" /><ActionButton label="＋ Упаковка" onPress={() => void addPackage(medication.id)} palette={palette} /></View>
                </Surface>
              </SwipeableCard>
            );
          })}</View>
        )}
      </ScrollView>
      <View style={[styles.floatingFooter, { backgroundColor: palette.background }]}><NativePrimaryButton isDark={isDark} label="Добавить препарат" onPress={openNewMedication} tintColor={palette.primary} /></View>
      {isMedicationFormOpen ? <MedicationForm isDark={isDark} key={editingMedication?.id ?? 'new-medication'} medication={editingMedication} newId={newMedicationId} onClose={() => setMedicationFormOpen(false)} onSave={saveMedication} visible /> : null}
      <ManualIntakeSheet initialMedicationId={quickIntakeMedication?.id} isDark={isDark} key={quickIntakeMedication ? `manual-open:${quickIntakeMedication.id}` : 'manual-closed'} medications={snapshot.medications} onClose={() => setQuickIntakeMedication(null)} onSave={takeMedicationNow} visible={quickIntakeMedication !== null} />
    </View>
  );
};

const styles = StyleSheet.create({
  screenRoot: { flex: 1 },
  screenContent: { alignSelf: 'center', gap: spacing.xl, maxWidth: 1180, padding: spacing.lg, paddingBottom: 48, paddingTop: spacing.xl, width: '100%' },
  screenWithFloatingActions: { paddingBottom: 176 },
  floatingFooter: { bottom: 88, left: 0, padding: spacing.lg, position: 'absolute', right: 0 },
  eyebrow: { fontSize: 14, fontWeight: '800', letterSpacing: 2.6, marginHorizontal: spacing.sm },
  emptySurface: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyIcon: { fontSize: 28, marginBottom: spacing.md },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: spacing.sm },
  emptyText: { fontSize: 14, lineHeight: 20 },
  cardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  gridCardContainer: { flexBasis: 300, flexGrow: 1 },
  gridCard: { flexBasis: 300, flexGrow: 1, gap: spacing.lg },
  cardHeader: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.md },
  cardHeaderCopy: { flex: 1 },
  medicationGlyph: { alignItems: 'center', borderRadius: radii.md, height: 52, justifyContent: 'center', width: 52 },
  medicationGlyphText: { fontSize: 22, fontWeight: '700' },
  cardTitle: { fontSize: 17, fontWeight: '700' },
  cardMeta: { fontSize: 13, lineHeight: 19, marginTop: spacing.xs },
  stockRow: { alignItems: 'baseline', flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
  stockNumber: { fontSize: 28, fontWeight: '800' },
  stockUnit: { flex: 1, fontSize: 14, fontWeight: '600' },
  stockBadge: { borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  progressTrack: { borderRadius: radii.pill, height: 8, marginTop: spacing.md, overflow: 'hidden' },
  progressFill: { borderRadius: radii.pill, height: '100%' },
  cardActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg }
});
