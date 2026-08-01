import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { MedicationForm } from '@/components/medication-form';
import { ScheduleForm } from '@/components/schedule-form';
import { ActionButton, SectionHeading, Surface } from '@/components/ui';
import { getLocalDateKey } from '@/domain/schedule';
import type { Medication, PilloSettings, ScheduleRule } from '@/domain/types';
import { usePillo } from '@/hooks/use-pillo';
import { colors, radii, spacing } from '@/theme/tokens';

type Tab = 'today' | 'medications' | 'schedule' | 'settings';

const tabs: Array<{ id: Tab; icon: string; label: string }> = [
  { id: 'today', icon: '⌂', label: 'Сегодня' },
  { id: 'medications', icon: '✦', label: 'Препараты' },
  { id: 'schedule', icon: '◷', label: 'Расписание' },
  { id: 'settings', icon: '⚙', label: 'Настройки' }
];

const formatDose = (value: number): string => `${value} ед.`;

const PilloApplication = () => {
  const colorScheme = useColorScheme();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const {
    error,
    isSaving,
    snapshot,
    status,
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
  } = usePillo();
  const [activeTab, setActiveTab] = useState<Tab>('today');
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [isMedicationFormOpen, setMedicationFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ScheduleRule | null>(null);
  const [isScheduleFormOpen, setScheduleFormOpen] = useState(false);

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

  if (status === 'unsupported') {
    return (
      <SafeAreaView style={[styles.loading, { backgroundColor: palette.background }]}>
        <Text style={[styles.loadingTitle, { color: palette.text }]}>Хранилище недоступно</Text>
        <Text style={[styles.loadingText, { color: palette.textMuted }]}>Перезапустите приложение или обновите систему.</Text>
      </SafeAreaView>
    );
  }

  const openNewMedication = () => {
    setEditingMedication(null);
    setMedicationFormOpen(true);
  };

  const openNewRule = () => {
    setEditingRule(null);
    setScheduleFormOpen(true);
  };

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: palette.background }]}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.shell}>
        {isTablet ? (
          <View style={[styles.sidebar, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <View style={styles.brand}>
              <View style={[styles.brandIcon, { backgroundColor: palette.primary }]}>
                <Text style={[styles.brandIconText, { color: palette.surface }]}>P</Text>
              </View>
              <View>
                <Text style={[styles.brandName, { color: palette.text }]}>Pillo</Text>
                <Text style={[styles.brandCaption, { color: palette.textMuted }]}>Личный помощник</Text>
              </View>
            </View>
            <Navigation activeTab={activeTab} onChange={setActiveTab} palette={palette} vertical />
            <View style={styles.sidebarFooter}>
              <Text style={[styles.localOnly, { color: palette.textMuted }]}>Только на этом устройстве</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.workspace}>
          <View style={[styles.topBar, { borderColor: palette.border }]}>
            <View>
              <Text style={[styles.mobileBrand, { color: palette.text }]}>Pillo</Text>
              <Text style={[styles.topBarCaption, { color: palette.textMuted }]}>Сегодня всё под контролем</Text>
            </View>
            <View style={styles.saveState}>
              <View style={[styles.saveDot, { backgroundColor: error ? palette.danger : palette.success }]} />
              <Text style={[styles.saveText, { color: error ? palette.danger : palette.textMuted }]}>
                {error ? 'Не сохранено' : isSaving ? 'Сохраняем' : 'Сохранено'}
              </Text>
            </View>
          </View>

          <View style={styles.contentFrame}>
            {activeTab === 'today' ? (
              <TodayScreen
                isTablet={isTablet}
                onOpenMedications={() => setActiveTab('medications')}
                palette={palette}
                snapshot={snapshot}
                onStatusChange={setIntakeStatus}
              />
            ) : null}
            {activeTab === 'medications' ? (
              <MedicationsScreen
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
                onTakeNow={takeMedicationNow}
                palette={palette}
              />
            ) : null}
            {activeTab === 'schedule' ? (
              <ScheduleScreen
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

          {!isTablet ? (
            <SafeAreaView edges={['bottom']} style={{ backgroundColor: palette.surface }}>
              <Navigation activeTab={activeTab} onChange={setActiveTab} palette={palette} />
            </SafeAreaView>
          ) : null}
        </View>
      </View>

      {isMedicationFormOpen ? (
        <MedicationForm
          isDark={isDark}
          key={editingMedication?.id ?? 'new-medication'}
          medication={editingMedication}
          newId={createMedicationId()}
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
          visible
        />
      ) : null}
    </SafeAreaView>
  );
};

const Navigation = ({ activeTab, onChange, palette, vertical = false }: { activeTab: Tab; onChange: (tab: Tab) => void; palette: typeof colors.light | typeof colors.dark; vertical?: boolean }) => (
  <View style={vertical ? styles.verticalNav : [styles.bottomNav, { borderColor: palette.border }]}>
    {tabs.map(tab => {
      const isActive = activeTab === tab.id;
      return (
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: isActive }}
          key={tab.id}
          onPress={() => onChange(tab.id)}
          style={({ pressed }) => [
            vertical ? styles.verticalNavItem : styles.bottomNavItem,
            isActive && { backgroundColor: palette.primarySoft },
            pressed && styles.pressed
          ]}
        >
          <Text style={[styles.navIcon, { color: isActive ? palette.primary : palette.textMuted }]}>{tab.icon}</Text>
          <Text style={[styles.navLabel, { color: isActive ? palette.primary : palette.textMuted }]}>{tab.label}</Text>
        </Pressable>
      );
    })}
  </View>
);

type Palette = typeof colors.light | typeof colors.dark;

const TodayScreen = ({ isTablet, onOpenMedications, onStatusChange, palette, snapshot }: { isTablet: boolean; onOpenMedications: () => void; onStatusChange: (id: string, status: 'PENDING' | 'TAKEN' | 'SKIPPED') => Promise<void>; palette: Palette; snapshot: ReturnType<typeof usePillo>['snapshot'] }) => {
  const todayKey = getLocalDateKey(new Date());
  const medicationById = new Map(snapshot.medications.map(medication => [medication.id, medication]));
  const todayIntakes = snapshot.intakes
    .filter(intake => intake.localDate === todayKey)
    .sort((a, b) => a.localTime.localeCompare(b.localTime));
  const pendingCount = todayIntakes.filter(intake => intake.status === 'PENDING').length;
  const takenCount = todayIntakes.filter(intake => intake.status === 'TAKEN').length;
  const lowStock = snapshot.medications.filter(medication => medication.stockUnits <= medication.minThresholdUnits);
  const recentHistory = snapshot.intakes
    .filter(intake => intake.status === 'TAKEN' && intake.takenAt)
    .sort((first, second) => (second.takenAt ?? '').localeCompare(first.takenAt ?? ''))
    .slice(0, 20);

  return (
    <ScrollView contentContainerStyle={styles.screenContent}>
      <SectionHeading description="Спокойный обзор ближайших приёмов без лишних данных." palette={palette} title="Сегодня" />
      <View style={isTablet ? styles.tabletColumns : styles.singleColumn}>
        <View style={styles.primaryColumn}>
          <Surface palette={palette} style={styles.summarySurface}>
            <View>
              <Text style={[styles.summaryNumber, { color: palette.text }]}>{pendingCount}</Text>
              <Text style={[styles.summaryLabel, { color: palette.textMuted }]}>осталось принять</Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: palette.border }]} />
            <View>
              <Text style={[styles.summaryNumber, { color: palette.success }]}>{takenCount}</Text>
              <Text style={[styles.summaryLabel, { color: palette.textMuted }]}>уже принято</Text>
            </View>
          </Surface>

          {todayIntakes.length === 0 ? (
            <Surface palette={palette}>
              <Text style={[styles.emptyTitle, { color: palette.text }]}>На сегодня приёмов нет</Text>
              <Text style={[styles.emptyText, { color: palette.textMuted }]}>Добавьте препарат и настройте удобное расписание.</Text>
              <View style={styles.inlineAction}><ActionButton label="Добавить препарат" onPress={onOpenMedications} palette={palette} /></View>
            </Surface>
          ) : (
            <View style={styles.list}>
              {todayIntakes.map(intake => {
                const medication = medicationById.get(intake.medicationId);
                return (
                  <Surface key={intake.id} palette={palette}>
                    <View style={styles.intakeTopline}>
                      <Text style={[styles.intakeTime, { color: palette.primary }]}>{intake.localTime}</Text>
                      <Text style={[styles.statusText, { color: intake.status === 'TAKEN' ? palette.success : palette.textMuted }]}>
                        {intake.status === 'TAKEN' ? 'Принято' : intake.status === 'SKIPPED' ? 'Пропущено' : 'Ожидает'}
                      </Text>
                    </View>
                    <Text style={[styles.cardTitle, { color: palette.text }]}>{medication?.name ?? 'Удалённый препарат'}</Text>
                    <Text style={[styles.cardMeta, { color: palette.textMuted }]}>{formatDose(intake.doseUnits)}{medication?.dosage ? ` · ${medication.dosage}` : ''}</Text>
                    <View style={styles.cardActions}>
                      {intake.status === 'PENDING' ? (
                        <>
                          <ActionButton label="Принято" onPress={() => void onStatusChange(intake.id, 'TAKEN')} palette={palette} />
                          <ActionButton label="Пропустить" onPress={() => void onStatusChange(intake.id, 'SKIPPED')} palette={palette} tone="secondary" />
                        </>
                      ) : (
                        <ActionButton label="Отменить отметку" onPress={() => void onStatusChange(intake.id, 'PENDING')} palette={palette} tone="secondary" />
                      )}
                    </View>
                  </Surface>
                );
              })}
            </View>
          )}
          {recentHistory.length ? (
            <View style={styles.historySection}>
              <Text style={[styles.columnTitle, { color: palette.text }]}>Недавняя история</Text>
              <Surface palette={palette}>
                {recentHistory.map((intake, index) => (
                  <View
                    key={intake.id}
                    style={[
                      styles.historyRow,
                      index > 0 && { borderColor: palette.border, borderTopWidth: StyleSheet.hairlineWidth }
                    ]}
                  >
                    <View style={styles.historyCopy}>
                      <Text style={[styles.historyTitle, { color: palette.text }]}>
                        {medicationById.get(intake.medicationId)?.name ?? 'Удалённый препарат'}
                      </Text>
                      <Text style={[styles.cardMeta, { color: palette.textMuted }]}>
                        {intake.localDate} · {intake.localTime} · {formatDose(intake.doseUnits)}
                      </Text>
                    </View>
                    <Text style={[styles.statusText, { color: palette.success }]}>Принято</Text>
                  </View>
                ))}
              </Surface>
            </View>
          ) : null}
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
  );
};

