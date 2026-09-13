import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import { usePathname } from 'expo-router';
import { ScreenActionsProvider, TabActions, supportsTabAccessory } from '@/components/screen-actions';

import { PilloProvider, usePilloContext } from '@/providers/pillo-provider';
import { useNotificationResponseNavigation } from '@/hooks/use-notification-response-navigation';
import { useLargeTextLayout } from '@/hooks/use-large-text-layout';
import { spacing } from '@/theme/tokens';
import { usePilloTheme } from '@/theme/use-pillo-theme';

const TabLayout = () => {
  useNotificationResponseNavigation();
  const pathname = usePathname();
  const isLargeText = useLargeTextLayout();
  const { snapshot } = usePilloContext();
  const { isDark, palette } = usePilloTheme(snapshot.settings.theme);
  const usesFloatingTabBar = Platform.OS === 'ios' && Number.parseInt(String(Platform.Version), 10) >= 26;
  const contentStyle = {
    backgroundColor: palette.background,
    paddingBottom: usesFloatingTabBar ? spacing.xxl * 2 : 0
  };

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
      minimizeBehavior="onScrollDown"
      shadowColor={isDark ? palette.background : palette.border}
      tintColor={palette.primary}
      unstable_nativeProps={{ colorScheme: isDark ? 'dark' : 'light' }}
    >
      {supportsTabAccessory && !isLargeText && pathname !== "/settings" ? <NativeTabs.BottomAccessory><TabActions /></NativeTabs.BottomAccessory> : null}
      <NativeTabs.Trigger contentStyle={contentStyle} name="index">
        <NativeTabs.Trigger.Label>Сегодня</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md={{ default: 'home', selected: 'home_filled' }} sf={{ default: 'house', selected: 'house.fill' }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger contentStyle={contentStyle} name="medications">
        <NativeTabs.Trigger.Label>Препараты</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="medication" sf={{ default: 'pill', selected: 'pill.fill' }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger contentStyle={contentStyle} name="schedule">
        <NativeTabs.Trigger.Label>Расписание</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="calendar_month" sf="calendar" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger contentStyle={contentStyle} name="settings">
        <NativeTabs.Trigger.Label>Настройки</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="settings" sf={{ default: 'gearshape', selected: 'gearshape.fill' }} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
};

const RootLayout = () => (
  <SafeAreaProvider>
    <PilloProvider>
      <ScreenActionsProvider><TabLayout /></ScreenActionsProvider>
    </PilloProvider>
  </SafeAreaProvider>
);

export default RootLayout;
