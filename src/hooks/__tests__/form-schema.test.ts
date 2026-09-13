import { describe, expect, it } from 'vitest';
import type { FieldValues, ResolverOptions } from 'react-hook-form';

import {
  manualIntakeResolver,
  medicationFormResolver,
  scheduleFormResolver,
  type MedicationFormValues,
  type ScheduleFormValues
} from '../form-schema';

const medicationValues: MedicationFormValues = {
  name: 'Витамин D',
  dosage: '1000 МЕ',
  form: 'капсула',
  stockUnits: '30',
  unitsPerPackage: '30',
  minThresholdUnits: '5'
};

const scheduleValues: ScheduleFormValues = {
  medicationId: 'm1',
  time: '09:00',
  doseUnits: '0,5',
  daysOfWeek: [1, 3],
  startDate: '2026-09-13',
  endDate: '',
  comment: ''
};

const resolverOptions = <T extends FieldValues>(): ResolverOptions<T> => ({
  criteriaMode: 'firstError',
  fields: {},
  names: [],
  shouldUseNativeValidation: false
});

describe('form-schema', () => {
  it('возвращает доступную ошибку поля для некорректного остатка', async () => {
    const result = await medicationFormResolver('m1', null, () => new Date('2026-09-13T00:00:00.000Z'))({
      ...medicationValues,
      stockUnits: 'Infinity'
    }, undefined, resolverOptions<MedicationFormValues>());

    expect(result.errors.stockUnits?.message).toContain('Остаток');
  });

  it('не допускает пустой набор дней и не изменяет исходные правила', async () => {
    const result = await scheduleFormResolver('r1', true)({
      ...scheduleValues,
      daysOfWeek: []
    }, undefined, resolverOptions<ScheduleFormValues>());

    expect(result.errors.daysOfWeek?.message).toContain('хотя бы один');
  });

  it('принимает десятичную дозу с запятой и отклоняет отсутствующий препарат', async () => {
    const valid = await manualIntakeResolver(new Set(['m1']))({ medicationId: 'm1', dose: '0,5' }, undefined, resolverOptions());
    const invalid = await manualIntakeResolver(new Set(['m1']))({ medicationId: 'unknown', dose: '1' }, undefined, resolverOptions());

    expect(valid.errors).toEqual({});
    expect(invalid.errors.medicationId?.message).toContain('выберите');
  });
});
