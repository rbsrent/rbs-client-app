import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MapPin, Ruler, Star, Users } from 'lucide-react-native';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { COLORS } from '@/shared/colors';
import { Boat } from '@/store/useCatalogStore';

export function PromoCard({ boat }: { boat: Boat }) {
  const router = useRouter();
  const dest = `/catalog/${boat.id}` as any;

  const hasRating = boat.rating !== null && boat.rating > 0;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.95 }]}
      onPress={() => router.push(dest)}
    >
      {/* Image */}
      <View style={styles.imageWrap}>
        {boat.cover_image_url ? (
          <Image
            source={{ uri: boat.cover_image_url }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        ) : (
          <LinearGradient
            colors={[COLORS.brandNavy, COLORS.brandCyan]}
            style={StyleSheet.absoluteFill}
          />
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.22)']}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* Body */}
      <View style={styles.body}>
        {/* Name + rating */}
        <Text style={styles.name} numberOfLines={1}>{boat.name}</Text>
        <View style={styles.ratingRow}>
          <Star size={13} color={hasRating ? '#F5A623' : COLORS.text3} fill={hasRating ? '#F5A623' : 'none'} strokeWidth={1.8} />
          {hasRating ? (
            <Text style={styles.ratingText}>
              {boat.rating!.toFixed(1)}
              {boat.review_count > 0 ? ` · ${boat.review_count} отзыва` : ''}
            </Text>
          ) : (
            <Text style={styles.ratingEmpty}>Пока нет отзывов</Text>
          )}
        </View>

        {/* Specs row */}
        <View style={styles.specsRow}>
          {boat.length_meters ? (
            <View style={styles.spec}>
              <Ruler size={12} color={COLORS.text3} strokeWidth={1.8} />
              <Text style={styles.specText}>{boat.length_meters} м</Text>
            </View>
          ) : null}
          {boat.capacity ? (
            <View style={styles.spec}>
              <Users size={12} color={COLORS.text3} strokeWidth={1.8} />
              <Text style={styles.specText}>{boat.capacity} чел.</Text>
            </View>
          ) : null}
          {boat.type ? (
            <Text style={styles.typeText}>Тип: {boat.type}</Text>
          ) : null}
        </View>

        {/* Pier */}
        {boat.pier_name ? (
          <View style={styles.pierRow}>
            <MapPin size={12} color={COLORS.text3} strokeWidth={1.8} />
            <Text style={styles.pierText} numberOfLines={2}>{boat.pier_name}</Text>
          </View>
        ) : null}

        {/* Footer: price + button */}
        <View style={styles.footer}>
          <Text style={styles.price}>
            {new Intl.NumberFormat('ru-RU').format(boat.price_per_hour)} ₽/час
          </Text>
          <Pressable
            style={({ pressed }) => [styles.bookBtn, pressed && { opacity: 0.85 }]}
            onPress={() => router.push(dest)}
            hitSlop={4}
          >
            <Text style={styles.bookBtnText}>Бронь</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  imageWrap: {
    height: 180,
    backgroundColor: COLORS.muted,
    overflow: 'hidden',
  },
  body: {
    padding: 14,
    gap: 6,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text1,
    letterSpacing: 0.1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  ratingText: {
    fontSize: 12,
    color: COLORS.text2,
    fontWeight: '500',
  },
  ratingEmpty: {
    fontSize: 12,
    color: COLORS.text3,
  },
  specsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  spec: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  specText: {
    fontSize: 12,
    color: COLORS.text2,
  },
  typeText: {
    fontSize: 12,
    color: COLORS.text2,
  },
  pierRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
  },
  pierText: {
    fontSize: 12,
    color: COLORS.text3,
    flex: 1,
    lineHeight: 17,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.brandNavy,
  },
  bookBtn: {
    backgroundColor: COLORS.brandNavy,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 9,
  },
  bookBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
});
