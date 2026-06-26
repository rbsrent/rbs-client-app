import { Booking } from './types';

const cache = new Map<string, Booking>();

export function setCachedBooking(b: Booking) {
  cache.set(b.id, b);
}

export function setCachedBookings(list: Booking[]) {
  list.forEach((b) => cache.set(b.id, b));
}

export function getCachedBooking(id: string): Booking | null {
  return cache.get(id) ?? null;
}
