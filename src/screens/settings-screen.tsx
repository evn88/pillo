import { AppSymbol } from '@/components/app-symbol';
import { Alert, Platform, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { ThemePicker } from '@/components/theme-picker';
import { ActionButton, Surface } from '@/components/ui';
import { usePilloContext } from '@/providers/pillo-provider';
import { radii, spacing } from '@/theme/tokens';
import { usePilloTheme } from '@/theme/use-pillo-theme';

export const SettingsScreen = ({ isLargeText }: { isLargeText: boolean }) => {
  const { clearData, coverageEndsAt, notificationAccess, notificationError, notificationStatus, openNotificationSettings, retryNotifications, snapshot, updateSettings } = usePilloContext();
  const { palette, isDark } = usePilloTheme(snapshot.settings.theme);

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
      <Text accessibilityRole="header" maxFontSizeMultiplier={1.5} style={[styles.pageTitle, { color: palette.text }]}>Настройки</Text>
      {notificationError ? <Text accessibilityRole="alert" style={{ color: palette.danger }}>{notificationError}</Text> : null}
      <Text accessibilityRole="header" style={[styles.eyebrow, { color: palette.textMuted }]}>Уведомления</Text>
      <View style={styles.list}>
        <Surface palette={palette}>
          <View style={[styles.settingRow, isLargeText && styles.settingRowLarge]}>
            <View style={styles.settingLeading}>
              <View style={[styles.settingIcon, { backgroundColor: palette.success }]}><AppSymbol name="bell.fill" fallback="У" color={palette.surface} /></View>
              <View style={styles.settingCopy}><Text style={[styles.cardTitle, { color: palette.text }]}>Напоминания о приёме</Text><Text style={[styles.cardMeta, { color: palette.textMuted }]}>Уведомления в запланированное время.</Text></View>
            </View>
            <Switch accessibilityLabel="Напоминания о приёме" ios_backgroundColor={palette.surfaceMuted} onValueChange={value => void updateSettings({ notificationsEnabled: value })} trackColor={{ false: palette.surfaceMuted, true: Platform.OS === 'ios' ? palette.success : palette.successSoft }} thumbColor={Platform.OS === 'android' ? (snapshot.settings.notificationsEnabled ? palette.success : palette.textMuted) : undefined} value={snapshot.settings.notificationsEnabled} />
          </View>
          {snapshot.settings.notificationsEnabled ? <View style={styles.statusCopy}>
            <Text style={{ color: palette.textMuted }}>Напоминания: {notificationStatus === 'ready' ? 'обновлены' : notificationStatus === 'disabled' ? 'выключены' : notificationStatus === 'syncing' ? 'обновляются' : 'требуют проверки'}.</Text>
            <Text style={{ color: palette.textMuted }}>Напоминания запланированы до: {notificationStatus === 'ready' && coverageEndsAt ? new Date(coverageEndsAt).toLocaleString('ru-RU') : 'не подтверждено'}.</Text>
            {notificationAccess?.requested ? <Text style={{ color: palette.textMuted }}>Запрос разрешения отправлен системе.</Text> : null}
            {notificationAccess?.authorization === 'denied' ? <Text style={{ color: palette.danger }}>Системные уведомления запрещены{notificationAccess.canAskAgain ? '; повторите запрос' : '; откройте настройки устройства'}.</Text> : null}
            {notificationAccess?.authorization === 'quiet' ? <Text style={{ color: palette.textMuted }}>Система разрешает тихие уведомления.</Text> : null}
            {notificationAccess?.exact === 'unknown' ? <Text style={{ color: palette.textMuted }}>Точное время доставки Android не подтверждено.</Text> : null}
            {notificationAccess?.channel === 'blocked' ? <Text style={{ color: palette.danger }}>Канал напоминаний отключён в настройках Android.</Text> : null}
            <ActionButton tone="secondary" label="Обновить напоминания" onPress={retryNotifications} palette={palette} />
            {notificationAccess?.authorization === 'denied' ? <ActionButton label="Открыть настройки уведомлений" onPress={() => void openNotificationSettings()} palette={palette} tone="secondary" /> : null}
          </View> : null}
        </Surface>
      </View>
      <Text accessibilityRole="header" style={[styles.eyebrow, { color: palette.textMuted }]}>Оформление</Text>
      <Surface palette={palette}>
        <View style={styles.settingTitleRow}><View style={[styles.settingIcon, { backgroundColor: palette.primary }]}><AppSymbol name="circle.lefthalf.filled" fallback="Т" color={palette.surface} /></View><Text style={[styles.cardTitle, { color: palette.text }]}>Тема</Text></View>
        <ThemePicker isDark={isDark} value={snapshot.settings.theme} onChange={theme => void updateSettings({ theme })} />
      </Surface>
      <Text accessibilityRole="header" style={[styles.eyebrow, { color: palette.textMuted }]}>Данные приложения</Text>
      <Surface palette={palette}>
        <View style={styles.settingTitleRow}><View style={[styles.settingIcon, { backgroundColor: palette.primarySoft }]}><AppSymbol name="lock.shield" fallback="Д" color={palette.primary} /></View><View style={styles.settingCopy}><Text style={[styles.cardTitle, { color: palette.text }]}>Pillo</Text><Text style={[styles.cardMeta, { color: palette.textMuted }]}>Препараты и история хранятся только на этом устройстве.</Text></View></View>
        <View style={styles.inlineAction}><ActionButton label="Удалить все данные" onPress={clearAllData} palette={palette} tone="danger" /></View>
      </Surface>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  pageTitle: { fontSize: 30, fontWeight: '700', letterSpacing: -0.6 },
  screenContent: { alignSelf: 'center', gap: spacing.xl, maxWidth: 1180, padding: spacing.lg, paddingBottom: spacing.xxl, paddingTop: spacing.xl, width: '100%' },
  list: { gap: spacing.md },
  eyebrow: { fontSize: 17, fontWeight: '600', marginHorizontal: spacing.sm },
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
