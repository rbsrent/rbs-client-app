import { useEffect, useRef } from 'react';

import { publicSupabase, SUPABASE_URL } from '@/shared/supabase/publicClient';
import { HomeBoat, HomeRoute, useHomeStore } from '@/store/useHomeStore';
import { HeroSlide } from '@/store/useCatalogStore';

const CACHE_TTL = 5 * 60 * 1000;
const BUCKET    = 'boat_images';

function resolveBoatImage(images: any): string | null {
  try {
    const arr: any[] = Array.isArray(images) ? images : JSON.parse(images ?? '[]');
    const sorted = arr.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    const path = sorted[0]?.image_path;
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
  } catch { return null; }
}

function mapDirectBoat(b: any): HomeBoat {
  const imgs = [...(b.boat_images ?? [])].sort((a: any, z: any) => a.position - z.position);
  return {
    boat_id:        b.id,
    name:           b.name,
    seo_h1:         b.seo_h1 ?? null,
    seo_name_ru:    b.seo_name_ru ?? null,
    type:           b.type ?? null,
    capacity:       b.capacity ?? null,
    length_meters:  b.length_meters ?? null,
    price_per_hour: b.price_per_hour,
    public_price_per_hour_night: b.public_price_per_hour_night ?? null,
    average_rating: 0,
    pier_name:      null,
    cover_image_url: imgs[0]?.image_path
      ? `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${imgs[0].image_path}`
      : null,
    images: imgs,
    badge_override: b.badge_override ?? null,
  };
}

function mapRpcBoat(b: any): HomeBoat {
  return {
    boat_id:         b.boat_id,
    name:            b.name,
    seo_h1:          b.seo_h1 ?? null,
    seo_name_ru:     b.seo_name_ru ?? null,
    type:            b.type ?? null,
    capacity:        b.capacity ?? null,
    length_meters:   b.length_meters ?? null,
    price_per_hour:  b.price_per_hour,
    public_price_per_hour_night: b.public_price_per_hour_night ?? null,
    average_rating:  b.average_rating ?? 0,
    pier_name:       b.pier_name ?? null,
    cover_image_url: resolveBoatImage(b.images),
    images:          b.images,
    badge_override:  b.badge_override ?? null,
  };
}

export function useHomePageData() {
  const { popular, katera, yakhty, routes, slides, loading, lastFetch, setAll, setLoading } =
    useHomeStore();

  const fetchingRef = useRef(false);

  useEffect(() => {
    const stale = !lastFetch || Date.now() - lastFetch > CACHE_TTL;
    if (!stale || fetchingRef.current) return;

    fetchingRef.current = true;
    setLoading(true);

    Promise.all([
      publicSupabase.rpc('get_popular_boats', { limit_count: 8 }),
      publicSupabase
        .from('boats')
        .select('id,name,seo_h1,seo_name_ru,type,price_per_hour,public_price_per_hour_night,capacity,length_meters,badge_override,boat_images(image_path,position)')
        .eq('is_hidden', false)
        .eq('moderation_status', 'approved')
        .eq('type', 'катер')
        .order('display_order', { ascending: true }),
      publicSupabase
        .from('boats')
        .select('id,name,seo_h1,seo_name_ru,type,price_per_hour,public_price_per_hour_night,capacity,length_meters,badge_override,boat_images(image_path,position)')
        .eq('is_hidden', false)
        .eq('moderation_status', 'approved')
        .eq('type', 'яхта')
        .order('display_order', { ascending: true }),
      publicSupabase
        .from('hero_slides')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true }),
      publicSupabase
        .from('water_routes')
        .select('id,name,map_image_url,duration_hours,seo_slug')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .limit(5),
    ])
      .then(([popRes, kateraRes, yakhtaRes, slidesRes, routesRes]) => {
        setAll({
          popular: (popRes.data ?? []).map(mapRpcBoat),
          katera:  (kateraRes.data ?? []).map(mapDirectBoat),
          yakhty:  (yakhtaRes.data ?? []).map(mapDirectBoat),
          slides:  (slidesRes.data ?? []) as HeroSlide[],
          routes:  (routesRes.data ?? []) as HomeRoute[],
        });
      })
      .catch(() => setLoading(false))
      .finally(() => { fetchingRef.current = false; });
  }, []);

  return { popular, katera, yakhty, routes, slides, loading };
}
