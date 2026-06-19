import { Boat } from '@/store/useCatalogStore';
import { useMemo, useState } from 'react';
import { TYPE_CHIPS } from '../constants';
import { DEFAULT, Filters } from '../types';
import { countActive } from '../utils/filterUtils';

export function useCatalogFilters(boats: Boat[]) {
  const [filters, setFilters] = useState<Filters>(DEFAULT);
  const [searchText, setSearch] = useState<string>('');

  const filtered = useMemo(() => {
    const chip = TYPE_CHIPS.find((c) => c.id === filters.typeId);
    const q = searchText.trim().toLowerCase();
    return boats.filter((b) => {
      const t = (b.type ?? '').toLowerCase();
      if (chip?.boatType && !t.includes(chip.boatType)) return false;
      if (q && !b.name.toLowerCase().includes(q)) return false;
      if (filters.capacityMin !== null && (b.capacity ?? 0) < filters.capacityMin)
        return false;
      if (filters.priceMin !== null && b.price_per_hour < filters.priceMin)
        return false;
      if (filters.priceMax !== null && b.price_per_hour > filters.priceMax)
        return false;
      if (filters.hasTarp && !b.has_tarp) return false;
      if (filters.hasToilet && !b.has_toilet) return false;
      if (filters.hasHeating && !b.has_heating) return false;
      // Pier filter belum diterapkan di sini (bisa ditambahkan)
      return true;
    });
  }, [boats, filters, searchText]);

  const badge = countActive(filters);
  const hasActive = badge > 0 || searchText.trim() !== '';

  const removeTag = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((f) => ({ ...f, [key]: value }));
  };

  const resetAll = () => {
    setFilters(DEFAULT);
    setSearch('');
  };

  return {
    filters,
    setFilters,
    searchText,
    setSearch,
    filtered,
    badge,
    hasActive,
    removeTag,
    resetAll,
  };
}