import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { usePathname } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useLargeTextLayout } from '@/hooks/use-large-text-layout';
import { usePilloContext } from '@/providers/pillo-provider';
import { usePilloTheme } from '@/theme/use-pillo-theme';
import { IntakeAction, type IntakeMenuItem } from '@/components/intake-action';

type ScreenAction = { label: string; onPress: () => void; disabled?: boolean; detail?: string; onDetails?: () => void; menuItems?: IntakeMenuItem[] };
type Registry = Record<string, ScreenAction[]>;
const ActionsContext = createContext<{ actions: Registry; register: (route: string, actions: ScreenAction[]) => void } | null>(null);
export const supportsTabAccessory = Platform.OS === 'ios' && Number.parseInt(String(Platform.Version), 10) >= 26;
export const useScreenPrimaryAction = () => {
  const pathname = usePathname();
  return useContext(ActionsContext)?.actions[pathname]?.[0];
};

export const ScreenActionsProvider = ({ children }: { children: ReactNode }) => {
  const [actions, setActions] = useState<Registry>({});
  const register = useMemo(() => (route: string, next: ScreenAction[]) => setActions(current => ({ ...current, [route]: next })), []);
  return <ActionsContext.Provider value={{ actions, register }}>{children}</ActionsContext.Provider>;
};

export const ScreenActions = ({ route, actions, inlineFallback = true }: { route: string; actions: ScreenAction[]; inlineFallback?: boolean }) => {
  const registry = useContext(ActionsContext);
  const latest = useRef(actions);
  useLayoutEffect(() => { latest.current = actions; }, [actions]);
  const signature = JSON.stringify(actions.map(({ label, disabled, detail, menuItems, onDetails }) => ({ label, disabled, detail, hasDetails: Boolean(onDetails), menuLabels: menuItems?.map(item => item.label) })));
  const stableActions = useMemo<ScreenAction[]>(() => {
    const descriptors: (Pick<ScreenAction, 'label' | 'disabled' | 'detail'> & { hasDetails: boolean; menuLabels?: string[] })[] = JSON.parse(signature);
    return descriptors.map(({ hasDetails, menuLabels, ...action }, index) => ({ ...action,
      onPress: () => latest.current[index]?.onPress(),
      onDetails: hasDetails ? () => latest.current[index]?.onDetails?.() : undefined,
      menuItems: menuLabels?.map((label, itemIndex) => ({ label, onPress: () => latest.current[index]?.menuItems?.[itemIndex]?.onPress() }))
    }));
  }, [signature]);
  const register = registry?.register;
  useEffect(() => {
    register?.(route, stableActions);
    return () => register?.(route, []);
  }, [register, route, stableActions]);
  return supportsTabAccessory || !inlineFallback ? null : <ActionRow actions={actions} />;
};

export const TabActions = () => {
  const pathname = usePathname();
  const registry = useContext(ActionsContext);
  const placement = NativeTabs.BottomAccessory.usePlacement();
  return <ActionRow actions={registry?.actions[pathname] ?? []} compact={placement === 'inline'} />;
};

const ActionRow = ({ actions, compact = false }: { actions: ScreenAction[]; compact?: boolean }) => {
  const isLargeText = useLargeTextLayout();
  const { snapshot } = usePilloContext();
  const { isDark, palette } = usePilloTheme(snapshot.settings.theme);
  const intakeAction = actions.find(action => action.menuItems);
  if (intakeAction) return <View style={[styles.row, styles.intakeRow]}>
    <Pressable accessibilityRole="button" accessibilityLabel={`${intakeAction.label}. Настроить дозу`}
      onPress={intakeAction.onDetails} disabled={intakeAction.disabled} style={styles.context}>
      <Text numberOfLines={isLargeText ? undefined : 1} style={[styles.contextTitle, { color: palette.text }]}>{intakeAction.label}</Text>
      {!compact && intakeAction.detail ? <Text numberOfLines={isLargeText ? undefined : 1} style={{ color: palette.textMuted, fontSize: 12 }}>{intakeAction.detail}</Text> : null}
    </Pressable>
    <IntakeAction accessibilityText={`Принять: ${intakeAction.label}`} disabled={intakeAction.disabled} isDark={isDark}
      items={intakeAction.menuItems ?? []} onPress={intakeAction.onPress} tintColor={palette.primary} />
  </View>;
  return <View style={[styles.row, isLargeText && { flexDirection: 'column' }] }>{actions.slice(0, compact ? 1 : 2).map((action, index) => (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled: action.disabled }} disabled={action.disabled} key={action.label} onPress={action.onPress} style={({ pressed }) => [styles.action, isLargeText && { flex: 0, alignSelf: 'stretch' }, { backgroundColor: index === 0 ? palette.brand : 'transparent', opacity: action.disabled ? 0.4 : pressed ? 0.65 : 1 }]}>
      <Text numberOfLines={compact ? 1 : undefined} style={[styles.label, { color: index === 0 ? '#343434' : palette.primary }]}>{action.label}</Text>
    </Pressable>
  ))}</View>;
};

const styles = StyleSheet.create({
  intakeRow: { paddingVertical: 0 },
  context: { flex: 1, minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 },
  contextTitle: { fontSize: 15, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 4 },
  action: { flex: 1, minHeight: 44, borderRadius: 24, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 8 },
  label: { fontSize: 15, fontWeight: '600', textAlign: 'center' }
});
