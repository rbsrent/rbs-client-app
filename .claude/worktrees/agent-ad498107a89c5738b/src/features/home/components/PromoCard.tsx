import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
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
  return (
    <Pressable
      style={styles.promoCard}
      onPress={() => router.push(`/catalog/${boat.id}` as any)}
    >
      <View style={styles.promoImageWrap}>
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
          colors={['transparent', 'rgba(11,17,32,0.25)']}
          style={StyleSheet.absoluteFill}
        />
      </View>
      <View style={styles.promoCardBody}>
        <View style={styles.promoCardTop}>
          <View style={styles.promoTypeBadge}>
            <Text style={styles.promoTypeText}>{boat.type}</Text>
          </View>
        </View>
        <Text style={styles.promoTitle} numberOfLines={1}>{boat.name}</Text>
        <Text style={styles.promoSub} numberOfLines={1}>
          {boat.pier_name ?? 'Санкт-Петербург'}
        </Text>
        <View style={styles.promoFooter}>
          <Text style={styles.promoPrice}>
            от {new Intl.NumberFormat('ru-RU').format(boat.price_per_hour)} ₽/ч
          </Text>
          <Pressable
            style={styles.promoBtn}
            onPress={() => router.push(`/catalog/${boat.id}` as any)}
          >
            <Text style={styles.promoBtnText}>Смотреть</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  promoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    shadowColor: '#BBBBBB',
    shadowOffset: { width: 1, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  promoImageWrap: {
    height: 170,
    backgroundColor: '#7C7C7C',
    overflow: 'hidden',
  },
  promoCardBody: {
    padding: 16,
    gap: 4,
  },
  promoCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  promoTypeBadge: {
    backgroundColor: COLORS.brandCyan + '20',
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  promoTypeText: {
    fontSize: 11,
    color: COLORS.brandCyan,
    fontWeight: '600',
  },
  promoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1D1D1D',
    letterSpacing: 0.001,
  },
  promoSub: {
    fontSize: 14,
    color: '#4A4A4A',
    lineHeight: 17,
    letterSpacing: 0.4,
  },
  promoFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  promoPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.brandNavy,
  },
  promoBtn: {
    backgroundColor: COLORS.brandNavy,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  promoBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
});
