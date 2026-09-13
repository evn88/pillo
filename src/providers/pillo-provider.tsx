import { createContext, useContext, type ReactNode } from 'react';

import { usePillo } from '@/hooks/use-pillo';

import type { PilloContextValue } from '../application/contracts';

const PilloContext = createContext<PilloContextValue | null>(null);

export const PilloProvider = ({ children }: { children: ReactNode }) => {
  const pillo = usePillo();

  return <PilloContext.Provider value={pillo}>{children}</PilloContext.Provider>;
};

export const usePilloContext = (): PilloContextValue => {
  const context = useContext(PilloContext);

  if (!context) throw new Error('usePilloContext должен использоваться внутри PilloProvider');

  return context;
};
