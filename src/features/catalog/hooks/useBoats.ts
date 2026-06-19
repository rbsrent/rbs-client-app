import { Boat } from '@/store/useCatalogStore';
import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchBoats } from '../service/boatService';

export function useBoats() {
  const [allBoats, setAll] = useState<Boat[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRef] = useState<boolean>(false);
  const fetched = useRef(false);

  const load = useCallback(async (silent = false) => {
    silent ? setRef(true) : setLoading(true);
    try {
      const { data, count } = await fetchBoats();
      setAll(data);
      setTotal(count);
    } finally {
      setLoading(false);
      setRef(false);
    }
  }, []);

  useEffect(() => {
    if (!fetched.current) {
      fetched.current = true;
      load();
    }
  }, [load]);

  return { allBoats, total, loading, refreshing, load, setAll };
}