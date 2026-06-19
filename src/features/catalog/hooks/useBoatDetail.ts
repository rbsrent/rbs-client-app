import { useEffect, useState } from 'react';

import { publicSupabase, SUPABASE_URL } from '@/shared/supabase/publicClient';
import { addToRecentlyViewed } from '@/shared/wishlist';

export interface BoatImage {
  image_path: string;
  position:   number;
}

export interface BoatPier {
  name:    string;
  address: string | null;
}

export interface Boat {
  id:                          string;
  name:                        string;
  type:                        string | null;
  description:                 string | null;
  price_per_hour:              number;
  public_price_per_hour_night: number | null;
  capacity:                    number | null;
  length_meters:               number | null;
  has_tarp:                    boolean;
  has_toilet:                  boolean;
  has_heating:                 boolean;
  has_covered_saloon:          boolean;
  has_bluetooth:               boolean;
  piers:                       BoatPier | null;
  boat_images:                 BoatImage[];
}

export interface ReviewItem {
  id:         string;
  user_name:  string;
  rating:     number;
  comment:    string;
  created_at: string;
}

export interface ReviewRating {
  avg:   number;
  total: number;
}

export interface BoatDetailState {
  boat:         Boat | null;
  images:       string[];
  similar:      any[];
  reviews:      ReviewItem[];
  reviewRating: ReviewRating;
  isLoading:    boolean;
}

export function useBoatDetail(id: string): BoatDetailState {
  const [boat,         setBoat]         = useState<Boat | null>(null);
  const [images,       setImages]       = useState<string[]>([]);
  const [similar,      setSimilar]      = useState<any[]>([]);
  const [reviews,      setReviews]      = useState<ReviewItem[]>([]);
  const [reviewRating, setReviewRating] = useState<ReviewRating>({ avg: 0, total: 0 });
  const [isLoading,    setIsLoading]    = useState(true);

  useEffect(() => {
    let cancelled = false;

    setIsLoading(true);
    // Reset stale data from previous boat
    setBoat(null);
    setImages([]);
    setReviews([]);
    setReviewRating({ avg: 0, total: 0 });
    setSimilar([]);

    // ── Critical path: boat + reviews + rating all in parallel ────────────────
    // No waterfall — one round-trip, isLoading covers all three.
    (async () => {
      try {
        const [boatRes, reviewsRes, ratingRes] = await Promise.all([
          publicSupabase
            .from('boats')
            .select('*, boat_images(image_path, position), piers(name, address)')
            .eq('id', id)
            .single(),
          publicSupabase
            .from('boat_reviews')
            .select('id, user_name, rating, comment, created_at')
            .eq('boat_id', id)
            .eq('moderation_status', 'approved')
            .order('created_at', { ascending: false })
            .limit(20),
          publicSupabase.rpc('get_boat_average_rating', { p_boat_id: id }),
        ]);

        if (cancelled) return;

        const data = boatRes.data;
        if (data) {
          setBoat(data as Boat);

          const sorted = [...(data.boat_images ?? [])].sort(
            (a: any, b: any) => a.position - b.position,
          );
          const coverPath = sorted[0]?.image_path;
          setImages(
            sorted.map(
              (img: any) =>
                `${SUPABASE_URL}/storage/v1/object/public/boat_images/${img.image_path}`,
            ),
          );
          addToRecentlyViewed({
            boat_id:         data.id,
            name:            data.name,
            type:            data.type          ?? null,
            cover_image_url: coverPath
              ? `${SUPABASE_URL}/storage/v1/object/public/boat_images/${coverPath}`
              : null,
            price_per_hour:  data.price_per_hour,
            capacity:        data.capacity      ?? null,
            length_meters:   data.length_meters ?? null,
            pier_name:       data.piers?.name   ?? null,
            rating:          null,
          });
        }

        if (reviewsRes.data) setReviews(reviewsRes.data);

        if (ratingRes.data?.[0]) {
          setReviewRating({
            avg:   ratingRes.data[0].average_rating ?? 0,
            total: ratingRes.data[0].total_reviews  ?? 0,
          });
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    // ── Similar boats: non-blocking, runs in parallel with critical path ──────
    // Fetches price-range matches first; falls back to recent if too few results.
    // Does not affect isLoading — appears after main content without blocking it.
    (async () => {
      let { data } = await publicSupabase
        .from('boats')
        .select(
          'id, name, type, price_per_hour, capacity, length_meters, piers(name), boat_images(image_path, position)',
        )
        .neq('id', id)
        .eq('is_hidden', false)
        .eq('moderation_status', 'approved')
        .order('created_at', { ascending: false })
        .limit(10);

      if (cancelled || !data) return;
      setSimilar(
        (data as any[]).map((b: any) => {
          const imgs = [...(b.boat_images ?? [])].sort(
            (a: any, z: any) => a.position - z.position,
          );
          return {
            ...b,
            pier_name:       b.piers?.name ?? null,
            cover_image_url: imgs[0]
              ? `${SUPABASE_URL}/storage/v1/object/public/boat_images/${imgs[0].image_path}`
              : null,
          };
        }),
      );
    })();

    return () => { cancelled = true; };
  }, [id]);

  return { boat, images, similar, reviews, reviewRating, isLoading };
}
