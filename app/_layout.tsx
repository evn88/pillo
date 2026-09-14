import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform, View } from 'react-native';
import { useEffect, useState } from 'react';
import { ScreenActionsProvider, supportsTabAccessory } from '@/components/screen-actions';

import { PilloProvider, usePilloContext } from '@/providers/pillo-provider';
import { useNotificationResponseNavigation } from '@/hooks/use-notification-response-navigation';
import { GlassTabBar } from '@/components/glass-tab-bar';
import { ManualIntakeSheet } from '@/components/manual-intake-sheet';
import { usePilloTheme } from '@/theme/use-pillo-theme';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);
SplashScreen.setOptions({ fade: true, duration: 200 });
void SystemUI.setBackgroundColorAsync('#14161D').catch(() => undefined);

const TabLayout = () => {
  useNotificationResponseNavigation();
  const [hasLayout, setHasLayout] = useState(false);
  const [isManualOpen, setManualOpen] = useState(false);
  const { snapshot, takeMedicationNow, isSaving, status } = usePilloContext();
  const { isDark, palette } = usePilloTheme(snapshot.settings.theme);
  useEffect(() => {
    if (status === 'checking' || !hasLayout) return;
    void SystemUI.setBackgroundColorAsync(palette.background).catch(() => undefined);
    const frame = requestAnimationFrame(() => SplashScreen.hide());
    return () => cancelAnimationFrame(frame);
  }, [hasLayout, palette.background, status]);
  const usesFloatingTabBar = Platform.OS === 'ios' && Number.parseInt(String(Platform.Version), 10) >= 26;
  const contentStyle = {
    backgroundColor: palette.background,
    paddingBottom: usesFloatingTabBar ? 112 : 0
  };

  return (
    <View onLayout={() => setHasLayout(true)} style={{ flex: 1, backgroundColor: status === 'checking' ? '#14161D' : palette.background }}>
    <NativeTabs
      hidden={supportsTabAccessory}
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
    {supportsTabAccessory && status === 'unlocked' ? <GlassTabBar isDark={isDark} palette={palette}
      disabled={isSaving || snapshot.medications.length === 0} onManualIntake={() => setManualOpen(true)} /> : null}
    <ManualIntakeSheet key={isManualOpen ? 'global-manual-open' : 'global-manual-closed'} isDark={isDark}
      medications={snapshot.medications} onClose={() => setManualOpen(false)} onSave={takeMedicationNow} visible={isManualOpen} />
    </View>
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
