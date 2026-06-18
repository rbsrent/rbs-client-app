import { BoatCard } from '@/shared/components/BoatCard';
import { AvailInfo } from '@/features/catalog/utils/filterUtils';
import { ActiveDiscount } from '@/features/catalog/hooks/useDiscountsCache';
import { Boat } from '@/store/useCatalogStore';

interface Props {
  boat:       Boat;
  availInfo?: AvailInfo;
  discount?:  ActiveDiscount;
}

export function PromoCard({ boat, availInfo, discount }: Props) {
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
      route={`/catalog/${boat.id}`}
      availInfo={availInfo}
      discount={discount}
    />
  );
}
