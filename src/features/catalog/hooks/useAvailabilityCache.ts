import { useEffect, useRef, useState } from 'react';
import { publicSupabase } from '@/shared/supabase/publicClient';
import { AvailInfo } from '../utils/filterUtils';

const CACHE_TTL = 30_000; // 30s

interface CacheEntry {
  data: Record<string, AvailInfo>;
  ts: number;
}

const _cache = new Map<string, CacheEntry>();

function cacheKey(start: string, end: string) {
  return `${start}|${end}`;
}

function toIsoMsk(date: Date, extraHours = 0): string {
  const d = new Date(date.getTime() + extraHours * 3_600_000);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:00:00+03:00`;
}

export interface DateTimeFilter {
  date: Date | null;
  startHour: number;
  durationHours: number;
}

export function useAvailabilityCache(dt: DateTimeFilter): {
  availMap: Record<string, AvailInfo>;
  loading: boolean;
} {
  const [availMap, setAvailMap] = useState<Record<string, AvailInfo>>({});
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!dt.date) {
      setAvailMap({});
      setLoading(false);
      return;
    }

    const startDate = new Date(
      dt.date.getFullYear(),
      dt.date.getMonth(),
      dt.date.getDate(),
      dt.startHour,
    );
    const pStart = toIsoMsk(startDate);
    const pEnd = toIsoMsk(startDate, dt.durationHours);
    const key = cacheKey(pStart, pEnd);

    const cached = _cache.get(key);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setLoading(false);
      setAvailMap(cached.data);
      return;
    }

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);

    (async () => {
      try {
        const { data } = await publicSupabase.rpc('get_boats_with_availability', {
          p_start_datetime: pStart,
          p_end_datetime: pEnd,
        });
        if (ctrl.signal.aborted) return;
        if (!data) { setLoading(false); return; }
        const map: Record<string, AvailInfo> = {};
        (data as any[]).forEach((row) => {
          map[row.boat_id] = {
            status: row.availability_status,
            available_hours: row.available_hours ?? 0,
            total_hours_in_period: row.total_hours_in_period ?? 0,
          };
        });
        _cache.set(key, { data: map, ts: Date.now() });
        setAvailMap(map);
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    })();

    return () => {
      ctrl.abort();
      setLoading(false);
    };
  }, [dt.date?.getTime(), dt.startHour, dt.durationHours]);

  return { availMap, loading };
}
