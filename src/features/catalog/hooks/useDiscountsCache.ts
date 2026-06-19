import { publicSupabase } from '@/shared/supabase/publicClient';
import { useEffect, useState } from 'react';

interface BoatDiscount {
  boat_id: string;
  name: string;
  percentage: number;
  discount_type: string;
  days_of_week: number[] | null;
  start_time: string | null; // "08:00"
  end_time: string | null;   // "12:00"
}

export interface ActiveDiscount {
  name: string;
  percentage: number;
}

const TTL = 5 * 60 * 1000;
let _cache: BoatDiscount[] | null = null;
let _ts = 0;

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function isDiscountActive(d: BoatDiscount): boolean {
  const now = new Date();
  const dayOfWeek = now.getDay();

  if (d.days_of_week && d.days_of_week.length > 0 && !d.days_of_week.includes(dayOfWeek)) {
    return false;
  }

  if (d.start_time && d.end_time) {
    const nowMin = now.getHours() * 60 + now.getMinutes();
    if (nowMin < timeToMinutes(d.start_time) || nowMin >= timeToMinutes(d.end_time)) {
      return false;
    }
  }

  return true;
}

export function useDiscountsCache(): Map<string, ActiveDiscount> {
  const [map, setMap] = useState<Map<string, ActiveDiscount>>(() => buildMap(_cache));

  useEffect(() => {
    if (_cache && Date.now() - _ts < TTL) return;
    (async () => {
      const { data, error } = await publicSupabase
        .from('boat_discounts')
        .select('*')
        .eq('is_active', true);
      if (!data) return;
      _cache = data as BoatDiscount[];
      _ts = Date.now();
      setMap(buildMap(_cache));
    })();
  }, []);

  return map;
}

function buildMap(discounts: BoatDiscount[] | null): Map<string, ActiveDiscount> {
  const result = new Map<string, ActiveDiscount>();
  if (!discounts) return result;
  for (const d of discounts) {
    if (!result.has(d.boat_id) && isDiscountActive(d)) {
      result.set(d.boat_id, { name: d.name, percentage: d.percentage });
    }
  }
  return result;
}
