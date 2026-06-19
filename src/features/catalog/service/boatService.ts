import { publicSupabase, SUPABASE_URL } from '@/shared/supabase/publicClient';
import { Boat } from '@/store/useCatalogStore';

export async function fetchBoats() {
  const { data, count } = await publicSupabase
    .from('boats')
    .select(
      `
      id, name, type, capacity, length_meters,
      price_per_hour, public_price_per_hour_night,
      pier_id, seo_slug,
      has_tarp, has_heating, has_toilet, has_covered_saloon, has_bluetooth,
      boat_images(image_path, position),
      piers(name)
    `,
      { count: 'exact' },
    )
    .eq('moderation_status', 'approved')
    .eq('is_hidden', false)
    .order('display_order', { ascending: true });

  const mapped: Boat[] = ((data ?? []) as any[]).map((b) => {
    const sorted = [...(b.boat_images ?? [])].sort(
      (a: any, z: any) => a.position - z.position,
    );
    const img = sorted[0]?.image_path ?? null;
    return {
      id: b.id,
      name: b.name,
      type: b.type,
      capacity: b.capacity,
      length_meters: b.length_meters,
      price_per_hour: b.price_per_hour,
      public_price_per_hour_night: b.public_price_per_hour_night,
      public_price_per_hour_weekend: null,
      pier_id: b.pier_id,
      pier_name: b.piers?.name ?? null,
      seo_slug: b.seo_slug,
      promo_video_url: null,
      cover_image_url: img
        ? `${SUPABASE_URL}/storage/v1/object/public/boat_images/${img}`
        : null,
      rating: null,
      review_count: 0,
      has_tarp: b.has_tarp ?? false,
      has_heating: b.has_heating ?? false,
      has_toilet: b.has_toilet ?? false,
      has_covered_saloon: b.has_covered_saloon ?? false,
      has_bluetooth: b.has_bluetooth ?? false,
    };
  });

  return { data: mapped, count: count ?? mapped.length };
}