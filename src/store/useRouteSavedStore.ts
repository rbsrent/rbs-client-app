import { create } from 'zustand';
import {
  getAllRoutesSavedIds,
  isRouteInAnyGroup,
} from '@/shared/wishlist';

interface RouteSavedStore {
  savedIds: Set<string>;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  isSaved: (id: string) => boolean;
  markSaved: (id: string) => void;
  markUnsaved: (id: string) => void;
  refresh: (id: string) => Promise<void>;
}

export const useRouteSavedStore = create<RouteSavedStore>((set, get) => ({
  savedIds:  new Set(),
  hydrated:  false,

  hydrate: async () => {
    if (get().hydrated) return;
    const ids = await getAllRoutesSavedIds();
    set({ savedIds: new Set(ids), hydrated: true });
  },

  isSaved: (id) => get().savedIds.has(id),

  markSaved: (id) =>
    set((s) => ({ savedIds: new Set([...s.savedIds, id]) })),

  markUnsaved: (id) =>
    set((s) => {
      const next = new Set(s.savedIds);
      next.delete(id);
      return { savedIds: next };
    }),

  refresh: async (id) => {
    const saved = await isRouteInAnyGroup(id);
    set((s) => {
      const next = new Set(s.savedIds);
      saved ? next.add(id) : next.delete(id);
      return { savedIds: next };
    });
  },
}));
