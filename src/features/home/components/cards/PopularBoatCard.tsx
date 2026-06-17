import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Star } from 'lucide-react-native';
import { memo } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/shared/colors';
import { HeartButton } from '@/shared/components/HeartButton';
import { HomeBoat } from '@/store/useHomeStore';

const { width: W } = Dimensions.get('window');
export const CARD_W = W * 0.46;
export const IMG_H  = Math.round(CARD_W * 1.1);

const ruNum = (n: number) => new Intl.NumberFormat('ru-RU').format(Math.round(n));

export const PopularBoatCard = memo(function PopularBoatCard({ boat }: { boat: HomeBoat }) {
  const router   = useRouter();
  const hasRate  = boat.average_rating > 0;

  return (
    <Pressable
      style={({ pressed }) => [s.card, pressed && { opacity: 0.92 }]}
      onPress={() => router.push(`/catalog/${boat.boat_id}` as any)}
    >
      <View style={s.imgWrap}>
        {boat.cover_image_url ? (
          <Image
            source={{ uri: boat.cover_image_url }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.muted }]} />
        )}
        <HeartButton
          boat={{
            boat_id:        boat.boat_id,
            name:           boat.name,
            type:           boat.type,
            cover_image_url: boat.cover_image_url,
            price_per_hour:  boat.price_per_hour,
            capacity:        boat.capacity,
            length_meters:   boat.length_meters,
            pier_name:       boat.pier_name,
            rating:          boat.average_rating > 0 ? boat.average_rating : null,
          }}
        />
      </View>

      <View style={s.info}>
        <View style={s.nameRow}>
          <Text style={s.name} numberOfLines={2}>{boat.name}</Text>
          {hasRate && (
            <View style={s.ratingRow}>
              <Star size={11} color="#F5A623" fill="#F5A623" strokeWidth={0} />
              <Text style={s.ratingTxt}>{boat.average_rating.toFixed(2)}</Text>
            </View>
          )}
        </View>
        <Text style={s.sub} numberOfLines={1}>
          {[
            boat.capacity     ? `до ${boat.capacity} чел.`  : null,
            boat.length_meters ? `${boat.length_meters} м`  : null,
          ].filter(Boolean).join(' · ')}
        </Text>
        <Text style={s.price}>
          <Text style={s.priceBold}>{ruNum(boat.price_per_hour)} ₽</Text>
          <Text style={s.priceUnit}> / час</Text>
        </Text>
      </View>
    </Pressable>
  );
});

const s = StyleSheet.create({
  card:     { width: CARD_W },
  imgWrap:  { height: IMG_H, borderRadius: 12, overflow: 'hidden', backgroundColor: COLORS.muted },
  info:     { paddingTop: 8, gap: 2 },
  nameRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  name:     { fontSize: 13, fontWeight: '700', color: '#000', flex: 1, marginRight: 4, lineHeight: 18 },
  ratingRow:{ flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 1 },
  ratingTxt:{ fontSize: 12, fontWeight: '600', color: '#000' },
  sub:      { fontSize: 12, color: '#888', lineHeight: 17 },
  price:    { marginTop: 1 },
  priceBold:{ fontSize: 12, fontWeight: '700', color: '#000' },
  priceUnit:{ fontSize: 12, color: '#888' },
});
