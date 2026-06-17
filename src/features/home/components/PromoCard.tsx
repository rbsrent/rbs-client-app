import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Star } from 'lucide-react-native';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/shared/colors';
import { HeartButton } from '@/shared/components/HeartButton';
import { Boat } from '@/store/useCatalogStore';

const CARD_W = (Dimensions.get('window').width - 16 * 2 - 12) / 2;
const IMG_H  = Math.round(CARD_W * 1.05);

export function PromoCard({ boat }: { boat: Boat }) {
  const router  = useRouter();
  const hasRate = boat.rating !== null && boat.rating > 0;
  const ruNum   = (n: number) => new Intl.NumberFormat('ru-RU').format(Math.round(n));

  return (
    <Pressable
      style={({ pressed }) => [s.card, pressed && { opacity: 0.92 }]}
      onPress={() => router.push(`/booking/${boat.id}` as any)}
    >
      {/* Image with its own radius */}
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
        {boat.type ? (
          <View style={s.badge}>
            <Text style={s.badgeTxt}>{boat.type}</Text>
          </View>
        ) : null}
        <HeartButton boat={{
          boat_id: boat.id,
          name: boat.name,
          type: boat.type,
          cover_image_url: boat.cover_image_url,
          price_per_hour: boat.price_per_hour,
          capacity: boat.capacity,
          length_meters: boat.length_meters,
          pier_name: boat.pier_name,
          rating: boat.rating,
        }} />
      </View>

      {/* Text sits on page bg, no card container */}
      <View style={s.info}>
        <View style={s.nameRow}>
          <Text style={s.name} numberOfLines={2}>{boat.name}</Text>
          {hasRate ? (
            <View style={s.ratingRow}>
              <Star size={11} color="#F5A623" fill="#F5A623" strokeWidth={0} />
              <Text style={s.ratingTxt}>{boat.rating!.toFixed(2)}</Text>
            </View>
          ) : null}
        </View>

        <Text style={s.sub} numberOfLines={1}>
          {[
            boat.capacity ? `до ${boat.capacity} чел.` : null,
            boat.length_meters ? `${boat.length_meters} м` : null,
          ].filter(Boolean).join(' · ')}
        </Text>

        <Text style={s.price}>
          <Text style={s.priceBold}>{ruNum(boat.price_per_hour)} ₽</Text>
          <Text style={s.priceUnit}> / час</Text>
        </Text>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    flex: 1,
  },
  imgWrap: {
    height: IMG_H,
    borderRadius: 12,
    backgroundColor: COLORS.muted,
    overflow: 'hidden',
  },
  badge: {
    position: 'absolute', top: 8, left: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 20,
    paddingHorizontal: 9, paddingVertical: 4,
  },
  badgeTxt: { fontSize: 10, fontWeight: '600', color: COLORS.text1 },

  info:      { paddingTop: 8, gap: 2 },
  nameRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  name:      { fontSize: 13, fontWeight: '700', color: COLORS.text1, flex: 1, marginRight: 6, lineHeight: 18 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 1 },
  ratingTxt: { fontSize: 12, fontWeight: '600', color: COLORS.text1 },
  sub:       { fontSize: 12, color: COLORS.text3, lineHeight: 17 },
  price:     { marginTop: 1 },
  priceBold: { fontSize: 12, fontWeight: '700', color: COLORS.text1 },
  priceUnit: { fontSize: 12, color: COLORS.text3 },
});
