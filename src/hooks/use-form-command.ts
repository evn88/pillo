import { useRef, useState } from 'react';
import * as Crypto from 'expo-crypto';

import type { CommandResult } from '../application/contracts';

/** Ref блокирует повторный submit до следующего render, error сохраняет форму открытой. */
export const useFormCommand = () => {
  const pending = useRef(false);
  const attempt = useRef<{ id: string; draftKey: string } | null>(null);
  const [isPending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async (save: (commandId: string) => Promise<CommandResult>, onSuccess: () => void, draftKey: string) => {
    if (pending.current) return;
    if (attempt.current?.draftKey !== draftKey) attempt.current = { id: Crypto.randomUUID(), draftKey };
    const commandId = attempt.current.id;
    pending.current = true;
    setPending(true);
    setError(null);
    try {
      const result = await save(commandId);
      if (result.ok) { attempt.current = null; onSuccess(); }
      else setError(result.message);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось сохранить. Повторите действие.');
    } finally {
      pending.current = false;
      setPending(false);
    }
  };
  return { isPending, error, submit };
};
