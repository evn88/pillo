import type { Intake } from './types';

export const historyPageSize = 100;

const compareIntakesDescending = (first: Intake, second: Intake) => (
  `${second.localDate}-${second.localTime}`.localeCompare(`${first.localDate}-${first.localTime}`)
);

/** Возвращает только нужную страницу, не создавая отсортированную копию всей истории. */
export const selectHistoryPage = (intakes: readonly Intake[], throughDate: string, page: number, pageSize = historyPageSize) => {
  const targetSize = Math.max(0, page + 1) * pageSize;
  const selected: Intake[] = [];
  let total = 0;

  for (const intake of intakes) {
    if (intake.localDate > throughDate) continue;
    total += 1;

    const insertionIndex = selected.findIndex(item => compareIntakesDescending(intake, item) < 0);
    if (insertionIndex === -1) selected.push(intake);
    else selected.splice(insertionIndex, 0, intake);
    if (selected.length > targetSize) selected.pop();
  }

  const start = Math.max(0, page) * pageSize;

  return { entries: selected.slice(start), hasMore: total > start + pageSize, total };
};
