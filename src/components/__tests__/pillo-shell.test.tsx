import type { ReactNode } from 'react';
import { act, create } from 'react-test-renderer';
import { Text, View } from 'react-native';
import { expect, it, vi } from 'vitest';
import { PilloShell } from '../pillo-shell';
import { SwipeActionsRow } from '../swipe-actions-row';
import { colors } from '@/theme/tokens';

const route = vi.hoisted(() => ({ focused: true, dismissKeyboard: vi.fn() }));
vi.mock('expo-router', () => ({ useIsFocused: () => route.focused }));
vi.mock('react-native', async importOriginal => ({
  ...await importOriginal<typeof import('react-native')>(),
  Keyboard: { dismiss: route.dismissKeyboard }, StatusBar: { currentHeight: 0 }
}));
vi.mock('expo-status-bar', () => ({ StatusBar: () => null }));
vi.mock('react-native-safe-area-context', () => ({ SafeAreaView: ({ children }: { children: ReactNode }) => <View>{children}</View> }));
vi.mock('@/providers/pillo-provider', () => ({ usePilloContext: () => ({ status: 'unlocked', snapshot: { settings: { theme: 'LIGHT' } } }) }));
vi.mock('@/theme/use-pillo-theme', () => ({ usePilloTheme: () => ({ isDark: false, palette: colors.light }) }));
vi.mock('../ui', () => ({ ActionButton: () => null }));
vi.mock('../app-symbol', () => ({ AppSymbol: () => null }));

it('при возврате во вкладку закрывает раскрытые действия без выполнения команды', async () => {
  const action = vi.fn();
  const render = () => <PilloShell>{() => <SwipeActionsRow label="Приём" backgroundColor="#fff" onActivate={action}
    actions={[{ id: 'dose', label: 'Доза', icon: 'slider.horizontal.3', color: '#666', onPress: action }]}><Text>Препарат</Text></SwipeActionsRow>}</PilloShell>;
  let screen: ReturnType<typeof create>;
  await act(async () => { screen = create(render()); });
  const row = screen!.root.findAll(node => Boolean(node.props.onAccessibilityAction))[0]!;
  await act(async () => { row.props.onAccessibilityAction({ nativeEvent: { actionName: 'showActions' } }); });
  expect(screen!.root.findAllByProps({ accessibilityLabel: 'Закрыть действия' }).length).toBeGreaterThan(0);
  route.focused = false;
  await act(async () => { screen!.update(render()); });
  expect(screen!.root.findAllByType(SwipeActionsRow)).toHaveLength(0);
  expect(route.dismissKeyboard).toHaveBeenCalled();
  route.focused = true;
  await act(async () => { screen!.update(render()); });
  expect(screen!.root.findAllByType(SwipeActionsRow)).toHaveLength(1);
  expect(screen!.root.findAllByProps({ accessibilityLabel: 'Закрыть действия' })).toHaveLength(0);
  expect(action).not.toHaveBeenCalled();
  await act(async () => { screen!.unmount(); });
});
