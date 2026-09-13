import { AppSymbol } from '@/components/app-symbol';
import { useCallback, useState } from 'react';
import { ScreenActions } from '@/components/screen-actions';
import { Alert, FlatList, StyleSheet, Text, View, type ListRenderItem } from 'react-native';

import { ManualIntakeSheet } from '@/components/manual-intake-sheet';
import { MedicationForm } from '@/components/medication-form';
import { SwipeableCard } from '@/components/swipeable-card';
import { ActionButton, Surface } from '@/components/ui';
import type { Medication } from '@/domain/types';
import { usePilloContext } from '@/providers/pillo-provider';
import { radii, spacing } from '@/theme/tokens';
import { usePilloTheme, type PilloPalette } from '@/theme/use-pillo-theme';

type MedicationCardProps = {
  isGrid: boolean;
  isLargeText: boolean;
  medication: Medication;
  onAddPackage: (medicationId: string) => void;
  onDelete: (medicationId: string) => void;
  onEdit: (medication: Medication) => void;
  onQuickIntake: (medication: Medication) => void;
  palette: PilloPalette;
};

const MedicationCard = ({ isGrid, isLargeText, medication, onAddPackage, onDelete, onEdit, onQuickIntake, palette }: MedicationCardProps) => {
  const isLowStock = medication.stockUnits <= medication.minThresholdUnits;
  const packageSize = Math.max(1, medication.unitsPerPackage);
  const progress = Math.min(100, Math.round((medication.stockUnits / packageSize) * 100));

  return (
    <SwipeableCard
      accessibilityLabel={`Изменить препарат ${medication.name}`}
      deleteColor={palette.danger}
      footer={(
        <View style={[styles.cardActions, styles.cardFooter, isLargeText && styles.cardActionsLarge, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <ActionButton accessibilityText={`Записать приём препарата ${medication.name}`} compact fill label="Отметить" onPress={() => onQuickIntake(medication)} palette={palette} systemImage="checkmark.circle" tone="secondary" />
          <ActionButton accessibilityText={`Добавить упаковку препарата ${medication.name}`} compact fill label="Упаковка" onPress={() => onAddPackage(medication.id)} palette={palette} systemImage="shippingbox" tone="secondary" />
        </View>
      )}
      onDelete={() => onDelete(medication.id)}
      onPress={() => onEdit(medication)}
      style={[styles.gridCardContainer, { borderWidth: 1, borderColor: isLowStock ? palette.warning : palette.border }, isGrid ? styles.gridCardContainerWide : styles.gridCardContainerSingle]}
    >
      <Surface palette={palette} style={[styles.gridCard, styles.cardWithFooter, isLowStock ? { borderColor: palette.warning } : undefined]}>
        <View style={[styles.cardHeader, isLargeText && styles.cardHeaderLarge]}>
          <View style={[styles.medicationGlyph, { backgroundColor: palette.primarySoft }]}><AppSymbol name="pill.fill" fallback="Rx" color={palette.primary} /></View>
          <View style={[styles.cardHeaderCopy, isLargeText && styles.cardHeaderCopyLarge]}>
            <Text style={[styles.cardTitle, { color: palette.text }]}>{medication.name}</Text>
            <Text style={[styles.cardMeta, { color: palette.textMuted }]}>{medication.dosage || 'Без дозировки'} · {medication.form}</Text>
          </View>
          {!isLargeText ? <AppSymbol color={palette.textMuted} fallback=">" name="chevron.right" /> : null}
        </View>
        <View style={styles.stockBlock}>
          <View style={styles.stockRow}>
            <View style={styles.stockCopy}>
              <Text style={[styles.stockLabel, { color: palette.textMuted }]}>Остаток</Text>
              <Text style={[styles.stockValue, { color: palette.text }]}>{medication.stockUnits} ед.</Text>
            </View>
            <View style={[styles.stockBadge, { backgroundColor: isLowStock ? palette.warningSoft : palette.successSoft }]}>
              <Text style={[styles.stockBadgeText, { color: isLowStock ? palette.warning : palette.success }]}>{isLowStock ? 'Мало осталось' : 'В наличии'}</Text>
            </View>
          </View>
          <View accessibilityLabel={`Запас упаковки ${progress}%`} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: progress }} style={[styles.progressTrack, { backgroundColor: palette.surfaceMuted }]}>
            <View style={[styles.progressFill, { backgroundColor: isLowStock ? palette.warning : palette.primary, width: `${progress}%` }]} />
          </View>
        </View>
      </Surface>
    </SwipeableCard>
  );
};

