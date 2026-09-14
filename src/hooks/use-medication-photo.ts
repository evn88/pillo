import type { CommandResult } from '@/application/contracts';
import { useEffect, useRef, useState } from 'react';
import { pickMedicationPhoto, removeMedicationPhoto } from '@/services/medication-photos';

export const useMedicationPhoto = (initial: string | null = null) => {
  const [photo, setPhoto] = useState<string | null>(initial);
  const [isPicking, setPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const draftFiles = useRef(new Set<string>());
  const savingFile = useRef<string | null>(null);
  const mounted = useRef(true);
  const busy = useRef(false);
  useEffect(() => {
    mounted.current = true;
    const files = draftFiles.current;
    return () => { mounted.current = false; files.forEach(name => { if (name !== savingFile.current) removeMedicationPhoto(name); }); files.clear(); };
  }, []);

  const choose = async (source: 'camera' | 'library') => {
    if (busy.current) return;
    busy.current = true;
    setPicking(true);
    setError(null);
    try {
      const name = await pickMedicationPhoto(source);
      if (!name) return;
      if (!mounted.current) { removeMedicationPhoto(name); return; }
      draftFiles.current.forEach(removeMedicationPhoto);
      draftFiles.current.clear();
      draftFiles.current.add(name);
      setPhoto(name);
    } catch (cause) {
      if (mounted.current) setError(cause instanceof Error ? cause.message : 'Не удалось открыть фото. Попробуйте ещё раз.');
    } finally {
      busy.current = false;
      if (mounted.current) setPicking(false);
    }
  };
  const remove = () => {
    draftFiles.current.forEach(removeMedicationPhoto);
    draftFiles.current.clear();
    setPhoto(null);
    setError(null);
  };
  const save = async (command: () => Promise<CommandResult>) => {
    savingFile.current = photo;
    let committed = false;
    try {
      const result = await command();
      if (result.ok) {
        committed = true;
        if (photo) draftFiles.current.delete(photo);
        if (initial && initial !== photo) removeMedicationPhoto(initial);
      }
      return result;
    } finally {
      savingFile.current = null;
      if (!mounted.current && !committed && photo && photo !== initial) removeMedicationPhoto(photo);
    }
  };
  return { photo, isPicking, error, choose, remove, save };
};
