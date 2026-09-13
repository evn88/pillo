import { describe, expect, it } from 'vitest';

import { historyPageSize, selectHistoryPage } from '../history-pagination';
import type { Intake } from '../types';

const intake = (index: number): Intake => ({
  id: `intake-${index}`,
  medicationId: 'm1',
  scheduleRuleId: 'r1',
  medicationName: 'Препарат',
  medicationDosage: '10 мг',
  doseUnits: 1,
  localDate: `2026-09-${String((index % 28) + 1).padStart(2, '0')}`,
  localTime: `${String(index % 24).padStart(2, '0')}:00`,
  source: 'SCHEDULED',
  status: 'PENDING',
  takenAt: null,
  recordedAt: null,
  stockEffectUnits: null,
  contextSource: 'RECORDED'
});

describe('пагинация истории', () => {
  it('ограничивает рендер первой страницы для 10 000 записей', () => {
    const result = selectHistoryPage(Array.from({ length: 10_000 }, (_, index) => intake(index)), '2026-09-28', 0);

    expect(result.entries).toHaveLength(historyPageSize);
    expect(result.total).toBe(10_000);
    expect(result.hasMore).toBe(true);
  });

  it('не включает будущие даты и не повторяет записи следующей страницы', () => {
    const entries = [intake(1), intake(2), { ...intake(3), id: 'future', localDate: '2026-10-01' }];
    const first = selectHistoryPage(entries, '2026-09-30', 0, 1);
    const second = selectHistoryPage(entries, '2026-09-30', 1, 1);

    expect(first.entries[0]?.id).not.toBe(second.entries[0]?.id);
    expect([...first.entries, ...second.entries].map(item => item.id)).not.toContain('future');
  });
});
