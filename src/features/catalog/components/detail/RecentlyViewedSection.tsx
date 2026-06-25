import { memo, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useDiscountsCache } from '@/features/catalog/hooks/useDiscountsCache';
import { PopularBoatCard } from '@/features/home/components/cards/PopularBoatCard';
import { RECENT_GROUP_ID, WishlistItem, getGroupItems } from '@/shared/wishlist';
import { HomeBoat } from '@/store/useHomeStore';

function toHomeBoat(item: WishlistItem): HomeBoat {
  return {
    boat_id: item.boat_id,
    name: item.name,
    seo_h1: null,
    seo_name_ru: null,
    type: item.type,
    capacity: item.capacity,
    length_meters: item.length_meters,
    price_per_hour: item.price_per_hour,
    public_price_per_hour_night: null,
    average_rating: item.rating ?? 0,
    pier_name: item.pier_name,
    cover_image_url: item.cover_image_url,
    images: null,
  };
}

interface Props {
  currentBoatId?: string;
  title?: string
}

function RecentlyViewedSection({ currentBoatId, title = "Вы смотрели" }: Props) {
  const [boats, setBoats] = useState<HomeBoat[]>([]);
  const discountsMap = useDiscountsCache();

  useEffect(() => {
    getGroupItems(RECENT_GROUP_ID).then((items) => {
      const filtered = items
        .filter((i) => !currentBoatId || i.boat_id !== currentBoatId)
        .slice(0, 10)
        .map(toHomeBoat);
      setBoats(filtered);
    });
  }, [currentBoatId]);

  if (boats.length === 0) return null;

  return (
    <View style={s.section}>
      <Text style={s.title}>{title}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.strip}
      >
        {boats.map((b) => (
          <PopularBoatCard
            key={b.boat_id}
            boat={b}
            discount={discountsMap.get(b.boat_id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

export default memo(RecentlyViewedSection);

const s = StyleSheet.create({
  section: { paddingTop: 20, paddingBottom: 4 },
  title: {
    fontSize: 18,
    fontWeight: '500',
    color: '#000',
    paddingHorizontal: 24,
    marginBottom: 14,
  },
  strip: { paddingHorizontal: 24, gap: 12 },
});
