import type { CommandResult, PilloContextValue } from './src/application/contracts';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StatusBar as NativeStatusBar,
  StyleSheet,
  Switch,
  Text,
  useColorScheme,
  useWindowDimensions,
  View
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MedicationForm } from '@/components/medication-form';
import { HistorySheet } from '@/components/history-sheet';
import { ManualIntakeSheet } from '@/components/manual-intake-sheet';
import { LegacyStockReturnSheet } from '@/components/legacy-stock-return-sheet';
import { ScheduleForm } from '@/components/schedule-form';
import { NativeHistoryButton, NativePrimaryButton } from '@/components/native-action-button';
import { SwipeableCard } from '@/components/swipeable-card';
import { ActionButton, Surface } from '@/components/ui';
import { getLocalDateKey } from '@/domain/schedule';
import type { Intake, Medication, PilloSettings, ScheduleRule } from '@/domain/types';
import { usePilloContext } from '@/providers/pillo-provider';
import { colors, radii, spacing } from '@/theme/tokens';

export type PilloTab = 'today' | 'medications' | 'schedule' | 'settings';

const appIcon = require('./assets/icon-pillo.png') as number;

const formatDose = (value: number): string => `${value} ед.`;

export const PilloApplication = ({ activeTab }: { activeTab: PilloTab }) => {
  const colorScheme = useColorScheme();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const {
    snapshot,
    status,
    error,
    isSaving,
    retry,
    retryNotifications,
    notificationError,
    notificationStatus,
    notificationAccess,
    coverageEndsAt,
    calendarCoverage,
    addPackage,
    clearData,
    createMedicationId,
    deleteMedication,
    deleteScheduleRule,
    saveMedication,
    saveScheduleRule,
    setIntakeStatus,
    takeMedicationNow,
    updateSettings
  } = usePilloContext();
  const [newMedicationId, setNewMedicationId] = useState('');
  const [newRuleId, setNewRuleId] = useState('');
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [isMedicationFormOpen, setMedicationFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ScheduleRule | null>(null);
  const [isScheduleFormOpen, setScheduleFormOpen] = useState(false);
  const [isHistoryOpen, setHistoryOpen] = useState(false);
  const [isManualIntakeOpen, setManualIntakeOpen] = useState(false);
  const [quickIntakeMedication, setQuickIntakeMedication] = useState<Medication | null>(null);

  const theme = snapshot.settings.theme;
  const isDark = theme === 'DARK' || (theme === 'SYSTEM' && colorScheme === 'dark');
  const palette = isDark ? colors.dark : colors.light;

  if (status === 'checking') {
    return (
      <SafeAreaView style={[styles.loading, { backgroundColor: palette.background }]}>
        <ActivityIndicator color={palette.primary} size="large" />
        <Text style={[styles.loadingTitle, { color: palette.text }]}>Открываем Pillo</Text>
        <Text style={[styles.loadingText, { color: palette.textMuted }]}>Данные остаются на этом устройстве</Text>
      </SafeAreaView>
    );
  }

  if (status === 'error') {
    return (
      <SafeAreaView style={[styles.loading, { backgroundColor: palette.background }]}>
        <Text style={[styles.loadingTitle, { color: palette.text }]}>Хранилище недоступно</Text>
        <Text style={[styles.loadingText, { color: palette.textMuted }]}>{error ?? 'Не удалось открыть данные.'}</Text>
        <ActionButton label="Повторить" onPress={retry} palette={palette} />
      </SafeAreaView>
    );
  }

  const openNewMedication = () => {
    setNewMedicationId(createMedicationId());
    setEditingMedication(null);
    setMedicationFormOpen(true);
  };

  const openNewRule = () => {
    setNewRuleId(createMedicationId());
    setEditingRule(null);
    setScheduleFormOpen(true);
  };

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: palette.surface }]}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.shell}>
        <View style={styles.workspace}>
          <View style={[styles.topBar, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <View style={styles.mobileBrandRow}>
              {!isTablet ? <Image accessibilityIgnoresInvertColors source={appIcon} style={styles.mobileBrandIcon} /> : null}
              <Text style={[styles.mobileBrand, { color: palette.text }]}>Pillo</Text>
            </View>
            <View style={styles.topBarActions}>
              <View style={[styles.pendingPill, { backgroundColor: palette.primarySoft, borderColor: palette.primary }]}>
                <Text style={[styles.pendingPillText, { color: palette.primary }]}>
                  {snapshot.intakes.filter(intake => intake.localDate === getLocalDateKey(new Date()) && intake.status === 'PENDING').length} ждёт
                </Text>
              </View>
            </View>
          </View>

          {error ? <Text accessibilityRole="alert" style={{ color: palette.danger, padding: spacing.md }}>{error}</Text> : null}
          {isSaving ? <Text accessibilityLiveRegion="polite" style={{ color: palette.textMuted, padding: spacing.sm }}>Сохраняем…</Text> : null}
          {notificationError ? <Text accessibilityRole="alert" style={{ color: palette.danger, padding: spacing.md }}>{notificationError}</Text> : null}
          {activeTab === 'settings' ? <View style={{ padding: spacing.md, gap: spacing.sm }}>
            <Text style={{ color: palette.textMuted }}>Напоминания: {notificationStatus === 'ready' ? 'обновлены' : notificationStatus === 'disabled' ? 'выключены' : notificationStatus === 'syncing' ? 'обновляются' : 'требуют проверки'}.</Text>
            {snapshot.settings.notificationsEnabled ? <>
              <Text style={{ color: palette.textMuted }}>Покрытие: {notificationStatus === 'ready' && coverageEndsAt ? new Date(coverageEndsAt).toLocaleString('ru-RU') : 'не подтверждено'}. Для продления открывайте приложение.</Text>
              {notificationAccess?.exact === 'unknown' ? <Text style={{ color: palette.textMuted }}>Точное время доставки Android не подтверждено.</Text> : null}
              {notificationAccess?.authorization === 'quiet' ? <Text style={{ color: palette.textMuted }}>Система разрешает тихие уведомления.</Text> : null}
              <ActionButton label="Обновить напоминания" onPress={retryNotifications} palette={palette} />
            </> : null}
          </View> : null}
          <View style={[styles.contentFrame, { backgroundColor: palette.background }]}>
            {activeTab === 'today' ? (
              <TodayScreen
                isDark={isDark}
                isTablet={isTablet}
                onOpenHistory={() => setHistoryOpen(true)}
                onOpenMedications={() => router.navigate('/medications')}
                onOpenManualIntake={() => {
                  setQuickIntakeMedication(null);
                  setManualIntakeOpen(true);
                }}
                palette={palette}
                snapshot={snapshot}
                onStatusChange={setIntakeStatus}
              />
            ) : null}
            {activeTab === 'medications' ? (
              <MedicationsScreen
                isDark={isDark}
                medications={snapshot.medications}
                onAdd={openNewMedication}
                onAddPackage={addPackage}
                onDelete={medication =>
                  Alert.alert('Удалить препарат?', 'Расписание и история этого препарата тоже будут удалены.', [
                    { text: 'Отмена', style: 'cancel' },
                    { text: 'Удалить', style: 'destructive', onPress: () => void deleteMedication(medication.id) }
                  ])
                }
                onEdit={medication => {
                  setEditingMedication(medication);
                  setMedicationFormOpen(true);
                }}
                onTakeNow={medication => {
                  setQuickIntakeMedication(medication);
                  setManualIntakeOpen(true);
                }}
                palette={palette}
              />
            ) : null}
            {activeTab === 'schedule' ? (
              <ScheduleScreen
                isDark={isDark}
                medications={snapshot.medications}
                onAdd={openNewRule}
                onDelete={rule =>
                  Alert.alert('Удалить правило?', 'Будущие приёмы по этому правилу будут удалены.', [
                    { text: 'Отмена', style: 'cancel' },
                    { text: 'Удалить', style: 'destructive', onPress: () => void deleteScheduleRule(rule.id) }
                  ])
                }
                onEdit={rule => {
                  setEditingRule(rule);
                  setScheduleFormOpen(true);
                }}
                palette={palette}
                rules={snapshot.scheduleRules}
              />
            ) : null}
            {activeTab === 'settings' ? (
              <SettingsScreen
                isTablet={isTablet}
                onClearData={() =>
                  Alert.alert(
                    'Удалить все данные?',
                    'Препараты, расписание и история будут удалены с этого устройства без возможности восстановления.',
                    [
                      { text: 'Отмена', style: 'cancel' },
                      { text: 'Удалить всё', style: 'destructive', onPress: () => void clearData() }
                    ]
                  )
                }
                onChange={updateSettings}
                palette={palette}
                settings={snapshot.settings}
              />
            ) : null}
          </View>

        </View>
      </View>

      {isMedicationFormOpen ? (
        <MedicationForm
          isDark={isDark}
          key={editingMedication?.id ?? 'new-medication'}
          medication={editingMedication}
          newId={newMedicationId}
          onClose={() => setMedicationFormOpen(false)}
          onSave={saveMedication}
          visible
        />
      ) : null}
      {isScheduleFormOpen ? (
        <ScheduleForm
          isDark={isDark}
          key={editingRule?.id ?? 'new-rule'}
          medications={snapshot.medications}
          onClose={() => setScheduleFormOpen(false)}
          onSave={saveScheduleRule}
          rule={editingRule}
          newId={newRuleId}
          visible
        />
      ) : null}
      <ManualIntakeSheet
        initialMedicationId={quickIntakeMedication?.id}
        isDark={isDark}
        key={isManualIntakeOpen ? `manual-open:${quickIntakeMedication?.id ?? 'select'}` : 'manual-closed'}
        medications={snapshot.medications}
        onClose={() => {
          setManualIntakeOpen(false);
          setQuickIntakeMedication(null);
        }}
        onSave={takeMedicationNow}
        visible={isManualIntakeOpen}
      />
      {isHistoryOpen ? <HistorySheet
        calendarCoverage={calendarCoverage}
        intakes={snapshot.intakes}
        isDark={isDark}
        medications={snapshot.medications}
        onClose={() => setHistoryOpen(false)}
        visible={isHistoryOpen}
      /> : null}
    </SafeAreaView>
  );
};

