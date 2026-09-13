export class DomainError extends Error {
  constructor(message: string, readonly field?: string) {
    super(message);
    this.name = 'DomainError';
  }
}

const scale = 1000;
const maximumUnits = 1_000_000_000;

export const toMilliunits = (value: number, field = 'Количество', positive = false): number => {
  const scaled = Math.round(value * scale);
  if (!Number.isFinite(value) || value < 0 || (positive && scaled === 0) || value > maximumUnits ||
    Math.abs(value * scale - scaled) > Math.max(1e-9, Number.EPSILON * Math.abs(value * scale) * 4)) {
    throw new DomainError(`${field}: укажите ${positive ? 'положительное' : 'неотрицательное'} число до ${maximumUnits} с точностью до 0,001.`, field);
  }
  return scaled;
};

export const parseQuantity = (input: string, field: string, positive = false): number => {
  const normalized = input.trim().replace(',', '.');
  if (!/^\d+(?:\.\d{1,3})?$/.test(normalized)) {
    throw new DomainError(`${field}: введите число, например 0,5.`, field);
  }
  return toMilliunits(Number(normalized), field, positive) / scale;
};

export const isDateKey = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value && value >= '1900-01-01';
};

export const isTime = (value: string): boolean => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

export const requireDateKey = (value: string, field = 'Дата'): string => {
  if (!isDateKey(value)) throw new DomainError(`${field}: укажите существующую дату ГГГГ-ММ-ДД.`, field);
  return value;
};

export const requireTime = (value: string): string => {
  if (!isTime(value)) throw new DomainError('Время: укажите значение от 00:00 до 23:59.', 'Время');
  return value;
};
