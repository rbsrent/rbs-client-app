import React, { useMemo } from 'react';
import { BoatCard, BoatCardVariant } from '@/shared/components/BoatCard';
import { AvailInfo } from '@/features/catalog/utils/filterUtils';
import { ActiveDiscount } from '@/features/catalog/hooks/useDiscountsCache';
import { Boat } from '@/store/useCatalogStore';

interface Props {
  boat:          Boat;
  availInfo?:    AvailInfo;
  discount?:     ActiveDiscount;
  variant?:      BoatCardVariant;
  selectedDate?: string;
}

export const PromoCard = React.memo(function PromoCard({ boat, availInfo, discount, variant = "catalog", selectedDate }: Props) {
  const route = selectedDate
    ? `/catalog/${boat.id}?selectedDate=${selectedDate}`
    : `/catalog/${boat.id}`;

  const boatData = useMemo(() => ({
    id:              boat.id,
    name:            boat.name,
    type:            boat.type,
    cover_image_url: boat.cover_image_url,
    price_per_hour:  boat.price_per_hour,
    public_price_per_hour_night: boat.public_price_per_hour_night,
    capacity:        boat.capacity,
    length_meters:   boat.length_meters,
    pier_name:       boat.pier_name,
    rating:          boat.rating,
  }), [boat.id, boat.name, boat.type, boat.cover_image_url, boat.price_per_hour, boat.public_price_per_hour_night, boat.capacity, boat.length_meters, boat.pier_name, boat.rating]);

  return (
    <BoatCard
      boat={boatData}
      layout="grid"
      route={route}
      availInfo={availInfo}
      discount={discount}
      variant={variant}
    />
  );
});