type Palette = typeof colors.light | typeof colors.dark;

const TodayScreen = ({
  isDark,
  isTablet,
  onOpenHistory,
  onOpenManualIntake,
  onOpenMedications,
  onStatusChange,
  palette,
  snapshot
}: {
  isDark: boolean;
  isTablet: boolean;
  onOpenHistory: () => void;
  onOpenManualIntake: () => void;
  onOpenMedications: () => void;
  onStatusChange: (id: string, status: 'PENDING' | 'TAKEN' | 'SKIPPED', legacyStockReturnUnits?: number, commandId?: string) => Promise<CommandResult>;
  palette: Palette;
  snapshot: PilloContextValue['snapshot'];
}) => {
  const todayKey = getLocalDateKey(new Date());
  const medicationById = new Map(snapshot.medications.map(medication => [medication.id, medication]));
  const todayIntakes = snapshot.intakes
    .filter(intake => intake.localDate === todayKey)
    .sort((a, b) => a.localTime.localeCompare(b.localTime));
  const lowStock = snapshot.medications.filter(medication => medication.stockUnits <= medication.minThresholdUnits);
  const [legacyUndoIntake, setLegacyUndoIntake] = useState<Intake | null>(null);

  const handleStatusChange = (intake: Intake, status: Intake['status']) => {
    if (status === 'PENDING' && intake.status === 'TAKEN' && intake.stockEffectUnits === null) {
      setLegacyUndoIntake(intake);
      return;
    }

    void onStatusChange(intake.id, status);
  };

  return (
    <View style={styles.screenRoot}>
      <ScrollView contentContainerStyle={[styles.screenContent, styles.screenWithFloatingActions]}>
        <Text style={[styles.eyebrow, { color: palette.textMuted }]}>ВСЕ ПРИЁМЫ НА СЕГОДНЯ</Text>
        <View style={isTablet ? styles.tabletColumns : styles.singleColumn}>
        <View style={styles.primaryColumn}>
          {todayIntakes.length === 0 ? (
            <Surface palette={palette} style={styles.emptySurface}>
              <Text style={styles.emptyIcon}>✓</Text>
              <Text style={[styles.emptyTitle, { color: palette.text }]}>На сегодня приёмов нет</Text>
              <Text style={[styles.emptyText, { color: palette.textMuted }]}>Можно отдохнуть или отметить внеплановый приём вручную.</Text>
              <View style={styles.inlineAction}><ActionButton label="Добавить препарат" onPress={onOpenMedications} palette={palette} /></View>
            </Surface>
          ) : (
            <View style={styles.list}>
              {todayIntakes.map(intake => {
                const medication = medicationById.get(intake.medicationId);
                const isLowStock = medication ? medication.stockUnits <= medication.minThresholdUnits : false;
                const hasStockDiscrepancy = intake.status === 'PENDING' && medication
                  ? medication.stockUnits < intake.doseUnits
                  : false;
                return (
                  <Surface key={intake.id} palette={palette} style={isLowStock ? { borderColor: palette.warning } : undefined}>
                    <View style={styles.cardHeader}>
                      <View style={[styles.medicationGlyph, { backgroundColor: palette.primarySoft }]}>
                        <Text style={[styles.medicationGlyphText, { color: palette.primary }]}>✦</Text>
                      </View>
                      <View style={styles.cardHeaderCopy}>
                        <Text style={[styles.cardTitle, { color: palette.text }]}>{medication?.name ?? 'Удалённый препарат'}</Text>
                        <Text style={[styles.cardMeta, { color: palette.textMuted }]}>{intake.localTime} · {formatDose(intake.doseUnits)}{medication?.dosage ? ` · ${medication.dosage}` : ''}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: intake.status === 'TAKEN' ? palette.successSoft : intake.status === 'SKIPPED' ? palette.dangerSoft : palette.primarySoft }]}>
                        <Text style={[styles.statusText, { color: intake.status === 'TAKEN' ? palette.success : intake.status === 'SKIPPED' ? palette.danger : palette.primary }]}>
                          {intake.status === 'TAKEN' ? 'ПРИНЯТО' : intake.status === 'SKIPPED' ? 'ПРОПУЩЕНО' : 'ОЖИДАЕТ'}
                        </Text>
                      </View>
                    </View>
                    {isLowStock || hasStockDiscrepancy ? (
                      <View style={[styles.stockWarning, { backgroundColor: palette.warningSoft }]}>
                        <Text accessibilityRole={hasStockDiscrepancy ? 'alert' : undefined} style={[styles.stockWarningText, { color: palette.warning }]}>
                          {hasStockDiscrepancy
                            ? `Учётный запас меньше дозы: ${medication?.stockUnits ?? 0} из ${intake.doseUnits} ед. При отметке остаток станет 0 — проверьте фактический запас.`
                            : `Запас подходит к концу · осталось ${medication?.stockUnits ?? 0} ед.`}
                        </Text>
                      </View>
                    ) : null}
                    <View style={styles.cardActions}>
                      {intake.status === 'PENDING' ? (
                        <>
                          <ActionButton label="✓  Принял" onPress={() => handleStatusChange(intake, 'TAKEN')} palette={palette} />
                          <ActionButton label="Пропустить" onPress={() => handleStatusChange(intake, 'SKIPPED')} palette={palette} tone="secondary" />
                        </>
                      ) : (
                        <ActionButton label="Отменить отметку" onPress={() => handleStatusChange(intake, 'PENDING')} palette={palette} tone="secondary" />
                      )}
                    </View>
                  </Surface>
                );
              })}
            </View>
          )}
        </View>

        {isTablet ? (
          <View style={styles.secondaryColumn}>
            <Text style={[styles.columnTitle, { color: palette.text }]}>Требует внимания</Text>
            {lowStock.length === 0 ? <Text style={[styles.emptyText, { color: palette.textMuted }]}>Запасов достаточно.</Text> : lowStock.map(medication => (
              <Surface key={medication.id} palette={palette}>
                <Text style={[styles.cardTitle, { color: palette.text }]}>{medication.name}</Text>
                <Text style={[styles.cardMeta, { color: palette.warning }]}>Осталось {medication.stockUnits}</Text>
              </Surface>
            ))}
          </View>
        ) : null}
        </View>
      </ScrollView>
      <View style={[styles.floatingFooter, { backgroundColor: palette.background }]}>
        <View style={styles.floatingActions}>
        <View style={styles.floatingPrimary}>
          <ActionButton disabled={snapshot.medications.length === 0} fill label="✓  Отметить вручную" onPress={onOpenManualIntake} palette={palette} />
        </View>
        <NativeHistoryButton isDark={isDark} onPress={onOpenHistory} tintColor={palette.primary} />
        </View>
      </View>
      {legacyUndoIntake ? (
        <LegacyStockReturnSheet
          intake={legacyUndoIntake}
          isDark={isDark}
          medication={medicationById.get(legacyUndoIntake.medicationId)}
          onClose={() => setLegacyUndoIntake(null)}
          onConfirm={(quantity, commandId) => onStatusChange(legacyUndoIntake.id, 'PENDING', quantity, commandId)}
        />
      ) : null}
    </View>
  );
};