const MedicationsScreen = ({ medications, onAdd, onAddPackage, onDelete, onEdit, onTakeNow, palette }: { medications: Medication[]; onAdd: () => void; onAddPackage: (id: string) => Promise<void>; onDelete: (medication: Medication) => void; onEdit: (medication: Medication) => void; onTakeNow: (id: string, dose: number) => Promise<void>; palette: Palette }) => (
  <ScrollView contentContainerStyle={styles.screenContent}>
    <SectionHeading action={<ActionButton label="Добавить" onPress={onAdd} palette={palette} />} description="Дозировки и остатки хранятся только на устройстве." palette={palette} title="Препараты" />
    {medications.length === 0 ? (
      <Surface palette={palette}><Text style={[styles.emptyTitle, { color: palette.text }]}>Список пока пуст</Text><Text style={[styles.emptyText, { color: palette.textMuted }]}>Добавьте первый препарат, затем настройте расписание.</Text></Surface>
    ) : (
      <View style={styles.cardGrid}>
        {medications.map(medication => (
          <Surface key={medication.id} palette={palette} style={styles.gridCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderCopy}><Text style={[styles.cardTitle, { color: palette.text }]}>{medication.name}</Text><Text style={[styles.cardMeta, { color: palette.textMuted }]}>{medication.dosage || medication.form}</Text></View>
              <View style={[styles.stockBadge, { backgroundColor: medication.stockUnits <= medication.minThresholdUnits ? palette.warningSoft : palette.successSoft }]}><Text style={{ color: medication.stockUnits <= medication.minThresholdUnits ? palette.warning : palette.success, fontWeight: '700' }}>{medication.stockUnits} шт.</Text></View>
            </View>
            <View style={styles.cardActions}>
              <ActionButton label="Принять сейчас" onPress={() => void onTakeNow(medication.id, 1)} palette={palette} />
              <ActionButton label="+ упаковка" onPress={() => void onAddPackage(medication.id)} palette={palette} tone="secondary" />
            </View>
            <View style={styles.textActions}>
              <Pressable onPress={() => onEdit(medication)}><Text style={[styles.textAction, { color: palette.primary }]}>Изменить</Text></Pressable>
              <Pressable onPress={() => onDelete(medication)}><Text style={[styles.textAction, { color: palette.danger }]}>Удалить</Text></Pressable>
            </View>
          </Surface>
        ))}
      </View>
    )}
  </ScrollView>
);

