import { useEffect, useState } from 'react';
import * as Crypto from 'expo-crypto';

import { getLocalDateKey, materializeIntakesForDate } from '@/domain/schedule';
import {
  emptySnapshot,
  type IntakeStatus,
  type Medication,
  type PilloSettings,
  type PilloSnapshot,
  type ScheduleRule
} from '@/domain/types';
import { rescheduleNotifications } from '@/services/notifications';
import { getVaultAvailability, openVault } from '@/storage/vault';
import type { VaultHandle } from '@/storage/vault-contract';

type AppStatus = 'checking' | 'unsupported' | 'unlocked';

/** Управляет локальным состоянием Pillo и синхронно сохраняет каждую мутацию в vault. */
export const usePillo = () => {
  const [status, setStatus] = useState<AppStatus>('checking');
  const [snapshot, setSnapshot] = useState<PilloSnapshot>(emptySnapshot);
  const [vault, setVault] = useState<VaultHandle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    void getVaultAvailability().then(availability => {
      if (availability === 'unsupported') {
        setStatus('unsupported');
        return;
      }
      void unlock();
    });
  }, []);

  const unlock = async () => {
    setError(null);
    try {
      const nextVault = await openVault();
      const storedSnapshot = await nextVault.load();
      const intakes = materializeIntakesForDate(
        storedSnapshot.scheduleRules,
        storedSnapshot.intakes,
        new Date()
      );
      const hydratedSnapshot = { ...storedSnapshot, intakes };
      await nextVault.save(hydratedSnapshot);
      setVault(nextVault);
      setSnapshot(hydratedSnapshot);
      setStatus('unlocked');
      void rescheduleNotifications(
        hydratedSnapshot.medications,
        hydratedSnapshot.scheduleRules,
        hydratedSnapshot.settings.notificationsEnabled
      ).catch(() => {
        setError('Не удалось обновить локальные напоминания. Проверьте разрешения системы.');
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось разблокировать Pillo');
    }
  };

  const commit = async (update: (current: PilloSnapshot) => PilloSnapshot) => {
    if (!vault) return;
    setError(null);
    setIsSaving(true);
    const previous = snapshot;
    const next = update(previous);
    setSnapshot(next);

    try {
      await vault.save(next);
    } catch {
      setSnapshot(previous);
      setError('Изменения не сохранены. Повторите действие.');
    } finally {
      setIsSaving(false);
    }
  };

  const saveMedication = async (
    input: Pick<
      Medication,
      'id' | 'name' | 'dosage' | 'form' | 'stockUnits' | 'unitsPerPackage' | 'minThresholdUnits'
    >
  ) => {
    const now = new Date().toISOString();
    await commit(current => {
      const existing = current.medications.find(medication => medication.id === input.id);
      const medication: Medication = {
        ...input,
        isActive: existing?.isActive ?? true,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now
      };
      return {
        ...current,
        medications: existing
          ? current.medications.map(item => (item.id === medication.id ? medication : item))
          : [...current.medications, medication]
      };
    });
  };

  const createMedicationId = (): string => Crypto.randomUUID();

  const deleteMedication = async (medicationId: string) => {
    const nextMedications = snapshot.medications.filter(item => item.id !== medicationId);
    const nextRules = snapshot.scheduleRules.filter(item => item.medicationId !== medicationId);
    await commit(current => ({
      ...current,
      medications: current.medications.filter(item => item.id !== medicationId),
      scheduleRules: current.scheduleRules.filter(item => item.medicationId !== medicationId),
      intakes: current.intakes.filter(item => item.medicationId !== medicationId)
    }));
    await rescheduleNotifications(
      nextMedications,
      nextRules,
      snapshot.settings.notificationsEnabled
    );
  };

  const addPackage = async (medicationId: string) => {
    await commit(current => ({
      ...current,
      medications: current.medications.map(medication =>
        medication.id === medicationId
          ? {
              ...medication,
              stockUnits: medication.stockUnits + medication.unitsPerPackage,
              updatedAt: new Date().toISOString()
            }
          : medication
      )
    }));
  };

  const saveScheduleRule = async (rule: Omit<ScheduleRule, 'id'> & { id?: string }) => {
    const normalizedRule: ScheduleRule = { ...rule, id: rule.id ?? Crypto.randomUUID() };
    const exists = snapshot.scheduleRules.some(item => item.id === normalizedRule.id);
    const nextRules = exists
      ? snapshot.scheduleRules.map(item =>
          item.id === normalizedRule.id ? normalizedRule : item
        )
      : [...snapshot.scheduleRules, normalizedRule];
    await commit(current => {
      return {
        ...current,
        scheduleRules: nextRules,
        intakes: materializeIntakesForDate(nextRules, current.intakes, new Date())
      };
    });
    await rescheduleNotifications(
      snapshot.medications,
      nextRules,
      snapshot.settings.notificationsEnabled
    );
  };

  const deleteScheduleRule = async (ruleId: string) => {
    const nextRules = snapshot.scheduleRules.filter(rule => rule.id !== ruleId);
    await commit(current => ({
      ...current,
      scheduleRules: current.scheduleRules.filter(rule => rule.id !== ruleId),
      intakes: current.intakes.filter(intake => intake.scheduleRuleId !== ruleId)
    }));
    await rescheduleNotifications(snapshot.medications, nextRules, snapshot.settings.notificationsEnabled);
  };

  const setIntakeStatus = async (intakeId: string, nextStatus: IntakeStatus) => {
    await commit(current => {
      const intake = current.intakes.find(item => item.id === intakeId);
      if (!intake) return current;
      const wasTaken = intake.status === 'TAKEN';
      const willBeTaken = nextStatus === 'TAKEN';
      const stockDelta = wasTaken === willBeTaken ? 0 : willBeTaken ? -intake.doseUnits : intake.doseUnits;

      return {
        ...current,
        intakes: current.intakes.map(item =>
          item.id === intakeId
            ? { ...item, status: nextStatus, takenAt: willBeTaken ? new Date().toISOString() : null }
            : item
        ),
        medications: current.medications.map(medication =>
          medication.id === intake.medicationId
            ? { ...medication, stockUnits: Math.max(0, medication.stockUnits + stockDelta) }
            : medication
        )
      };
    });
  };

  const updateSettings = async (settings: PilloSettings) => {
    await commit(current => ({ ...current, settings }));
    await rescheduleNotifications(snapshot.medications, snapshot.scheduleRules, settings.notificationsEnabled);
  };

  const takeMedicationNow = async (medicationId: string, doseUnits: number) => {
    const now = new Date();
    const localTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const intakeId = Crypto.randomUUID();
    await commit(current => ({
      ...current,
      intakes: [
        ...current.intakes,
        {
          id: intakeId,
          medicationId,
          scheduleRuleId: null,
          localDate: getLocalDateKey(now),
          localTime,
          doseUnits,
          status: 'TAKEN',
          takenAt: now.toISOString(),
          source: 'MANUAL'
        }
      ],
      medications: current.medications.map(medication =>
        medication.id === medicationId
          ? { ...medication, stockUnits: Math.max(0, medication.stockUnits - doseUnits) }
          : medication
      )
    }));
  };

  const clearData = async () => {
    await commit(() => emptySnapshot);
    await rescheduleNotifications([], [], false);
  };

  return {
    error,
    isSaving,
    snapshot,
    status,
    addPackage,
    clearData,
    createMedicationId,
    deleteMedication,
    deleteScheduleRule,
    saveMedication,
    saveScheduleRule,
    setIntakeStatus,
    takeMedicationNow,
    updateSettings
  };
};
