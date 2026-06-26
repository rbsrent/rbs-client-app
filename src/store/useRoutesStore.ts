import { create } from 'zustand';

import { WaterRoute } from '@/features/routes/types';

const TTL = 5 * 60 * 1000;

interface RoutesStore {
  routes: WaterRoute[];
  loading: boolean;
  lastFetch: number | null;
  setRoutes: (routes: WaterRoute[]) => void;
  setLoading: (v: boolean) => void;
  invalidate: () => void;
}

export const useRoutesStore = create<RoutesStore>((set) => ({
  routes: [],
  loading: true,
  lastFetch: null,
  setRoutes: (routes) => set({ routes, lastFetch: Date.now(), loading: false }),
  setLoading: (v) => set({ loading: v }),
  invalidate: () => set({ lastFetch: null }),
}));

export function isRoutesStale(): boolean {
  const { lastFetch } = useRoutesStore.getState();
  return !lastFetch || Date.now() - lastFetch > TTL;
}