const ScheduleScreen = ({ medications, onAdd, onDelete, onEdit, palette, rules }: { medications: Medication[]; onAdd: () => void; onDelete: (rule: ScheduleRule) => void; onEdit: (rule: ScheduleRule) => void; palette: Palette; rules: ScheduleRule[] }) => {
  const medicationById = new Map(medications.map(medication => [medication.id, medication]));
  return (
    <ScrollView contentContainerStyle={styles.screenContent}>
      <SectionHeading action={<ActionButton disabled={medications.length === 0} label="Добавить" onPress={onAdd} palette={palette} />} description="Pillo планирует локальные уведомления на следующие 30 дней." palette={palette} title="Расписание" />
      {rules.length === 0 ? <Surface palette={palette}><Text style={[styles.emptyTitle, { color: palette.text }]}>Расписание не настроено</Text><Text style={[styles.emptyText, { color: palette.textMuted }]}>{medications.length ? 'Добавьте время и дни приёма.' : 'Сначала добавьте хотя бы один препарат.'}</Text></Surface> : (
        <View style={styles.list}>{[...rules].sort((a, b) => a.time.localeCompare(b.time)).map(rule => (
          <Surface key={rule.id} palette={palette}>
            <View style={styles.scheduleRow}>
              <Text style={[styles.scheduleTime, { color: palette.primary }]}>{rule.time}</Text>
              <View style={styles.scheduleCopy}><Text style={[styles.cardTitle, { color: palette.text }]}>{medicationById.get(rule.medicationId)?.name ?? 'Удалённый препарат'}</Text><Text style={[styles.cardMeta, { color: palette.textMuted }]}>{formatDose(rule.doseUnits)} · {rule.daysOfWeek.length === 7 ? 'каждый день' : `${rule.daysOfWeek.length} дн. в неделю`}</Text></View>
            </View>
            <View style={styles.textActions}><Pressable onPress={() => onEdit(rule)}><Text style={[styles.textAction, { color: palette.primary }]}>Изменить</Text></Pressable><Pressable onPress={() => onDelete(rule)}><Text style={[styles.textAction, { color: palette.danger }]}>Удалить</Text></Pressable></View>
          </Surface>
        ))}</View>
      )}
    </ScrollView>
  );
};

