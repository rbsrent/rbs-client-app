import { create } from 'zustand';

export interface Boat {
  id: string;
  name: string;
  type: string;
  capacity: number;
  length_meters: number | null;
  price_per_hour: number;
  public_price_per_hour_night: number | null;
  public_price_per_hour_weekend: number | null;
  pier_id: string | null;
  pier_name: string | null;
  seo_slug: string | null;
  promo_video_url: string | null;
  cover_image_url: string | null;
  rating: number | null;
  review_count: number;
  has_tarp: boolean;
  has_heating: boolean;
  has_toilet: boolean;
  has_covered_saloon: boolean;
  has_bluetooth: boolean;
}

export interface HeroSlide {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  cta_primary_label: string;
  cta_primary_url: string;
  cta_secondary_label: string;
  cta_secondary_url: string;
  is_active: boolean;
  display_order: number;
}

interface Filters {
  date: string | null;
  time: string | null;
  duration: number | null;
  pierId: string | null;
  type: string | null;
  minCapacity: number | null;
  minPrice: number | null;
  maxPrice: number | null;
}

interface CatalogState {
  boats: Boat[];
  heroSlides: HeroSlide[];
  filters: Filters;
  isLoadingBoats: boolean;
  isLoadingSlides: boolean;
  lastFetchedAt: number | null;
  setBoats: (boats: Boat[]) => void;
  setHeroSlides: (slides: HeroSlide[]) => void;
  setFilters: (filters: Partial<Filters>) => void;
  clearFilters: () => void;
  setLoadingBoats: (v: boolean) => void;
  setLoadingSlides: (v: boolean) => void;
  setLastFetchedAt: (ts: number) => void;
}

const defaultFilters: Filters = {
  date: null,
  time: null,
  duration: null,
  pierId: null,
  type: null,
  minCapacity: null,
  minPrice: null,
  maxPrice: null,
};

export const useCatalogStore = create<CatalogState>((set) => ({
  boats: [],
  heroSlides: [],
  filters: defaultFilters,
  isLoadingBoats: false,
  isLoadingSlides: false,
  lastFetchedAt: null,

  setBoats: (boats) => set({ boats }),
  setHeroSlides: (heroSlides) => set({ heroSlides }),
  setFilters: (filters) => set((s) => ({ filters: { ...s.filters, ...filters } })),
  clearFilters: () => set({ filters: defaultFilters }),
  setLoadingBoats: (isLoadingBoats) => set({ isLoadingBoats }),
  setLoadingSlides: (isLoadingSlides) => set({ isLoadingSlides }),
  setLastFetchedAt: (lastFetchedAt) => set({ lastFetchedAt }),
}));
