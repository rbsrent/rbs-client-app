import { useEffect, useRef, useState } from 'react';
import { TIME_OPTS } from '../constants';
import { fetchAvailabilitySnapshot, toIsoMsk } from './useAvailabilityCache';

export function useHourlyAvailability(
  date: Date | null,
  durationHours: number,
): { availableHours: Record<number, boolean> | null; loading: boolean } {
  const [availableHours, setAvailableHours] = useState<Record<number, boolean> | null>(null);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!date) {
      setAvailableHours(null);
      setLoading(false);
      return;
    }

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);

    const now = new Date();
    const isToday =
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();
    const minHour = isToday ? now.getHours() + 1 : 0;

    // Fetch in small batches instead of all 24 hours at once — avoids a burst
    // of 24 concurrent responses landing (and re-rendering) in the same tick,
    // which is where low-end devices feel a frame hitch.
    const BATCH_SIZE = 6;

    (async () => {
      try {
        const result: Record<number, boolean> = {};
        for (let i = 0; i < TIME_OPTS.length; i += BATCH_SIZE) {
          if (ctrl.signal.aborted) return;
          const batch = TIME_OPTS.slice(i, i + BATCH_SIZE);
          const entries = await Promise.all(
            batch.map(async (h) => {
              if (h < minHour) return [h, false] as const;
              const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), h);
              const pStart = toIsoMsk(startDate);
              const pEnd = toIsoMsk(startDate, durationHours);
              const map = await fetchAvailabilitySnapshot(pStart, pEnd);
              const anyAvailable = Object.values(map).some((v) => v.status !== 'not_available');
              return [h, anyAvailable] as const;
            }),
          );
          entries.forEach(([h, ok]) => { result[h] = ok; });
        }
        if (ctrl.signal.aborted) return;
        setAvailableHours(result);
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    })();

    return () => {
      ctrl.abort();
      setLoading(false);
    };
  }, [date?.getTime(), durationHours]);

  return { availableHours, loading };
}
