import type { Pier } from './types';

export interface TripEditResult {
  date: Date;
  startHour: number;
  duration: number;
  pier: Pier | null;
}

let _piers: Pier[] = [];
let _cb: ((result: TripEditResult) => void) | null = null;

export function cachePiers(piers: Pier[]) { _piers = piers; }
export function getCachedPiers(): Pier[] { return _piers; }
export function setTripEditCallback(cb: (result: TripEditResult) => void) { _cb = cb; }
export function resolveTripEdit(result: TripEditResult) { _cb?.(result); _cb = null; }