export const MedicationsScreen = ({ isLargeText, isTablet }: { isLargeText: boolean; isTablet: boolean }) => {
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

  const editMedication = useCallback((medication: Medication) => {
    setEditingMedication(medication);
    setMedicationFormOpen(true);
  }, []);
  const deleteMedicationWithConfirmation = useCallback((medicationId: string) => {
    Alert.alert('Удалить препарат?', 'Расписание и история этого препарата тоже будут удалены.', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: () => void deleteMedication(medicationId) }
    ]);
  }, [deleteMedication]);
  const addMedicationPackage = useCallback((medicationId: string) => { void addPackage(medicationId); }, [addPackage]);
  const columnCount = isTablet && !isLargeText ? 2 : 1;
  const renderMedication = useCallback<ListRenderItem<Medication>>(({ item }) => (
    <MedicationCard
      isGrid={columnCount > 1}
      isLargeText={isLargeText}
      medication={item}
      onAddPackage={addMedicationPackage}
      onDelete={deleteMedicationWithConfirmation}
      onEdit={editMedication}
      onQuickIntake={setQuickIntakeMedication}
      palette={palette}
    />
  ), [addMedicationPackage, columnCount, deleteMedicationWithConfirmation, editMedication, isLargeText, palette]);

  return (
    <View style={styles.screenRoot}>
      <FlatList
        columnWrapperStyle={columnCount > 1 ? styles.cardGridRow : undefined}
        contentContainerStyle={styles.screenContent}
        contentInsetAdjustmentBehavior="automatic"
        data={snapshot.medications}
        key={`medications:${columnCount}`}
        keyExtractor={medication => medication.id}
        ListEmptyComponent={<Surface palette={palette} style={styles.emptySurface}><AppSymbol color={palette.primary} fallback="+" name="pill.fill" /><Text style={[styles.emptyTitle, { color: palette.text }]}>Список пока пуст</Text><Text style={[styles.emptyText, { color: palette.textMuted }]}>Добавьте первый препарат, затем настройте расписание.</Text></Surface>}
        ListFooterComponent={<ScreenActions route="/medications" actions={[{ label: 'Добавить препарат', onPress: openNewMedication }]} />}
        ListHeaderComponent={<Text accessibilityRole="header" maxFontSizeMultiplier={1.5} style={[styles.eyebrow, { color: palette.text }]}>Препараты</Text>}
        ListHeaderComponentStyle={styles.listHeader}
        numColumns={columnCount}
        renderItem={renderMedication}
      />
      {isMedicationFormOpen ? <MedicationForm isDark={isDark} key={editingMedication?.id ?? 'new-medication'} medication={editingMedication} newId={newMedicationId} onClose={() => setMedicationFormOpen(false)} onSave={saveMedication} visible /> : null}
      <ManualIntakeSheet initialMedicationId={quickIntakeMedication?.id} isDark={isDark} key={quickIntakeMedication ? `manual-open:${quickIntakeMedication.id}` : 'manual-closed'} medications={snapshot.medications} onClose={() => setQuickIntakeMedication(null)} onSave={takeMedicationNow} visible={quickIntakeMedication !== null} />
    </View>
  );
};

const styles = StyleSheet.create({
  screenRoot: { flex: 1 },
  screenContent: { alignSelf: 'center', maxWidth: 1180, padding: spacing.lg, paddingBottom: spacing.xxl * 4, paddingTop: spacing.xl, width: '100%' },
  listHeader: { marginBottom: spacing.xl },
  eyebrow: { fontSize: 30, fontWeight: '700', letterSpacing: -0.6, marginHorizontal: spacing.sm },
  emptySurface: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxl },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: spacing.sm },
  emptyText: { fontSize: 14, lineHeight: 20 },
  cardGridRow: { gap: spacing.md },
  gridCardContainer: { marginBottom: spacing.md },
  gridCardContainerSingle: { width: '100%' },
  gridCardContainerWide: { flex: 1 },
  gridCard: { flexGrow: 1, gap: spacing.md },
  cardHeader: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  cardHeaderLarge: { flexDirection: 'column' },
  cardHeaderCopy: { flex: 1 },
  cardHeaderCopyLarge: { flex: undefined, width: '100%' },
  medicationGlyph: { alignItems: 'center', borderRadius: radii.md, height: 52, justifyContent: 'center', width: 52 },
  medicationGlyphText: { fontSize: 22, fontWeight: '700' },
  cardTitle: { fontSize: 17, fontWeight: '700' },
  cardMeta: { fontSize: 13, lineHeight: 19, marginTop: spacing.xs },
  stockBlock: { gap: spacing.md, marginTop: spacing.sm },
  stockRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, justifyContent: 'space-between' },
  stockCopy: { gap: spacing.xs },
  stockLabel: { fontSize: 13, lineHeight: 18 },
  stockValue: { fontSize: 24, fontWeight: '800', letterSpacing: -0.4 },
  stockBadge: { borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  stockBadgeText: { fontSize: 13, fontWeight: '800' },
  progressTrack: { borderRadius: radii.pill, height: 6, overflow: 'hidden' },
  progressFill: { borderRadius: radii.pill, height: '100%' },
  cardWithFooter: { borderRadius: 0, borderWidth: 0 },
  cardFooter: { padding: spacing.md },
  cardActions: { flexDirection: 'row', gap: spacing.sm },
  cardActionsLarge: { flexDirection: 'column' }
});
