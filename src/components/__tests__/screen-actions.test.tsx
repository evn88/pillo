import { act, create } from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';
import { ScreenActions, ScreenActionsProvider, TabActions } from '../screen-actions';
import { colors } from '@/theme/tokens';

const navigation = vi.hoisted(() => ({ pathname: '/', placement: 'regular' }));
vi.mock('expo-router', () => ({ usePathname: () => navigation.pathname }));
vi.mock('expo-router/unstable-native-tabs', () => ({ NativeTabs: { BottomAccessory: { usePlacement: () => navigation.placement } } }));
vi.mock('@/providers/pillo-provider', () => ({ usePilloContext: () => ({ snapshot: { settings: { theme: 'LIGHT' } } }) }));
vi.mock('@/theme/use-pillo-theme', () => ({ usePilloTheme: () => ({ palette: colors.light }) }));

describe('Контекстные действия вкладок', () => {
  it('вызывает актуальное действие после обновления экрана с той же подписью', async () => {
    const previous = vi.fn();
    const current = vi.fn();
    const render = (onPress: () => void) => <ScreenActionsProvider><ScreenActions route="/" actions={[{ label: 'Добавить', onPress }]} /><TabActions /></ScreenActionsProvider>;
    let screen: ReturnType<typeof create>;
    await act(async () => { screen = create(render(previous)); });
    await act(async () => { screen!.update(render(current)); });
    await act(async () => { screen!.root.findByType(TabActions).findAllByProps({ accessibilityRole: 'button' })[0]?.props.onPress(); });
    expect(current).toHaveBeenCalledOnce();
    expect(previous).not.toHaveBeenCalled();
    await act(async () => { screen!.unmount(); });
  });

  it('показывает только действия текущего маршрута и убирает их при закрытии экрана', async () => {
    const render = (mounted: boolean) => <ScreenActionsProvider>{mounted ? <ScreenActions route="/" actions={[{ label: 'Отметить', onPress: vi.fn() }]} /> : null}<ScreenActions route="/medications" actions={[{ label: 'Добавить препарат', onPress: vi.fn(), disabled: true }]} /><TabActions /></ScreenActionsProvider>;
    navigation.pathname = '/medications';
    let screen: ReturnType<typeof create>;
    await act(async () => { screen = create(render(true)); });
    const action = screen!.root.findByType(TabActions).findAllByProps({ accessibilityRole: 'button' })[0];
    expect(action?.props.disabled).toBe(true);
    navigation.pathname = '/';
    await act(async () => { screen!.update(render(false)); });
    expect(screen!.root.findByType(TabActions).findAllByProps({ accessibilityRole: 'button' })).toHaveLength(0);
    await act(async () => { screen!.unmount(); });
  });
});
