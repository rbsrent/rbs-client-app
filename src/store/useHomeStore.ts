import { create } from 'zustand';

import { HeroSlide } from './useCatalogStore';

export type { HeroSlide };

export interface HomeBoat {
  boat_id: string;
  name: string;
  seo_h1: string | null;
  seo_name_ru: string | null;
  type: string | null;
  capacity: number | null;
  length_meters: number | null;
  price_per_hour: number;
  public_price_per_hour_night: number | null;
  average_rating: number;
  pier_name: string | null;
  cover_image_url: string | null;
  images: any;
  badge_override: string | null;
}

export interface HomeRoute {
  id: string;
  name: string;
  map_image_url: string | null;
  duration_hours: number | null;
  seo_slug: string | null;
}

interface HomeStore {
  popular:   HomeBoat[];
  katera:    HomeBoat[];
  yakhty:    HomeBoat[];
  routes:    HomeRoute[];
  slides:    HeroSlide[];
  loading:   boolean;
  lastFetch: number | null;

  setAll: (data: Omit<HomeStore, 'loading' | 'lastFetch' | 'setAll' | 'setLoading'>) => void;
  setLoading: (v: boolean) => void;
}

export const useHomeStore = create<HomeStore>((set) => ({
  popular:   [],
  katera:    [],
  yakhty:    [],
  routes:    [],
  slides:    [],
  loading:   true,
  lastFetch: null,

  setAll: (data) => set({ ...data, lastFetch: Date.now(), loading: false }),
  setLoading: (v) => set({ loading: v }),
}));
