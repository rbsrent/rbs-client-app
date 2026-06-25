import { COLORS } from '@/shared/colors';
import { SUPABASE_URL } from '@/shared/supabase/publicClient';

export interface WaterRoute {
  id: string;
  name: string;
  description: string | null;
  detailed_description: string | null;
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

function toWebp(url: string): string {
  return url.replace(/\.[^/.]+$/, '') + '_large.webp';
}

export function resolveRouteImage(raw: string | null): string | null {
  if (!raw) return null;
  if (raw.startsWith('http')) {
    const normalized = raw
      .replace('https://ntempzyiunijdoskroxs.supabase.co', SUPABASE_URL)
      .replace('https://proxy.rbs.rent', SUPABASE_URL);
    return toWebp(normalized);
  }
  return toWebp(`${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${raw}`);
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
