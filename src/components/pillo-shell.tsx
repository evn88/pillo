import type { ReactNode } from 'react';
import { ActivityIndicator, StatusBar as NativeStatusBar, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

import { usePilloContext } from '@/providers/pillo-provider';
import { useLargeTextLayout } from '@/hooks/use-large-text-layout';
import { spacing } from '@/theme/tokens';
import { usePilloTheme, type PilloPalette } from '@/theme/use-pillo-theme';
import { ActionButton } from './ui';



export type PilloScreenLayout = { isDark: boolean; isLargeText: boolean; isTablet: boolean; palette: PilloPalette };

export const PilloShell = ({ children }: { children: (layout: PilloScreenLayout) => ReactNode }) => {
  const { width } = useWindowDimensions();
  const { error, isSaving, retry, snapshot, status } = usePilloContext();
  const { isDark, palette } = usePilloTheme(snapshot.settings.theme);
  const isTablet = width >= 768;
  const isLargeText = useLargeTextLayout();

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

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safeArea, { backgroundColor: palette.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.workspace}>
        {error ? <Text accessibilityRole="alert" style={{ color: palette.danger, padding: spacing.md }}>{error}</Text> : null}
        {isSaving ? <Text accessibilityLiveRegion="polite" style={{ color: palette.textMuted, padding: spacing.sm }}>Сохраняем…</Text> : null}
        <View style={[styles.contentFrame, { backgroundColor: palette.background }]}>
          {children({ isDark, isLargeText, isTablet, palette })}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, paddingTop: NativeStatusBar.currentHeight ? 0 : undefined },
  workspace: { flex: 1 },
  loading: { alignItems: 'center', flex: 1, gap: spacing.sm, justifyContent: 'center', padding: spacing.xl },
  loadingTitle: { fontSize: 22, fontWeight: '700', marginTop: spacing.md },
  loadingText: { fontSize: 14, textAlign: 'center' },
  contentFrame: { flex: 1 }
});