const MedicationsScreen = ({ isDark, medications, onAdd, onAddPackage, onDelete, onEdit, onTakeNow, palette }: { isDark: boolean; medications: Medication[]; onAdd: () => void; onAddPackage: (id: string) => Promise<CommandResult>; onDelete: (medication: Medication) => void; onEdit: (medication: Medication) => void; onTakeNow: (medication: Medication) => void; palette: Palette }) => (
  <View style={styles.screenRoot}>
    <ScrollView contentContainerStyle={[styles.screenContent, styles.screenWithFloatingActions]}>
      <Text style={[styles.eyebrow, { color: palette.textMuted }]}>МОИ ПРЕПАРАТЫ</Text>
    {medications.length === 0 ? (
      <Surface palette={palette} style={styles.emptySurface}><Text style={styles.emptyIcon}>＋</Text><Text style={[styles.emptyTitle, { color: palette.text }]}>Список пока пуст</Text><Text style={[styles.emptyText, { color: palette.textMuted }]}>Добавьте первый препарат, затем настройте расписание.</Text></Surface>
    ) : (
      <View style={styles.cardGrid}>
        {medications.map(medication => {
          const isLowStock = medication.stockUnits <= medication.minThresholdUnits;
          const packageSize = Math.max(1, medication.unitsPerPackage);
          const progress = Math.min(100, Math.round((medication.stockUnits / packageSize) * 100));

          return (
            <SwipeableCard deleteColor={palette.danger} key={medication.id} onDelete={() => onDelete(medication)} onPress={() => onEdit(medication)} style={styles.gridCardContainer}>
            <Surface palette={palette} style={[styles.gridCard, isLowStock ? { borderColor: palette.warning } : undefined]}>
              <View style={styles.cardHeader}>
                <View style={[styles.medicationGlyph, { backgroundColor: palette.primarySoft }]}>
                  <Text style={[styles.medicationGlyphText, { color: palette.primary }]}>✦</Text>
                </View>
                <View style={styles.cardHeaderCopy}><Text style={[styles.cardTitle, { color: palette.text }]}>{medication.name}</Text><Text style={[styles.cardMeta, { color: palette.textMuted }]}>{medication.dosage || 'Без дозировки'} · {medication.form}</Text></View>
              </View>
              <View style={styles.stockRow}>
                <Text style={[styles.stockNumber, { color: palette.text }]}>{medication.stockUnits}</Text>
                <Text style={[styles.stockUnit, { color: palette.textMuted }]}>ед. в наличии</Text>
                <View style={[styles.stockBadge, { backgroundColor: isLowStock ? palette.warningSoft : palette.successSoft }]}><Text style={{ color: isLowStock ? palette.warning : palette.success, fontWeight: '800' }}>{isLowStock ? 'СКОРО ЗАКОНЧИТСЯ' : 'ЗАПАС ЕСТЬ'}</Text></View>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: palette.surfaceMuted }]}>
                <View style={[styles.progressFill, { backgroundColor: isLowStock ? palette.warning : palette.primary, width: `${progress}%` }]} />
              </View>
              <View style={styles.cardActions}>
                <ActionButton label="Принять сейчас" onPress={() => onTakeNow(medication)} palette={palette} tone="secondary" />
                <ActionButton label="＋ Упаковка" onPress={() => void onAddPackage(medication.id)} palette={palette} />
              </View>
            </Surface>
            </SwipeableCard>
          );
        })}
      </View>
    )}
    </ScrollView>
    <View style={[styles.floatingFooter, { backgroundColor: palette.background }]}>
      <NativePrimaryButton isDark={isDark} label="Добавить препарат" onPress={onAdd} tintColor={palette.primary} />
    </View>
  </View>
);

