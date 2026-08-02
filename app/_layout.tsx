import { useColorScheme } from 'react-native';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { PilloProvider } from '@/providers/pillo-provider';
import { usePilloContext } from '@/providers/pillo-provider';
import { colors } from '@/theme/tokens';

const TabLayout = () => {
  const colorScheme = useColorScheme();
  const { snapshot } = usePilloContext();
  const isDark = snapshot.settings.theme === 'DARK' ||
    (snapshot.settings.theme === 'SYSTEM' && colorScheme === 'dark');
  const palette = isDark ? colors.dark : colors.light;

  return (
    <NativeTabs
      backgroundColor={palette.surface}
      blurEffect={isDark ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'}
      disableTransparentOnScrollEdge
      iconColor={{ default: palette.textMuted, selected: palette.primary }}
      labelStyle={{
        default: { color: palette.textMuted },
        selected: { color: palette.primary, fontWeight: '600' }
      }}
      shadowColor={palette.border}
      tintColor={palette.primary}
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
