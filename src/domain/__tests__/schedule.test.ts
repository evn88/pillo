import { describe, expect, it } from 'vitest';

import { fromLocalDateTime, getUpcomingRuleDates, materializeIntakesForDate } from '../schedule';
import type { ScheduleRule } from '../types';

const rule: ScheduleRule = {
  id: 'rule-1',
  medicationId: 'medication-1',
  time: '09:30',
  doseUnits: 1,
  daysOfWeek: [1, 3, 5],
  startDate: '2026-01-01',
  endDate: null,
  comment: '',
  isActive: true
};

describe('расписание Pillo', () => {
  it('материализует один приём и не создаёт дубликат', () => {
    const date = new Date(2026, 7, 3, 8);
    const first = materializeIntakesForDate([rule], [], date);
    const second = materializeIntakesForDate([rule], first, date);

    expect(first).toHaveLength(1);
    expect(second).toHaveLength(1);
    expect(first[0]?.id).toBe('rule-1:2026-08-03');
  });

  it('не создаёт дату во время несуществующего локального времени', () => {
    const result = fromLocalDateTime('2026-02-30', '09:30');
    expect(result).toBeNull();
  });

  it('строит будущие срабатывания только для выбранных дней', () => {
    const dates = getUpcomingRuleDates(rule, new Date(2026, 7, 3, 10), 7);
    expect(dates.map(date => date.getDay())).toEqual([3, 5, 1]);
  });
});
