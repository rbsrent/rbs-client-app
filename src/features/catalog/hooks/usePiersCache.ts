import { useEffect, useState } from 'react';
import { publicSupabase } from '@/shared/supabase/publicClient';
import { PierWithCoords } from '../utils/filterUtils';

const TTL = 10 * 60 * 1000; // 10 min — piers rarely change
let _cache: PierWithCoords[] | null = null;
let _ts = 0;

export function usePiersCache(): PierWithCoords[] {
  const [piers, setPiers] = useState<PierWithCoords[]>(() => _cache ?? []);

  useEffect(() => {
    if (_cache && Date.now() - _ts < TTL) return;
    (async () => {
      const { data } = await publicSupabase
        .from('piers')
        .select('id, name, latitude, longitude')
        .eq('is_active', true);
      if (!data) return;
      _cache = data as PierWithCoords[];
      _ts = Date.now();
      setPiers(_cache);
    })();
  }, []);

  return piers;
}
