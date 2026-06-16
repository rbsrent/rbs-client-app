import { useCallback, useEffect, useRef } from 'react';

import { publicSupabase, SUPABASE_URL } from '@/shared/supabase/publicClient';
import { useCatalogStore } from '@/store/useCatalogStore';

const CACHE_TTL = 5 * 60 * 1000;

export function useHomeData() {
  const {
    boats,
    heroSlides,
    isLoadingBoats,
    isLoadingSlides,
    lastFetchedAt,
    setBoats,
    setHeroSlides,
    setLoadingBoats,
    setLoadingSlides,
    setLastFetchedAt,
  } = useCatalogStore();

  const isFetchingRef = useRef(false);

  const fetchBoats = useCallback(async () => {
    if (isFetchingRef.current) return;
    const now = Date.now();
    if (lastFetchedAt && now - lastFetchedAt < CACHE_TTL && boats.length > 0) return;

    isFetchingRef.current = true;
    setLoadingBoats(true);
    try {
      const { data, error } = await publicSupabase
        .from('boats')
        .select(`
          id, name, type, capacity, length_meters,
          price_per_hour, public_price_per_hour_night, public_price_per_hour_weekend,
          pier_id, seo_slug, promo_video_url,
          has_tarp, has_heating, has_toilet, has_covered_saloon, has_bluetooth,
          boat_images(image_path, position),
          piers(name)
        `)
        .eq('moderation_status', 'approved')
        .eq('is_hidden', false)
        .order('display_order', { ascending: true });

      if (error) throw error;

      const mapped = (data ?? []).map((b: any) => {
        const sorted = (b.boat_images ?? []).sort((a: any, z: any) => a.position - z.position);
        const firstImg = sorted[0]?.image_path ?? null;
        const coverUrl = firstImg
          ? `${SUPABASE_URL}/storage/v1/object/public/boat_images/${firstImg}`
          : null;
        return {
          id: b.id,
          name: b.name,
          type: b.type,
          capacity: b.capacity,
          length_meters: b.length_meters,
          price_per_hour: b.price_per_hour,
          public_price_per_hour_night: b.public_price_per_hour_night,
          public_price_per_hour_weekend: b.public_price_per_hour_weekend,
          pier_id: b.pier_id,
          pier_name: b.piers?.name ?? null,
          seo_slug: b.seo_slug,
          promo_video_url: b.promo_video_url,
          cover_image_url: coverUrl,
          rating: null,
          review_count: 0,
          has_tarp: b.has_tarp,
          has_heating: b.has_heating,
          has_toilet: b.has_toilet,
          has_covered_saloon: b.has_covered_saloon,
          has_bluetooth: b.has_bluetooth,
        };
      });

      setBoats(mapped);
      setLastFetchedAt(Date.now());
    } finally {
      setLoadingBoats(false);
      isFetchingRef.current = false;
    }
  }, [lastFetchedAt, boats.length]);

  const fetchSlides = useCallback(async () => {
    if (heroSlides.length > 0) return;
    setLoadingSlides(true);
    try {
      const { data } = await publicSupabase
        .from('hero_slides')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      setHeroSlides(data ?? []);
    } finally {
      setLoadingSlides(false);
    }
  }, [heroSlides.length]);

  useEffect(() => {
    fetchBoats();
    fetchSlides();
  }, []);

  return { boats, heroSlides, isLoadingBoats, isLoadingSlides, refetch: fetchBoats };
}