const SettingsScreen = ({ isTablet, onChange, onClearData, palette, settings }: { isTablet: boolean; onChange: (settings: PilloSettings) => Promise<void>; onClearData: () => void; palette: Palette; settings: PilloSettings }) => (
  <ScrollView contentContainerStyle={styles.screenContent}>
    <SectionHeading description="Приложение работает без аккаунта и не отправляет данные на сервер." palette={palette} title="Настройки" />
    <View style={isTablet ? styles.settingsGrid : styles.list}>
      <Surface palette={palette} style={styles.gridCard}>
        <View style={styles.settingRow}><View style={styles.settingCopy}><Text style={[styles.cardTitle, { color: palette.text }]}>Напоминания</Text><Text style={[styles.cardMeta, { color: palette.textMuted }]}>Системные локальные уведомления. На экране блокировки показывается минимум данных.</Text></View><Switch onValueChange={value => void onChange({ ...settings, notificationsEnabled: value })} trackColor={{ false: palette.surfaceMuted, true: palette.primarySoft }} thumbColor={settings.notificationsEnabled ? palette.primary : palette.textMuted} value={settings.notificationsEnabled} /></View>
      </Surface>
      <Surface palette={palette} style={styles.gridCard}>
        <Text style={[styles.cardTitle, { color: palette.text }]}>Оформление</Text>
        <View style={styles.themeOptions}>{(['SYSTEM', 'LIGHT', 'DARK'] as const).map(theme => <Pressable accessibilityRole="radio" accessibilityState={{ checked: settings.theme === theme }} key={theme} onPress={() => void onChange({ ...settings, theme })} style={[styles.themeOption, { backgroundColor: settings.theme === theme ? palette.primarySoft : palette.surfaceMuted }]}><Text style={{ color: settings.theme === theme ? palette.primary : palette.text, fontWeight: '700' }}>{theme === 'SYSTEM' ? 'Система' : theme === 'LIGHT' ? 'Светлая' : 'Тёмная'}</Text></Pressable>)}</View>
      </Surface>
      <Surface palette={palette} style={styles.gridCard}>
        <Text style={[styles.cardTitle, { color: palette.text }]}>Приватность</Text>
        <Text style={[styles.cardMeta, { color: palette.textMuted }]}>Данные находятся в sandbox приложения и защищаются настройками безопасности устройства. Удаление приложения удалит локальную базу.</Text>
        <View style={styles.inlineAction}><ActionButton label="Удалить все данные" onPress={onClearData} palette={palette} tone="danger" /></View>
      </Surface>
    </View>
  </ScrollView>
);

