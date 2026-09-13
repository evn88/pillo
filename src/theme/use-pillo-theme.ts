import { useColorScheme } from 'react-native';

import type { PilloSettings } from '@/domain/types';
import { colors } from './tokens';

export type PilloPalette = typeof colors.light | typeof colors.dark;

export const resolvePilloTheme = (theme: PilloSettings['theme'], colorScheme: ReturnType<typeof useColorScheme>) => {
  const isDark = theme === 'DARK' || (theme === 'SYSTEM' && colorScheme === 'dark');

  return { isDark, palette: isDark ? colors.dark : colors.light } as { isDark: boolean; palette: PilloPalette };
};

export const usePilloTheme = (theme: PilloSettings['theme']) => resolvePilloTheme(theme, useColorScheme());
