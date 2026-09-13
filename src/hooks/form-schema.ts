import type { FieldErrors, FieldValues, Resolver } from 'react-hook-form';

import { decodeMedication, decodeRule } from '../domain/document-validation';
import type { MedicationInput, ScheduleRule } from '../domain/types';
import { DomainError, parseQuantity } from '../domain/validation';

export type MedicationFormValues = {
  name: string;
  dosage: string;
  form: string;
  stockUnits: string;
  unitsPerPackage: string;
  minThresholdUnits: string;
};

export type ScheduleFormValues = {
  medicationId: string;
  time: string;
  doseUnits: string;
  daysOfWeek: number[];
  startDate: string;
  endDate: string;
  comment: string;
};

export type ManualIntakeFormValues = {
  medicationId: string;
  dose: string;
};

const toFormError = <T extends FieldValues>(field: keyof T | 'root', message: string): FieldErrors<T> => (
  { [field]: { type: 'domain', message } } as FieldErrors<T>
);

const domainError = (error: unknown): { field: string; message: string } => {
  if (error instanceof DomainError) return { field: error.field ?? 'root', message: error.message };
  return { field: 'root', message: 'Проверьте данные и повторите попытку.' };
};

export const toMedicationInput = (values: MedicationFormValues, id: string): MedicationInput => ({
  id,
  name: (() => {
    const name = values.name.trim();
    if (!name) throw new DomainError('Название: заполните поле.', 'name');
    return name;
  })(),
  dosage: values.dosage.trim(),
  form: values.form.trim(),
  stockUnits: parseQuantity(values.stockUnits, 'Остаток'),
  unitsPerPackage: parseQuantity(values.unitsPerPackage, 'В упаковке', true),
  minThresholdUnits: parseQuantity(values.minThresholdUnits, 'Низкий запас')
});

export const medicationFormResolver = (
  id: string,
  existing: { isActive: boolean; createdAt: string } | null,
  now: () => Date
): Resolver<MedicationFormValues> => values => {
  try {
    const input = toMedicationInput(values, id);
    const timestamp = now().toISOString();
    decodeMedication({
      ...input,
      isActive: existing?.isActive ?? true,
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp
    });
    return { values, errors: {} };
  } catch (error) {
    const result = domainError(error);
    const field = result.field === 'name' || result.field === 'название' ? 'name' : result.field === 'дозировка' ? 'dosage' :
      result.field === 'форма' ? 'form' : result.field === 'Остаток' ? 'stockUnits' :
        result.field === 'В упаковке' ? 'unitsPerPackage' : result.field === 'Низкий запас' ? 'minThresholdUnits' : 'root';
    return { values: {}, errors: toFormError<MedicationFormValues>(field, result.message) };
  }
};

export const toScheduleRule = (values: ScheduleFormValues, id: string, isActive: boolean): ScheduleRule => ({
  id,
  medicationId: (() => {
    if (!values.medicationId) throw new DomainError('Препарат: выберите значение.', 'medicationId');
    return values.medicationId;
  })(),
  time: values.time,
  doseUnits: parseQuantity(values.doseUnits, 'Количество', true),
  daysOfWeek: (() => {
    if (!values.daysOfWeek.length) throw new DomainError('Дни недели: выберите хотя бы один день.', 'daysOfWeek');
    return values.daysOfWeek;
  })(),
  startDate: values.startDate,
  endDate: values.endDate || null,
  comment: values.comment.trim(),
  isActive
});

export const scheduleFormResolver = (id: string, isActive: boolean): Resolver<ScheduleFormValues> => values => {
  try {
    decodeRule(toScheduleRule(values, id, isActive));
    return { values, errors: {} };
  } catch (error) {
    const result = domainError(error);
    const field = result.field === 'medicationId' ? 'medicationId' : result.field === 'время' ? 'time' : result.field === 'Количество' ? 'doseUnits' :
      result.field === 'daysOfWeek' || result.field === 'дни недели' ? 'daysOfWeek' : result.field === 'начало' ? 'startDate' :
        result.field === 'окончание' || result.field === 'Окончание' ? 'endDate' : 'root';
    return { values: {}, errors: toFormError<ScheduleFormValues>(field, result.message) };
  }
};

export const manualIntakeResolver = (medicationIds: Set<string>): Resolver<ManualIntakeFormValues> => values => {
  try {
    if (!medicationIds.has(values.medicationId)) {
      throw new DomainError('Препарат: выберите значение из списка.', 'medicationId');
    }
    parseQuantity(values.dose, 'Количество', true);
    return { values, errors: {} };
  } catch (error) {
    const result = domainError(error);
    const field = result.field === 'medicationId' ? 'medicationId' : result.field === 'Количество' ? 'dose' : 'root';
    return { values: {}, errors: toFormError<ManualIntakeFormValues>(field, result.message) };
  }
};
