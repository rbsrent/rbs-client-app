import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Anchor, Users, Ruler, MapPin, Star, Wifi, Wind } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '@/shared/colors';
import { publicSupabase, SUPABASE_URL } from '@/shared/supabase/publicClient';
import { formatRub } from '@/shared/utils/currency';

export default function BoatDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [boat, setBoat] = useState<any>(null);
  const [images, setImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true);
      try {
        const { data } = await publicSupabase
          .from('boats')
          .select(`*, boat_images(image_path, position), piers(name, address)`)
          .eq('id', id)
          .single();
        if (data) {
          setBoat(data);
          const sorted = (data.boat_images ?? []).sort((a: any, b: any) => a.position - b.position);
          setImages(sorted.map((i: any) => `${SUPABASE_URL}/storage/v1/object/public/boat_images/${i.image_path}`));
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (isLoading) {
    return (
      <View style={[styles.loading, { paddingTop: insets.top }]}>
        <ActivityIndicator color={COLORS.brandCyan} size="large" />
      </View>
    );
  }

  if (!boat) return null;

  const amenities = [
    { key: 'has_tarp', label: 'Тент', icon: Wind },
    { key: 'has_heating', label: 'Отопление', icon: Wind },
    { key: 'has_toilet', label: 'Туалет', icon: Wind },
    { key: 'has_covered_saloon', label: 'Салон', icon: Wind },
    { key: 'has_bluetooth', label: 'Bluetooth', icon: Wifi },
  ].filter((a) => boat[a.key]);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        <View style={styles.imageSection}>
          {images[0] ? (
            <Image source={{ uri: images[0] }} style={styles.mainImage} contentFit="cover" />
          ) : (
            <LinearGradient colors={[COLORS.brandNavy, COLORS.brandCyan]} style={styles.mainImage} />
          )}
          <LinearGradient colors={['rgba(0,0,0,0.4)', 'transparent', 'transparent', 'rgba(0,0,0,0.3)']} style={StyleSheet.absoluteFill} />
          <Pressable
            style={[styles.backBtn, { top: insets.top + 8 }]}
            onPress={() => router.back()}
            hitSlop={8}
          >
            <ArrowLeft size={22} color={COLORS.white} strokeWidth={2} />
          </Pressable>
        </View>

        <View style={styles.content}>
          <View style={styles.headerRow}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>{boat.type}</Text>
            </View>
          </View>

          <Text style={styles.name}>{boat.name}</Text>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Users size={16} color={COLORS.brandCyan} strokeWidth={2} />
              <Text style={styles.statText}>{boat.capacity} чел.</Text>
            </View>
            {boat.length_meters ? (
              <View style={styles.stat}>
                <Ruler size={16} color={COLORS.brandCyan} strokeWidth={2} />
                <Text style={styles.statText}>{boat.length_meters} м</Text>
              </View>
            ) : null}
            {boat.piers?.name ? (
              <View style={styles.stat}>
                <MapPin size={16} color={COLORS.brandCyan} strokeWidth={2} />
                <Text style={styles.statText} numberOfLines={1}>{boat.piers.name}</Text>
              </View>
            ) : null}
          </View>

          {boat.description ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Описание</Text>
              <Text style={styles.description}>{boat.description}</Text>
            </View>
          ) : null}

          {amenities.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Удобства</Text>
              <View style={styles.amenitiesGrid}>
                {amenities.map((a) => (
                  <View key={a.key} style={styles.amenityItem}>
                    <Text style={styles.amenityText}>{a.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.priceSection}>
            <View>
              <Text style={styles.priceLabel}>Стоимость аренды</Text>
              <Text style={styles.price}>{formatRub(boat.price_per_hour)}/час</Text>
              {boat.public_price_per_hour_night ? (
                <Text style={styles.priceNight}>Ночью: {formatRub(boat.public_price_per_hour_night)}/час</Text>
              ) : null}
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bookingBar, { paddingBottom: insets.bottom + 8 }]}>
        <View>
          <Text style={styles.bookingPrice}>{formatRub(boat.price_per_hour)}</Text>
          <Text style={styles.bookingUnit}>за час</Text>
        </View>
        <Pressable
          style={styles.bookBtn}
          onPress={() => router.push(`/booking/${boat.id}` as any)}
        >
          <LinearGradient
            colors={[COLORS.brandCyan, COLORS.brandViolet]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.bookBtnGrad}
          >
            <Text style={styles.bookBtnText}>Забронировать</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.white },
  imageSection: { height: 280, position: 'relative' },
  mainImage: { width: '100%', height: 280 },
  backBtn: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { padding: 20, gap: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  typeBadge: {
    backgroundColor: COLORS.brandCyan + '20',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  typeText: { fontSize: 12, color: COLORS.brandCyan, fontWeight: '600' },
  name: { fontSize: 24, fontWeight: '800', color: COLORS.text1 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { fontSize: 14, color: COLORS.text2 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text1 },
  description: { fontSize: 14, color: COLORS.text2, lineHeight: 20 },
  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  amenityItem: {
    backgroundColor: COLORS.backgroundAlt,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  amenityText: { fontSize: 13, color: COLORS.text2 },
  priceSection: { backgroundColor: COLORS.backgroundAlt, borderRadius: 14, padding: 16 },
  priceLabel: { fontSize: 12, color: COLORS.text3, marginBottom: 4 },
  price: { fontSize: 22, fontWeight: '800', color: COLORS.brandNavy },
  priceNight: { fontSize: 12, color: COLORS.text2, marginTop: 2 },
  bookingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  bookingPrice: { fontSize: 20, fontWeight: '800', color: COLORS.brandNavy },
  bookingUnit: { fontSize: 12, color: COLORS.text3 },
  bookBtn: { flex: 1, marginLeft: 16, borderRadius: 14, overflow: 'hidden' },
  bookBtnGrad: { paddingVertical: 14, alignItems: 'center' },
  bookBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});
