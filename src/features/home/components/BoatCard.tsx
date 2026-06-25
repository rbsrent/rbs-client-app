import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MapPin, Star, Users } from 'lucide-react-native';
import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { COLORS } from '@/shared/colors';
import { getBoatPriceInfo } from '@/shared/utils/boatPrice';
import { Boat } from '@/store/useCatalogStore';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props {
  boat: Boat;
  width?: number;
}

const _RU_FMT = new Intl.NumberFormat('ru-RU');

export const BoatCard = memo(function BoatCard({ boat, width }: Props) {
  const router = useRouter();
  const scale = useSharedValue(1);
  const { displayPrice } = getBoatPriceInfo(boat.price_per_hour, boat.public_price_per_hour_night);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    router.push(`/catalog/${boat.id}` as any);
  };

  return (
    <AnimatedPressable
      style={[styles.card, animStyle, width != null ? { width } : undefined]}
      onPressIn={() => { scale.value = withSpring(0.97, { damping: 15 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
      onPress={handlePress}
    >
      <View style={styles.imageContainer}>
        {boat.cover_image_url ? (
          <Image
            source={{ uri: boat.cover_image_url }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <LinearGradient
            colors={[COLORS.brandNavy, COLORS.brandCyan]}
            style={StyleSheet.absoluteFill}
          />
        )}
        <LinearGradient
          colors={['transparent', 'rgba(11,17,32,0.5)']}
          style={styles.imageOverlay}
        />
        {boat.rating != null && boat.rating >= 4 ? (
          <View style={styles.topBadgeRow}>
            <View style={styles.ratingBadge}>
              <Text style={styles.typeBadgeText}>лучшие отзывы</Text>
            </View>
            {boat.rating >= 5 && (
              <View style={styles.hitBadge}>
                <Text style={styles.typeBadgeText}>хит</Text>
              </View>
            )}
          </View>
        ) : boat.type ? (
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{boat.type}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{boat.name}</Text>

        <View style={styles.meta}>
          {boat.pier_name ? (
            <View style={styles.metaRow}>
              <MapPin size={11} color={COLORS.text3} strokeWidth={2} />
              <Text style={styles.metaText} numberOfLines={1}>{boat.pier_name}</Text>
            </View>
          ) : null}
          <View style={styles.metaRow}>
            <Users size={11} color={COLORS.text3} strokeWidth={2} />
            <Text style={styles.metaText}>{boat.capacity} чел.</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <View>
            <Text style={styles.price}>
              {_RU_FMT.format(displayPrice)} ₽
            </Text>
            <Text style={styles.perHour}>/час</Text>
          </View>
          {boat.rating != null ? (
            <View style={styles.rating}>
              <Star size={11} color={COLORS.warning} fill={COLORS.warning} strokeWidth={0} />
              <Text style={styles.ratingText}>{boat.rating.toFixed(1)}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </AnimatedPressable>
  );
});

const styles = StyleSheet.create({
  card: {
    width: 200,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    height: 130,
    overflow: 'hidden',
  },
  image: {
    ...StyleSheet.absoluteFill,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFill,
  },
  topBadgeRow: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 4,
  },
  typeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(11,17,32,0.6)',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  typeBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '600',
  },
  ratingBadge: {
    backgroundColor: 'rgba(37,160,119,0.85)',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  hitBadge: {
    backgroundColor: 'rgba(230,126,34,0.9)',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  info: {
    padding: 12,
    gap: 4,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text1,
  },
  meta: {
    gap: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 11,
    color: COLORS.text3,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 4,
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.brandNavy,
  },
  perHour: {
    fontSize: 10,
    color: COLORS.text3,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text2,
  },
});
