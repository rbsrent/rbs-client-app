import { AppliedDiscount } from './types';

// ─── Constants ────────────────────────────────────────────────────────────────

export const MONTHS_S = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];

const DAY_NAMES_RU = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

// ─── Pure helpers ─────────────────────────────────────────────────────────────

export function fmtHour(h: number): string {
  return `${String(h).padStart(2, '0')}:00`;
}

export function fmtShort(d: Date): string {
  return `${d.getDate()} ${MONTHS_S[d.getMonth()]}`;
}

export function durLabel(h: number): string {
  return h === 1 ? '1 час' : h < 5 ? `${h} часа` : `${h} часов`;
}

export function ruFmt(n: number): string {
  return new Intl.NumberFormat('ru-RU').format(n);
}

export function fmtDiscountCondition(d: AppliedDiscount): string {
  const parts: string[] = [];
  const tc = d.timeConditions;
  if (tc?.daysOfWeek?.length) {
    parts.push(tc.daysOfWeek.map((n) => DAY_NAMES_RU[n]).join(', '));
  }
  if (tc?.startHour != null && tc?.endHour != null) {
    parts.push(`с ${fmtHour(tc.startHour)}-${fmtHour(tc.endHour)}`);
  }
  return parts.join(' ');
}

export function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function buildDatetime(date: Date, hour: number): Date {
  const d = new Date(date);
  d.setHours(hour, 0, 0, 0);
  return d;
}
