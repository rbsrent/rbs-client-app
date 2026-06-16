import { COLORS } from '@/shared/colors';
import { SUPABASE_URL } from '@/shared/supabase/publicClient';

export interface WaterRoute {
  id: string;
  name: string;
  description: string | null;
  duration_hours: number;
  difficulty_level: string;
  route_points: { lat: number; lng: number; name: string }[];
  map_image_url: string | null;
  vessel_type: string | null;
  highlights: string[] | null;
  seo_slug: string | null;
  display_order: number;
}

const BUCKET = 'water-route-images';

export function resolveRouteImage(raw: string | null): string | null {
  if (!raw) return null;
  if (raw.startsWith('http')) return raw;
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${raw}`;
}

export const DIFFICULTY: Record<string, { label: string; color: string }> = {
  easy:   { label: 'Лёгкий',   color: COLORS.success },
  medium: { label: 'Средний',  color: COLORS.warning },
  hard:   { label: 'Сложный',  color: COLORS.error },
};

export const VESSEL_FILTERS = [
  { key: 'all',   label: 'Все' },
  { key: 'boat',  label: 'Катера' },
  { key: 'yacht', label: 'Яхты' },
] as const;