export default function App() {
  return <SafeAreaProvider><PilloApplication /></SafeAreaProvider>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, paddingTop: NativeStatusBar.currentHeight ? 0 : undefined },
  shell: { flex: 1, flexDirection: 'row' },
  loading: { alignItems: 'center', flex: 1, gap: spacing.sm, justifyContent: 'center', padding: spacing.xl },
  loadingTitle: { fontSize: 22, fontWeight: '700', marginTop: spacing.md },
  loadingText: { fontSize: 14, textAlign: 'center' },
  sidebar: { borderRightWidth: StyleSheet.hairlineWidth, padding: spacing.lg, width: 244 },
  brand: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xxl, padding: spacing.sm },
  brandIcon: { alignItems: 'center', borderRadius: radii.md, height: 42, justifyContent: 'center', width: 42 },
  brandIconText: { fontSize: 20, fontWeight: '800' },
  brandName: { fontSize: 20, fontWeight: '800', letterSpacing: -0.4 },
  brandCaption: { fontSize: 12, marginTop: 2 },
  sidebarFooter: { flex: 1, justifyContent: 'flex-end', padding: spacing.md },
  localOnly: { fontSize: 12, lineHeight: 18 },
  workspace: { flex: 1 },
  topBar: { alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', minHeight: 66, paddingHorizontal: spacing.xl },
  mobileBrand: { fontSize: 19, fontWeight: '800' },
  topBarCaption: { fontSize: 12, marginTop: 2 },
  saveState: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  saveDot: { borderRadius: radii.pill, height: 7, width: 7 },
  saveText: { fontSize: 12, fontWeight: '600' },
  contentFrame: { flex: 1 },
  screenContent: { alignSelf: 'center', gap: spacing.xl, maxWidth: 1180, padding: spacing.lg, paddingBottom: spacing.xxl, width: '100%' },
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
  historySection: { gap: spacing.md, marginTop: spacing.sm },
  historyRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, justifyContent: 'space-between', paddingVertical: spacing.md },
  historyCopy: { flex: 1 },
  historyTitle: { fontSize: 14, fontWeight: '700' },
  cardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
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
  stockBadge: { borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  textActions: { flexDirection: 'row', gap: spacing.xl, marginTop: spacing.lg },
  textAction: { fontSize: 14, fontWeight: '700', minHeight: 36, paddingVertical: spacing.sm },
  scheduleRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.lg },
  scheduleTime: { fontSize: 24, fontWeight: '800', width: 68 },
  scheduleCopy: { flex: 1 },
  settingsGrid: { alignItems: 'flex-start', flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  settingRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.lg },
  settingCopy: { flex: 1 },
  themeOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
  themeOption: { borderRadius: radii.pill, minHeight: 44, paddingHorizontal: spacing.lg, paddingVertical: spacing.md }
});
