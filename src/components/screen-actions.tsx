import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { usePathname } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useLargeTextLayout } from '@/hooks/use-large-text-layout';
import { usePilloContext } from '@/providers/pillo-provider';
import { usePilloTheme } from '@/theme/use-pillo-theme';

type ScreenAction = { label: string; onPress: () => void; disabled?: boolean };
type Registry = Record<string, ScreenAction[]>;
const ActionsContext = createContext<{ actions: Registry; register: (route: string, actions: ScreenAction[]) => void } | null>(null);
export const supportsTabAccessory = Platform.OS === 'ios' && Number.parseInt(String(Platform.Version), 10) >= 26;

export const ScreenActionsProvider = ({ children }: { children: ReactNode }) => {
  const [actions, setActions] = useState<Registry>({});
  const register = useMemo(() => (route: string, next: ScreenAction[]) => setActions(current => ({ ...current, [route]: next })), []);
  return <ActionsContext.Provider value={{ actions, register }}>{children}</ActionsContext.Provider>;
};

export const ScreenActions = ({ route, actions }: { route: string; actions: ScreenAction[] }) => {
  const registry = useContext(ActionsContext);
  const isLargeText = useLargeTextLayout();
  const latest = useRef(actions);
  useLayoutEffect(() => { latest.current = actions; }, [actions]);
  const signature = JSON.stringify(actions.map(({ label, disabled }) => ({ label, disabled })));
  const stableActions = useMemo<ScreenAction[]>(() => {
    const descriptors: Omit<ScreenAction, 'onPress'>[] = JSON.parse(signature);
    return descriptors.map((action, index) => ({ ...action, onPress: () => latest.current[index]?.onPress() }));
  }, [signature]);
  const register = registry?.register;
  useEffect(() => {
    register?.(route, stableActions);
    return () => register?.(route, []);
  }, [register, route, stableActions]);
  return supportsTabAccessory && !isLargeText ? null : <ActionRow actions={actions} />;
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
  const { palette } = usePilloTheme(snapshot.settings.theme);
  return <View style={[styles.row, isLargeText && { flexDirection: 'column' }] }>{actions.slice(0, compact ? 1 : 2).map((action, index) => (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled: action.disabled }} disabled={action.disabled} key={action.label} onPress={action.onPress} style={({ pressed }) => [styles.action, isLargeText && { flex: 0, alignSelf: 'stretch' }, { backgroundColor: index === 0 ? palette.brand : 'transparent', opacity: action.disabled ? 0.4 : pressed ? 0.65 : 1 }]}>
      <Text numberOfLines={compact ? 1 : undefined} style={[styles.label, { color: index === 0 ? '#343434' : palette.primary }]}>{action.label}</Text>
    </Pressable>
  ))}</View>;
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 4 },
  action: { flex: 1, minHeight: 44, borderRadius: 24, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 8 },
  label: { fontSize: 15, fontWeight: '600', textAlign: 'center' }
});