const ScheduleScreen = ({ isDark, medications, onAdd, onDelete, onEdit, palette, rules }: { isDark: boolean; medications: Medication[]; onAdd: () => void; onDelete: (rule: ScheduleRule) => void; onEdit: (rule: ScheduleRule) => void; palette: Palette; rules: ScheduleRule[] }) => {
  const medicationById = new Map(medications.map(medication => [medication.id, medication]));
  return (
    <View style={styles.screenRoot}>
      <ScrollView contentContainerStyle={[styles.screenContent, styles.screenWithFloatingActions]}>
        <Text style={[styles.eyebrow, { color: palette.textMuted }]}>ПРАВИЛА ПРИЁМА</Text>
      {rules.length === 0 ? <Surface palette={palette}><Text style={[styles.emptyTitle, { color: palette.text }]}>Расписание не настроено</Text><Text style={[styles.emptyText, { color: palette.textMuted }]}>{medications.length ? 'Добавьте время и дни приёма.' : 'Сначала добавьте хотя бы один препарат.'}</Text></Surface> : (
        <View style={styles.list}>{[...rules].sort((a, b) => a.time.localeCompare(b.time)).map(rule => (
          <SwipeableCard deleteColor={palette.danger} key={rule.id} onDelete={() => onDelete(rule)} onPress={() => onEdit(rule)}>
          <Surface palette={palette}>
            <View style={styles.scheduleRow}>
              <View style={[styles.medicationGlyph, { backgroundColor: palette.primarySoft }]}><Text style={[styles.medicationGlyphText, { color: palette.primary }]}>◷</Text></View>
              <View style={styles.scheduleCopy}><Text style={[styles.cardTitle, { color: palette.text }]}>{medicationById.get(rule.medicationId)?.name ?? 'Удалённый препарат'}</Text><Text style={[styles.cardMeta, { color: palette.textMuted }]}>{rule.time} · {formatDose(rule.doseUnits)}</Text></View>
              <View style={[styles.statusBadge, { backgroundColor: rule.isActive ? palette.successSoft : palette.surfaceMuted }]}><Text style={[styles.statusText, { color: rule.isActive ? palette.success : palette.textMuted }]}>{rule.isActive ? 'АКТИВНО' : 'НЕАКТИВНО'}</Text></View>
            </View>
            <View style={styles.daysRow}>
              {[1, 2, 3, 4, 5, 6, 0].map((day, index) => {
                const selected = rule.daysOfWeek.includes(day);
                return <View key={day} style={[styles.dayBadge, { backgroundColor: selected ? palette.primarySoft : palette.surfaceMuted }]}><Text style={[styles.dayText, { color: selected ? palette.primary : palette.textMuted }]}>{['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'][index]}</Text></View>;
              })}
            </View>
          </Surface>
          </SwipeableCard>
        ))}</View>
      )}
      </ScrollView>
      <View style={[styles.floatingFooter, { backgroundColor: palette.background }]}>
        <NativePrimaryButton disabled={medications.length === 0} isDark={isDark} label="Добавить расписание" onPress={onAdd} tintColor={palette.primary} />
      </View>
    </View>
  );
};

