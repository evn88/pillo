import { AppSymbol } from '@/components/app-symbol';
import { Platform, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { ThemePicker } from '@/components/theme-picker';
import { ActionButton, Surface } from '@/components/ui';
import { usePilloContext } from '@/providers/pillo-provider';
import { openProjectContact } from '@/services/project-contact';
import { radii, spacing } from '@/theme/tokens';
import { usePilloTheme } from '@/theme/use-pillo-theme';

export const SettingsScreen = ({ isLargeText }: { isLargeText: boolean }) => {
  const { coverageEndsAt, notificationAccess, notificationError, notificationStatus, openNotificationSettings, retryNotifications, snapshot, updateSettings } = usePilloContext();
  const { palette, isDark } = usePilloTheme(snapshot.settings.theme);
  const notificationStatusCopy = notificationStatus === 'ready'
    ? 'Системные напоминания включены.'
    : notificationStatus === 'syncing' || notificationStatus === 'checking'
      ? 'Проверяем системные напоминания…'
      : notificationStatus === 'blocked'
        ? 'Система не разрешает доставлять напоминания.'
        : 'Не удалось обновить системные напоминания.';
  const canRequestPermission = notificationStatus === 'blocked' && notificationAccess?.authorization === 'denied' && notificationAccess.canAskAgain && notificationAccess.channel !== 'blocked';
  const needsSystemSettings = notificationStatus === 'blocked' && (notificationAccess?.channel === 'blocked' || notificationAccess?.authorization === 'denied' && !notificationAccess.canAskAgain);

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
            <Text style={{ color: notificationStatus === 'blocked' || notificationStatus === 'error' ? palette.danger : palette.textMuted }}>{notificationStatusCopy}</Text>
            {notificationStatus === 'ready' && coverageEndsAt ? <Text style={{ color: palette.textMuted }}>Напоминания подготовлены до {new Date(coverageEndsAt).toLocaleString('ru-RU')}.</Text> : null}
            {notificationAccess?.authorization === 'quiet' ? <Text style={{ color: palette.textMuted }}>Уведомления будут приходить без звука.</Text> : null}
            {notificationAccess?.exact === 'unknown' ? <Text style={{ color: palette.textMuted }}>На Android время доставки может немного отличаться из-за ограничений системы.</Text> : null}
            {notificationStatus === 'error' ? <ActionButton tone="secondary" label="Повторить обновление" onPress={retryNotifications} palette={palette} /> : null}
            {canRequestPermission ? <ActionButton tone="secondary" label="Разрешить уведомления" onPress={retryNotifications} palette={palette} /> : null}
            {needsSystemSettings ? <ActionButton label="Открыть настройки уведомлений" onPress={() => void openNotificationSettings()} palette={palette} tone="secondary" /> : null}
          </View> : null}
        </Surface>
      </View>
      <Text accessibilityRole="header" style={[styles.eyebrow, { color: palette.textMuted }]}>Оформление</Text>
      <Surface palette={palette}>
        <View style={styles.settingTitleRow}><View style={[styles.settingIcon, { backgroundColor: palette.primary }]}><AppSymbol name="circle.lefthalf.filled" fallback="Т" color={palette.surface} /></View><Text style={[styles.cardTitle, { color: palette.text }]}>Тема</Text></View>
        <ThemePicker isDark={isDark} value={snapshot.settings.theme} onChange={theme => void updateSettings({ theme })} />
      </Surface>
      <Text accessibilityRole="header" style={[styles.eyebrow, { color: palette.textMuted }]}>Поддержка проекта</Text>
      <Surface palette={palette}>
        <View style={styles.settingInfoRow}><View style={[styles.settingIcon, { backgroundColor: palette.primarySoft }]}><AppSymbol name="heart.fill" fallback="♡" color={palette.primary} /></View><View style={styles.settingCopy}><Text style={[styles.cardTitle, { color: palette.text }]}>Помочь PillDan расти</Text><Text style={[styles.cardMeta, { color: palette.textMuted }]}>Если PillDan вам полезен, вы сможете поддержать проект любой небольшой суммой. Это поможет мне развивать приложение и создавать новые полезные проекты.</Text><Text style={[styles.cardMeta, { color: palette.textMuted }]}>Возможность поддержки появится позже. Спасибо, что вы с PillDan!</Text></View></View>
      </Surface>
      <Text accessibilityRole="header" style={[styles.eyebrow, { color: palette.textMuted }]}>Обратная связь</Text>
      <Surface palette={palette}>
        <View style={styles.settingInfoRow}><View style={[styles.settingIcon, { backgroundColor: palette.primarySoft }]}><AppSymbol name="envelope.fill" fallback="@" color={palette.primary} /></View><View style={styles.settingCopy}><Text style={[styles.cardTitle, { color: palette.text }]}>Связаться с автором</Text><Text style={[styles.cardMeta, { color: palette.textMuted }]}>Есть вопрос, идея или предложение? Буду рад вашим письмам.</Text></View></View>
        <View style={styles.inlineAction}><ActionButton label="Написать автору" onPress={() => void openProjectContact()} palette={palette} tone="secondary" /></View>
      </Surface>
      <Text accessibilityRole="header" style={[styles.eyebrow, { color: palette.textMuted }]}>Данные приложения</Text>
      <Surface palette={palette}>
        <View style={styles.settingInfoRow}><View style={[styles.settingIcon, { backgroundColor: palette.primarySoft }]}><AppSymbol name="lock.shield" fallback="Д" color={palette.primary} /></View><View style={styles.settingCopy}><Text style={[styles.cardTitle, { color: palette.text }]}>PillDan</Text><Text style={[styles.cardMeta, { color: palette.textMuted }]}>Препараты и история хранятся только на этом устройстве.</Text></View></View>
      </Surface>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  pageTitle: { fontSize: 30, fontWeight: '700', letterSpacing: -0.6 },
  screenContent: { alignSelf: 'center', gap: spacing.xl, maxWidth: 1180, padding: spacing.lg, paddingBottom: spacing.xxl * 4, paddingTop: spacing.xl, width: '100%' },
  list: { gap: spacing.md },
  eyebrow: { fontSize: 17, fontWeight: '600', marginHorizontal: spacing.sm },
  settingRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.lg },
  settingRowLarge: { alignItems: 'flex-start', flexDirection: 'column' },
  settingLeading: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: spacing.lg, width: '100%' },
  settingTitleRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.lg },
  settingInfoRow: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.lg },
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
