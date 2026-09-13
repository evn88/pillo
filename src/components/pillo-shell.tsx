import type { ReactNode } from 'react';
import { ActivityIndicator, Image, StatusBar as NativeStatusBar, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

import { usePilloContext } from '@/providers/pillo-provider';
import { getLocalDateKey } from '@/domain/schedule';
import { radii, spacing } from '@/theme/tokens';
import { usePilloTheme, type PilloPalette } from '@/theme/use-pillo-theme';
import { ActionButton } from './ui';

const appIcon = require('../../assets/icon-pillo.png') as number;

export type PilloScreenLayout = { isDark: boolean; isLargeText: boolean; isTablet: boolean; palette: PilloPalette };

export const PilloShell = ({ children }: { children: (layout: PilloScreenLayout) => ReactNode }) => {
  const { fontScale, width } = useWindowDimensions();
  const { error, isSaving, retry, snapshot, status } = usePilloContext();
  const { isDark, palette } = usePilloTheme(snapshot.settings.theme);
  const isTablet = width >= 768;
  const isLargeText = fontScale >= 1.4;

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
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safeArea, { backgroundColor: palette.surface }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.workspace}>
        <View style={[styles.topBar, isLargeText && styles.topBarLarge, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <View style={styles.brandRow}>
            {!isTablet ? <Image accessibilityIgnoresInvertColors source={appIcon} style={styles.brandIcon} /> : null}
            <Text style={[styles.brand, { color: palette.text }]}>Pillo</Text>
          </View>
          <View style={[styles.pendingPill, isLargeText && styles.pendingPillLarge, { backgroundColor: palette.primarySoft, borderColor: palette.primary }]}>
            <Text style={[styles.pendingPillText, { color: palette.primary }]}>
              {snapshot.intakes.filter(intake => intake.localDate === getLocalDateKey(new Date()) && intake.status === 'PENDING').length} ждёт
            </Text>
          </View>
        </View>
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
  topBar: { alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', minHeight: 76, paddingHorizontal: spacing.lg },
  topBarLarge: { alignItems: 'flex-start', flexDirection: 'column', gap: spacing.sm, justifyContent: 'center', paddingVertical: spacing.md },
  brandRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  brandIcon: { borderRadius: radii.sm, height: 36, width: 36 },
  brand: { fontSize: 24, fontWeight: '800', letterSpacing: -0.7 },
  pendingPill: { borderRadius: radii.pill, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  pendingPillLarge: { alignSelf: 'flex-start' },
  pendingPillText: { fontSize: 13, fontWeight: '700' },
  contentFrame: { flex: 1 }
});