const SettingsScreen = ({ isTablet, onChange, onClearData, palette, settings }: { isTablet: boolean; onChange: (settings: Partial<PilloSettings>) => Promise<CommandResult>; onClearData: () => void; palette: Palette; settings: PilloSettings }) => (
  <ScrollView contentContainerStyle={styles.screenContent}>
    <Text style={[styles.eyebrow, { color: palette.textMuted }]}>УВЕДОМЛЕНИЯ</Text>
    <View style={isTablet ? styles.settingsGrid : styles.list}>
      <Surface palette={palette} style={styles.gridCard}>
        <View style={styles.settingRow}>
          <View style={[styles.settingIcon, { backgroundColor: palette.success }]}><Text style={styles.settingIconText}>◯</Text></View>
          <View style={styles.settingCopy}><Text style={[styles.cardTitle, { color: palette.text }]}>Push-уведомления</Text><Text style={[styles.cardMeta, { color: palette.textMuted }]}>Системные локальные напоминания о приёмах.</Text></View>
          <Switch accessibilityLabel="Push-уведомления" ios_backgroundColor={palette.surfaceMuted} onValueChange={value => void onChange({ notificationsEnabled: value })} trackColor={{ false: palette.surfaceMuted, true: Platform.OS === 'ios' ? palette.success : palette.successSoft }} thumbColor={Platform.OS === 'android' ? (settings.notificationsEnabled ? palette.success : palette.textMuted) : undefined} value={settings.notificationsEnabled} />
        </View>
      </Surface>
      <Text style={[styles.eyebrow, { color: palette.textMuted }]}>ВНЕШНИЙ ВИД</Text>
      <Surface palette={palette} style={styles.gridCard}>
        <View style={styles.settingTitleRow}><View style={[styles.settingIcon, { backgroundColor: palette.primary }]}><Text style={styles.settingIconText}>◐</Text></View><Text style={[styles.cardTitle, { color: palette.text }]}>Тема</Text></View>
        <View accessibilityRole="radiogroup" style={styles.themeOptions}>{(['LIGHT', 'DARK', 'SYSTEM'] as const).map(theme => {
          const selected = settings.theme === theme;
          return <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected }} android_ripple={{ color: palette.primarySoft }} key={theme} onPress={() => void onChange({ theme })} style={[styles.themeOption, { backgroundColor: selected ? palette.surfaceMuted : palette.background, borderColor: selected ? palette.textMuted : palette.border }]}><Text style={[styles.themeIcon, { color: theme === 'LIGHT' ? palette.warning : theme === 'DARK' ? palette.primary : palette.textMuted }]}>{theme === 'LIGHT' ? '☀' : theme === 'DARK' ? '☾' : '▣'}</Text><Text style={{ color: palette.text, fontWeight: '700' }}>{theme === 'SYSTEM' ? 'Системная' : theme === 'LIGHT' ? 'Светлая' : 'Тёмная'}</Text></Pressable>;
        })}</View>
      </Surface>
      <Text style={[styles.eyebrow, { color: palette.textMuted }]}>О ПРИЛОЖЕНИИ</Text>
      <Surface palette={palette} style={styles.gridCard}>
        <View style={styles.settingTitleRow}><View style={[styles.settingIcon, { backgroundColor: palette.primarySoft }]}><Text style={[styles.settingIconText, { color: palette.primary }]}>✓</Text></View><View style={styles.settingCopy}><Text style={[styles.cardTitle, { color: palette.text }]}>Pillo</Text><Text style={[styles.cardMeta, { color: palette.textMuted }]}>Все данные защищены и хранятся локально на устройстве.</Text></View></View>
        <View style={styles.inlineAction}><ActionButton label="Удалить все данные" onPress={onClearData} palette={palette} tone="danger" /></View>
      </Surface>
    </View>
  </ScrollView>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, paddingTop: NativeStatusBar.currentHeight ? 0 : undefined },
  shell: { flex: 1, flexDirection: 'row' },
  loading: { alignItems: 'center', flex: 1, gap: spacing.sm, justifyContent: 'center', padding: spacing.xl },
  loadingTitle: { fontSize: 22, fontWeight: '700', marginTop: spacing.md },
  loadingText: { fontSize: 14, textAlign: 'center' },
  sidebar: { borderRightWidth: StyleSheet.hairlineWidth, padding: spacing.lg, width: 244 },
  brand: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xxl, padding: spacing.sm },
  brandIcon: { borderRadius: radii.md, height: 44, width: 44 },
  brandName: { fontSize: 20, fontWeight: '800', letterSpacing: -0.4 },
  brandCaption: { fontSize: 12, marginTop: 2 },
  sidebarFooter: { flex: 1, justifyContent: 'flex-end', padding: spacing.md },
  localOnly: { fontSize: 12, lineHeight: 18 },
  workspace: { flex: 1 },
  topBar: { alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', minHeight: 76, paddingHorizontal: spacing.lg },
  mobileBrandRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  mobileBrandIcon: { borderRadius: radii.sm, height: 36, width: 36 },
  mobileBrand: { fontSize: 24, fontWeight: '800', letterSpacing: -0.7 },
  topBarCaption: { fontSize: 12, marginTop: 2 },
  topBarActions: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  pendingPill: { borderRadius: radii.pill, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  pendingPillText: { fontSize: 13, fontWeight: '700' },
  localPill: { alignItems: 'center', borderRadius: radii.pill, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: spacing.xs, maxWidth: 132, minHeight: 40, paddingHorizontal: spacing.md },
  localPillIcon: { fontSize: 18 },
  localPillText: { flexShrink: 1, fontSize: 12, fontWeight: '600' },
  saveState: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  saveDot: { borderRadius: radii.pill, height: 7, width: 7 },
  saveText: { fontSize: 12, fontWeight: '600' },
  contentFrame: { flex: 1 },
  screenRoot: { flex: 1 },
  screenContent: { alignSelf: 'center', gap: spacing.xl, maxWidth: 1180, padding: spacing.lg, paddingBottom: 48, paddingTop: spacing.xl, width: '100%' },
  screenWithFloatingActions: { paddingBottom: 176 },
  floatingFooter: { bottom: 88, left: 0, padding: spacing.lg, position: 'absolute', right: 0 },
  eyebrow: { fontSize: 14, fontWeight: '800', letterSpacing: 2.6, marginHorizontal: spacing.sm },
  verticalNav: { gap: spacing.sm },
  verticalNavItem: { alignItems: 'center', borderRadius: radii.md, flexDirection: 'row', gap: spacing.md, minHeight: 48, paddingHorizontal: spacing.md },
  bottomNav: { borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', minHeight: 66, paddingHorizontal: spacing.xs, paddingTop: spacing.xs },
  bottomNavItem: { alignItems: 'center', borderRadius: radii.md, flex: 1, gap: 2, justifyContent: 'center', minHeight: 56 },
  navIcon: { fontSize: 20, fontWeight: '700' },
  navLabel: { fontSize: 11, fontWeight: '600' },
  pressed: { opacity: 0.65 },
  tabletColumns: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.xl },
  singleColumn: { gap: spacing.lg },
  primaryColumn: { flex: 2, gap: spacing.lg },
  secondaryColumn: { flex: 1, gap: spacing.md },
  columnTitle: { fontSize: 16, fontWeight: '700' },
  summarySurface: { alignItems: 'center', flexDirection: 'row', gap: spacing.xl, justifyContent: 'center' },
  summaryNumber: { fontSize: 32, fontWeight: '800' },
  summaryLabel: { fontSize: 12, marginTop: 2 },
  summaryDivider: { height: 44, width: StyleSheet.hairlineWidth },
  list: { gap: spacing.md },
  emptySurface: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyIcon: { fontSize: 28, marginBottom: spacing.md },
  historySection: { gap: spacing.md, marginTop: spacing.sm },
  historyRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, justifyContent: 'space-between', paddingVertical: spacing.md },
  historyCopy: { flex: 1 },
  historyTitle: { fontSize: 14, fontWeight: '700' },
  cardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  gridCardContainer: { flexBasis: 300, flexGrow: 1 },
  gridCard: { flexBasis: 300, flexGrow: 1, gap: spacing.lg },
  intakeTopline: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  intakeTime: { fontSize: 18, fontWeight: '800' },
  statusText: { fontSize: 12, fontWeight: '700' },
  cardTitle: { fontSize: 17, fontWeight: '700' },
  cardMeta: { fontSize: 13, lineHeight: 19, marginTop: spacing.xs },
  cardActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
  inlineAction: { alignSelf: 'flex-start', marginTop: spacing.lg },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: spacing.sm },
  emptyText: { fontSize: 14, lineHeight: 20 },
  cardHeader: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.md, justifyContent: 'space-between' },
  cardHeaderCopy: { flex: 1 },
  cardHeaderActions: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  medicationGlyph: { alignItems: 'center', borderRadius: radii.md, height: 52, justifyContent: 'center', width: 52 },
  medicationGlyphText: { fontSize: 22, fontWeight: '700' },
  statusBadge: { borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  stockBadge: { borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  stockRow: { alignItems: 'baseline', flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
  stockNumber: { fontSize: 28, fontWeight: '800' },
  stockUnit: { flex: 1, fontSize: 14, fontWeight: '600' },
  progressTrack: { borderRadius: radii.pill, height: 8, marginTop: spacing.md, overflow: 'hidden' },
  progressFill: { borderRadius: radii.pill, height: '100%' },
  stockWarning: { borderRadius: radii.md, marginTop: spacing.lg, padding: spacing.lg },
  stockWarningText: { fontSize: 14, fontWeight: '700', lineHeight: 20 },
  moreButton: { alignItems: 'center', borderRadius: radii.pill, height: 44, justifyContent: 'center', overflow: 'hidden', width: 44 },
  moreButtonText: { fontSize: 17, fontWeight: '800', letterSpacing: 1, marginTop: -8 },
  scheduleRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.lg },
  scheduleTime: { fontSize: 24, fontWeight: '800', width: 68 },
  scheduleCopy: { flex: 1 },
  daysRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
  dayBadge: { alignItems: 'center', borderRadius: radii.pill, height: 38, justifyContent: 'center', width: 38 },
  dayText: { fontSize: 12, fontWeight: '800' },
  scheduleMenu: { alignItems: 'center', borderRadius: radii.md, borderTopWidth: StyleSheet.hairlineWidth, marginTop: spacing.lg, minHeight: 44, paddingTop: spacing.md },
  scheduleMenuText: { fontSize: 14, fontWeight: '700' },
  floatingActions: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  floatingPrimary: { flex: 1, height: 60 },
  settingsGrid: { alignItems: 'flex-start', flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  settingRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.lg },
  settingTitleRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.lg },
  settingIcon: { alignItems: 'center', borderRadius: radii.md, height: 44, justifyContent: 'center', width: 44 },
  settingIconText: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
  settingCopy: { flex: 1 },
  themeOptions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  themeOption: { alignItems: 'center', borderRadius: radii.lg, borderWidth: StyleSheet.hairlineWidth, flex: 1, gap: spacing.sm, minHeight: 104, paddingHorizontal: spacing.sm, paddingVertical: spacing.lg },
  themeIcon: { fontSize: 26 }
});
