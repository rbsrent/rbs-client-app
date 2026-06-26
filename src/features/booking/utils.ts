import { AppliedDiscount } from './types';

// ─── Constants ────────────────────────────────────────────────────────────────

export const MONTHS_S = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];

const DAY_NAMES_RU = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

// ─── Pure helpers ─────────────────────────────────────────────────────────────

export function fmtHour(h: number): string {
  return `${String(h % 24).padStart(2, '0')}:00`;
}

export function fmtHourLabel(h: number): string {
  return h >= 24 ? `${fmtHour(h)} +1` : fmtHour(h);
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

/**
 * Compute the next selectedHours array when a slot is tapped,
 * respecting the minimum booking duration.
 */
export function computeSlotSelection(
  prev: number[],
  hour: number,
  minDur: number,
  unavailable: (h: number) => boolean,
): number[] {
  const makeRange = (start: number, len: number) =>
    Array.from({ length: len }, (_, i) => start + i);

  const tryRange = (start: number, len: number): number[] | null => {
    const r = makeRange(start, len);
    return r.some(unavailable) ? null : r;
  };

  if (prev.length === 0) {
    // First tap — auto-extend to minDur
    return tryRange(hour, minDur) ?? [hour];
  }

  const min = prev[0];
  const max = prev[prev.length - 1];

  if (hour >= min && hour <= max) {
    // Tapping within existing selection
    if (hour === min && hour === max) return []; // single slot → deselect
    if (hour === max) {
      const next = prev.slice(0, -1);
      return next.length >= minDur ? next : prev;
    }
    if (hour === min) {
      const next = prev.slice(1);
      return next.length >= minDur ? next : prev;
    }
    // Middle tap — start fresh from here
    return tryRange(hour, minDur) ?? [hour];
  }

  // Extending the range
  const extended = hour > max
    ? makeRange(min, hour - min + 1)
    : makeRange(hour, max - hour + 1);

  if (extended.some(unavailable)) {
    // Can't extend to this hour — start fresh
    return tryRange(hour, minDur) ?? prev;
  }
  return extended;
}
