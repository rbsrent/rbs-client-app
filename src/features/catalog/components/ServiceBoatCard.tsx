import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MapPin, Users } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/shared/colors';
import { Boat } from '@/store/useCatalogStore';

export function ServiceBoatCard({ boat }: { boat: Boat }) {
  const router = useRouter();

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.93 }]}
      onPress={() => router.push(`/booking/${boat.id}` as any)}
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
            colors={[COLORS.brandNavy, '#1A5C72']}
            style={StyleSheet.absoluteFill}
          />
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.18)']}
          style={StyleSheet.absoluteFill}
        />
        {boat.type ? (
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{boat.type}</Text>
          </View>
        ) : null}
      </View>

      {/* Body */}
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>{boat.name}</Text>

        <View style={styles.metaRow}>
          {boat.pier_name ? (
            <View style={styles.metaItem}>
              <MapPin size={12} color={COLORS.text3} strokeWidth={1.8} />
              <Text style={styles.metaText} numberOfLines={1}>{boat.pier_name}</Text>
            </View>
          ) : null}
          {boat.capacity ? (
            <View style={styles.metaItem}>
              <Users size={12} color={COLORS.text3} strokeWidth={1.8} />
              <Text style={styles.metaText}>{boat.capacity} чел.</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.footer}>
          <View>
            <Text style={styles.priceLabel}>от</Text>
            <Text style={styles.price}>
              {new Intl.NumberFormat('ru-RU').format(boat.price_per_hour)} ₽/ч
            </Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.bookBtn, pressed && { opacity: 0.85 }]}
            onPress={() => router.push(`/booking/${boat.id}` as any)}
            hitSlop={4}
          >
            <Text style={styles.bookBtnText}>Забронировать</Text>
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
    height: 186,
    backgroundColor: COLORS.muted,
    overflow: 'hidden',
  },
  typeBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 7,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  typeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  body: {
    padding: 14,
    gap: 6,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text1,
    letterSpacing: 0.1,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.text3,
    maxWidth: 130,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  priceLabel: {
    fontSize: 10,
    color: COLORS.text3,
    lineHeight: 13,
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.brandNavy,
    letterSpacing: 0.1,
  },
  bookBtn: {
    backgroundColor: COLORS.brandNavy,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  bookBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
});
