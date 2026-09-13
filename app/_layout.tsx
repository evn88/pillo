import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { PilloProvider, usePilloContext } from '@/providers/pillo-provider';
import { useNotificationResponseNavigation } from '@/hooks/use-notification-response-navigation';
import { usePilloTheme } from '@/theme/use-pillo-theme';

const TabLayout = () => {
  useNotificationResponseNavigation();
  const { snapshot } = usePilloContext();
  const { isDark, palette } = usePilloTheme(snapshot.settings.theme);

  return (
    <NativeTabs
      backgroundColor={palette.background}
      blurEffect={isDark ? 'none' : 'systemChromeMaterialLight'}
      disableTransparentOnScrollEdge
      indicatorColor={palette.primarySoft}
      iconColor={{ default: palette.textMuted, selected: palette.primary }}
      labelStyle={{
        default: { color: palette.textMuted },
        selected: { color: palette.primary, fontWeight: '600' }
      }}
      shadowColor={isDark ? palette.background : palette.border}
      tintColor={palette.primary}
      unstable_nativeProps={{ colorScheme: isDark ? 'dark' : 'light' }}
    >
      <NativeTabs.Trigger contentStyle={{ backgroundColor: palette.background }} name="index">
        <NativeTabs.Trigger.Label>Сегодня</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md={{ default: 'home', selected: 'home_filled' }} sf={{ default: 'house', selected: 'house.fill' }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger contentStyle={{ backgroundColor: palette.background }} name="medications">
        <NativeTabs.Trigger.Label>Препараты</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="medication" sf={{ default: 'pill', selected: 'pill.fill' }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger contentStyle={{ backgroundColor: palette.background }} name="schedule">
        <NativeTabs.Trigger.Label>Расписание</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="calendar_month" sf="calendar" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger contentStyle={{ backgroundColor: palette.background }} name="settings">
        <NativeTabs.Trigger.Label>Настройки</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="settings" sf={{ default: 'gearshape', selected: 'gearshape.fill' }} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
};

const RootLayout = () => (
  <SafeAreaProvider>
    <PilloProvider>
      <TabLayout />
    </PilloProvider>
  </SafeAreaProvider>
);

export default RootLayout;
