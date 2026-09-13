import type { PilloCommand } from './command-types';
import { decodeMedication, decodeRule } from './document-validation';
import { getLocalDateKey } from './schedule';
import { emptySnapshot, type Intake, type PilloSnapshot } from './types';
import { DomainError, toMilliunits } from './validation';

const requireMedication = (snapshot: PilloSnapshot, id: string) => {
  const medication = snapshot.medications.find(item => item.id === id);
  if (!medication) throw new DomainError('Препарат не найден. Обновите данные.');
  return medication;
};

const changeStock = (snapshot: PilloSnapshot, medicationId: string, delta: number, now: Date): PilloSnapshot => ({
  ...snapshot,
  medications: snapshot.medications.map(item => item.id !== medicationId ? item : {
    ...item, stockUnits: toMilliunits((toMilliunits(item.stockUnits) + delta) / 1000) / 1000,
    updatedAt: now.toISOString()
  })
});

const transitionIntake = (
  snapshot: PilloSnapshot, intake: Intake, status: Intake['status'], now: Date, legacyStockReturnUnits?: number
): PilloSnapshot => {
  if (intake.status === status) return snapshot;
  const medication = requireMedication(snapshot, intake.medicationId);
  const taking = status === 'TAKEN';
  let effect = 0;
  let delta = 0;
  if (intake.status === 'TAKEN') {
    if (intake.stockEffectUnits === null && legacyStockReturnUnits === undefined) {
      throw new DomainError('Для старой записи неизвестно списанное количество. Укажите возвращаемый остаток явно.', 'legacyStockReturnUnits');
    }
    const returned = intake.stockEffectUnits ?? legacyStockReturnUnits ?? 0;
    if (returned > intake.doseUnits) throw new DomainError('Возврат не может превышать дозу приёма.');
    delta = toMilliunits(returned);
  } else if (taking) {
    effect = Math.min(toMilliunits(medication.stockUnits), toMilliunits(intake.doseUnits, 'Доза', true));
    delta = -effect;
  }
  const next = changeStock(snapshot, medication.id, delta, now);
  return {
    ...next,
    intakes: intake.source === 'MANUAL' && !taking
      ? next.intakes.filter(item => item.id !== intake.id)
      : next.intakes.map(item => item.id !== intake.id ? item : {
          ...item, status, stockEffectUnits: effect / 1000,
          contextSource: intake.status === 'PENDING' ? 'RECORDED' : intake.contextSource,
          takenAt: taking ? now.toISOString() : null,
          recordedAt: status === 'PENDING' ? null : now.toISOString(),
          medicationName: intake.status === 'PENDING' ? medication.name : intake.medicationName,
          medicationDosage: intake.status === 'PENDING' ? medication.dosage : intake.medicationDosage
        })
  };
};

/** Чистое применение команды: без React, системных API и записи БД. */
export const applyCommand = (snapshot: PilloSnapshot, command: PilloCommand, now: Date): PilloSnapshot => {
  switch (command.type) {
    case 'save-medication': {
      const existing = snapshot.medications.find(item => item.id === command.input.id);
      const medication = decodeMedication({ ...command.input, isActive: existing?.isActive ?? true,
        createdAt: existing?.createdAt ?? now.toISOString(), updatedAt: now.toISOString() });
      return { ...snapshot, medications: existing
        ? snapshot.medications.map(item => item.id === medication.id ? medication : item)
        : [...snapshot.medications, medication] };
    }
    case 'delete-medication':
      return { ...snapshot,
        medications: snapshot.medications.filter(item => item.id !== command.medicationId),
        scheduleRules: snapshot.scheduleRules.filter(item => item.medicationId !== command.medicationId),
        intakes: snapshot.intakes.filter(item => item.medicationId !== command.medicationId) };
    case 'add-package': {
      const medication = requireMedication(snapshot, command.medicationId);
      return changeStock(snapshot, medication.id, toMilliunits(medication.unitsPerPackage, 'В упаковке', true), now);
    }
    case 'save-rule': {
      const rule = decodeRule(command.rule);
      if (!requireMedication(snapshot, rule.medicationId).isActive) throw new DomainError('Препарат неактивен.');
      return { ...snapshot, scheduleRules: snapshot.scheduleRules.some(item => item.id === rule.id)
        ? snapshot.scheduleRules.map(item => item.id === rule.id ? rule : item)
        : [...snapshot.scheduleRules, rule] };
    }
    case 'delete-rule':
      return { ...snapshot, scheduleRules: snapshot.scheduleRules.filter(item => item.id !== command.ruleId) };
    case 'set-intake-status': {
      if (!['PENDING', 'TAKEN', 'SKIPPED'].includes(command.status)) throw new DomainError('Неизвестный статус.');
      const intake = snapshot.intakes.find(item => item.id === command.intakeId);
      if (!intake) throw new DomainError('Приём не найден.');
      return transitionIntake(snapshot, intake, command.status, now, command.legacyStockReturnUnits);
    }
    case 'record-manual': {
      if (snapshot.intakes.some(item => item.id === command.intakeId)) return snapshot;
      const medication = requireMedication(snapshot, command.medicationId);
      if (!medication.isActive) throw new DomainError('Препарат неактивен.');
      const doseUnits = toMilliunits(command.doseUnits, 'Доза', true) / 1000;
      const intake: Intake = { id: command.intakeId, medicationId: medication.id, scheduleRuleId: null,
        doseUnits, localDate: getLocalDateKey(now),
        localTime: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
        source: 'MANUAL', status: 'PENDING', takenAt: null, recordedAt: null, stockEffectUnits: 0,
        medicationName: medication.name, medicationDosage: medication.dosage, contextSource: 'RECORDED' };
      return transitionIntake({ ...snapshot, intakes: [...snapshot.intakes, intake] }, intake, 'TAKEN', now);
    }
    case 'update-settings': {
      const settings = { ...snapshot.settings, ...command.settings };
      if (!['SYSTEM', 'LIGHT', 'DARK'].includes(settings.theme) || typeof settings.notificationsEnabled !== 'boolean') {
        throw new DomainError('Неверные настройки.');
      }
      return { ...snapshot, settings };
    }
    case 'clear-data': return { ...emptySnapshot, medications: [], scheduleRules: [], intakes: [], settings: { ...emptySnapshot.settings } };
    case 'refresh-calendar': return snapshot;
  }
};
