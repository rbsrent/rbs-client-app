import { memo } from 'react';
import { Dimensions } from 'react-native';

import { ActiveDiscount } from '@/features/catalog/hooks/useDiscountsCache';
import { buildBoatH1 } from '@/features/catalog/hooks/useBoatDetail';
import { BoatCard } from '@/shared/components/BoatCard';
import { HomeBoat } from '@/store/useHomeStore';

const { width: W } = Dimensions.get('window');
export const CARD_W = W * 0.46;
export const IMG_H  = Math.round(CARD_W * 1.05);

interface Props {
  boat:      HomeBoat;
  badge?:    string;
  discount?: ActiveDiscount;
}

export const PopularBoatCard = memo(function PopularBoatCard({ boat, badge, discount }: Props) {
  return (
    <BoatCard
      boat={{
        id:              boat.boat_id,
        name:            buildBoatH1({ name: boat.name, type: boat.type, seo_h1: boat.seo_h1, seo_name_ru: boat.seo_name_ru }),
        type:            boat.type,
        cover_image_url: boat.cover_image_url,
        price_per_hour:  boat.price_per_hour,
        public_price_per_hour_night: boat.public_price_per_hour_night,
        capacity:        boat.capacity,
        length_meters:   boat.length_meters,
        pier_name:       boat.pier_name,
        rating:          boat.average_rating > 0 ? boat.average_rating : null,
      }}
      layout="strip"
      badge={badge}
      discount={discount}
    />
  );
});
