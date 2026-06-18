import { BoatCard } from '@/shared/components/BoatCard';
import { Boat } from '@/store/useCatalogStore';

export function PromoCard({ boat }: { boat: Boat }) {
  return (
    <BoatCard
      boat={{
        id:              boat.id,
        name:            boat.name,
        type:            boat.type,
        cover_image_url: boat.cover_image_url,
        price_per_hour:  boat.price_per_hour,
        capacity:        boat.capacity,
        length_meters:   boat.length_meters,
        pier_name:       boat.pier_name,
        rating:          boat.rating,
      }}
      layout="grid"
      route={`/booking/${boat.id}`}
    />
  );
}
