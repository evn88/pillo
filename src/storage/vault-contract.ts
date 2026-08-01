import type { PilloSnapshot } from '@/domain/types';

export interface VaultHandle {
  load: () => Promise<PilloSnapshot>;
  save: (snapshot: PilloSnapshot) => Promise<void>;
  close: () => Promise<void>;
}

export type VaultAvailability = 'ready' | 'unsupported';
