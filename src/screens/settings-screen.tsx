import { Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { ActionButton, Surface } from '@/components/ui';
import { usePilloContext } from '@/providers/pillo-provider';
import { radii, spacing } from '@/theme/tokens';
import { usePilloTheme } from '@/theme/use-pillo-theme';

export const SettingsScreen = ({ isLargeText }: { isLargeText: boolean }) => {
  const { clearData, coverageEndsAt, notificationAccess, notificationError, notificationStatus, openNotificationSettings, retryNotifications, snapshot, updateSettings } = usePilloContext();
  const { palette } = usePilloTheme(snapshot.settings.theme);

  const clearAllData = () => {
    Alert.alert(
      'Удалить все данные?',
      'Препараты, расписание и история будут удалены с этого устройства без возможности восстановления.',
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Удалить всё', style: 'destructive', onPress: () => void clearData() }
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.screenContent} contentInsetAdjustmentBehavior="automatic">
      {notificationError ? <Text accessibilityRole="alert" style={{ color: palette.danger }}>{notificationError}</Text> : null}
      <Text style={[styles.eyebrow, { color: palette.textMuted }]}>УВЕДОМЛЕНИЯ</Text>
      <View style={styles.list}>
        <Surface palette={palette}>
          <View style={[styles.settingRow, isLargeText && styles.settingRowLarge]}>
            <View style={styles.settingLeading}>
              <View style={[styles.settingIcon, { backgroundColor: palette.success }]}><Text style={styles.settingIconText}>◯</Text></View>
              <View style={styles.settingCopy}><Text style={[styles.cardTitle, { color: palette.text }]}>Push-уведомления</Text><Text style={[styles.cardMeta, { color: palette.textMuted }]}>Системные локальные напоминания о приёмах.</Text></View>
            </View>
            <Switch accessibilityLabel="Push-уведомления" ios_backgroundColor={palette.surfaceMuted} onValueChange={value => void updateSettings({ notificationsEnabled: value })} trackColor={{ false: palette.surfaceMuted, true: Platform.OS === 'ios' ? palette.success : palette.successSoft }} thumbColor={Platform.OS === 'android' ? (snapshot.settings.notificationsEnabled ? palette.success : palette.textMuted) : undefined} value={snapshot.settings.notificationsEnabled} />
          </View>
          {snapshot.settings.notificationsEnabled ? <View style={styles.statusCopy}>
            <Text style={{ color: palette.textMuted }}>Напоминания: {notificationStatus === 'ready' ? 'обновлены' : notificationStatus === 'disabled' ? 'выключены' : notificationStatus === 'syncing' ? 'обновляются' : 'требуют проверки'}.</Text>
            <Text style={{ color: palette.textMuted }}>Покрытие: {notificationStatus === 'ready' && coverageEndsAt ? new Date(coverageEndsAt).toLocaleString('ru-RU') : 'не подтверждено'}.</Text>
            {notificationAccess?.requested ? <Text style={{ color: palette.textMuted }}>Запрос разрешения отправлен системе.</Text> : null}
            {notificationAccess?.authorization === 'denied' ? <Text style={{ color: palette.danger }}>Системные уведомления запрещены{notificationAccess.canAskAgain ? '; повторите запрос' : '; откройте настройки устройства'}.</Text> : null}
            {notificationAccess?.authorization === 'quiet' ? <Text style={{ color: palette.textMuted }}>Система разрешает тихие уведомления.</Text> : null}
            {notificationAccess?.exact === 'unknown' ? <Text style={{ color: palette.textMuted }}>Точное время доставки Android не подтверждено.</Text> : null}
            {notificationAccess?.channel === 'blocked' ? <Text style={{ color: palette.danger }}>Канал напоминаний отключён в настройках Android.</Text> : null}
            <ActionButton label="Обновить напоминания" onPress={retryNotifications} palette={palette} />
            {notificationAccess?.authorization === 'denied' ? <ActionButton label="Открыть настройки уведомлений" onPress={() => void openNotificationSettings()} palette={palette} tone="secondary" /> : null}
          </View> : null}
        </Surface>
      </View>
      <Text style={[styles.eyebrow, { color: palette.textMuted }]}>ВНЕШНИЙ ВИД</Text>
      <Surface palette={palette}>
        <View style={styles.settingTitleRow}><View style={[styles.settingIcon, { backgroundColor: palette.primary }]}><Text style={styles.settingIconText}>◐</Text></View><Text style={[styles.cardTitle, { color: palette.text }]}>Тема</Text></View>
        <View accessibilityRole="radiogroup" style={[styles.themeOptions, isLargeText && styles.themeOptionsLarge]}>{(['LIGHT', 'DARK', 'SYSTEM'] as const).map(theme => {
          const selected = snapshot.settings.theme === theme;
          return <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected }} android_ripple={{ color: palette.primarySoft }} key={theme} onPress={() => void updateSettings({ theme })} style={[styles.themeOption, { backgroundColor: selected ? palette.surfaceMuted : palette.background, borderColor: selected ? palette.textMuted : palette.border }]}><Text style={[styles.themeIcon, { color: theme === 'LIGHT' ? palette.warning : theme === 'DARK' ? palette.primary : palette.textMuted }]}>{theme === 'LIGHT' ? '☀' : theme === 'DARK' ? '☾' : '▣'}</Text><Text style={{ color: palette.text, fontWeight: '700' }}>{theme === 'SYSTEM' ? 'Системная' : theme === 'LIGHT' ? 'Светлая' : 'Тёмная'}</Text></Pressable>;
        })}</View>
      </Surface>
      <Text style={[styles.eyebrow, { color: palette.textMuted }]}>О ПРИЛОЖЕНИИ</Text>
      <Surface palette={palette}>
        <View style={styles.settingTitleRow}><View style={[styles.settingIcon, { backgroundColor: palette.primarySoft }]}><Text style={[styles.settingIconText, { color: palette.primary }]}>✓</Text></View><View style={styles.settingCopy}><Text style={[styles.cardTitle, { color: palette.text }]}>Pillo</Text><Text style={[styles.cardMeta, { color: palette.textMuted }]}>Данные хранятся локально в sandbox приложения.</Text></View></View>
        <View style={styles.inlineAction}><ActionButton label="Удалить все данные" onPress={clearAllData} palette={palette} tone="danger" /></View>
      </Surface>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screenContent: { alignSelf: 'center', gap: spacing.xl, maxWidth: 1180, padding: spacing.lg, paddingBottom: spacing.xxl, paddingTop: spacing.xl, width: '100%' },
  list: { gap: spacing.md },
  eyebrow: { fontSize: 14, fontWeight: '800', letterSpacing: 2.6, marginHorizontal: spacing.sm },
  settingRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.lg },
  settingRowLarge: { alignItems: 'flex-start', flexDirection: 'column' },
  settingLeading: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: spacing.lg, width: '100%' },
  settingTitleRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.lg },
  settingIcon: { alignItems: 'center', borderRadius: radii.md, height: 44, justifyContent: 'center', width: 44 },
  settingIconText: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
  settingCopy: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: '700' },
  cardMeta: { fontSize: 13, lineHeight: 19, marginTop: spacing.xs },
  statusCopy: { gap: spacing.sm, marginTop: spacing.lg },
  themeOptions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  themeOptionsLarge: { flexDirection: 'column' },
  themeOption: { alignItems: 'center', borderRadius: radii.lg, borderWidth: StyleSheet.hairlineWidth, flex: 1, gap: spacing.sm, minHeight: 104, paddingHorizontal: spacing.sm, paddingVertical: spacing.lg },
  themeIcon: { fontSize: 26 },
  inlineAction: { alignSelf: 'flex-start', marginTop: spacing.lg }
});
