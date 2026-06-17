import { useLocalSearchParams, useRouter } from 'expo-router';
import { MapPin, Ruler, Users } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '@/shared/colors';
import { publicSupabase, SUPABASE_URL } from '@/shared/supabase/publicClient';
import { addToRecentlyViewed } from '@/shared/wishlist';

import BoatBookingBar from '@/features/catalog/components/BoatBookingBar';
import BoatImageSwiper from '@/features/catalog/components/BoatImageSwiper';
import BoatReviews from '@/features/catalog/components/BoatReviews';
import BoatSpecs from '@/features/catalog/components/BoatSpecs';
import SimilarBoats from '@/features/catalog/components/SimilarBoats';

export default function BoatDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [boat, setBoat] = useState<any>(null);
  const [images, setImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [similar, setSimilar] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewRating, setReviewRating] = useState({ avg: 0, total: 0 });

  /* main data fetch */
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      try {
        const { data } = await publicSupabase
          .from('boats')
          .select('*, boat_images(image_path, position), piers(name, address)')
          .eq('id', id)
          .single();
        if (cancelled || !data) return;
        setBoat(data);
        const sorted = [...(data.boat_images ?? [])].sort(
          (a: any, b: any) => a.position - b.position,
        );
        const coverPath = sorted[0]?.image_path;
        setImages(
          sorted.map(
            (img: any) =>
              `${SUPABASE_URL}/storage/v1/object/public/boat_images/${img.image_path}`,
          ),
        );
        addToRecentlyViewed({
          boat_id: data.id,
          name: data.name,
          type: data.type ?? null,
          cover_image_url: coverPath
            ? `${SUPABASE_URL}/storage/v1/object/public/boat_images/${coverPath}`
            : null,
          price_per_hour: data.price_per_hour,
          capacity: data.capacity ?? null,
          length_meters: data.length_meters ?? null,
          pier_name: data.piers?.name ?? null,
          rating: null,
        });
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [id]);

  /* secondary fetches — run once after boat loads */
  useEffect(() => {
    if (!boat) return;
    let cancelled = false;

    const fetchReviews = async () => {
      const { data } = await publicSupabase
        .from('boat_reviews')
        .select('id, user_name, rating, comment, created_at')
        .eq('boat_id', boat.id)
        .eq('moderation_status', 'approved')
        .order('created_at', { ascending: false })
        .limit(20);
      if (!cancelled && data) setReviews(data);

      const { data: rpc } = await publicSupabase.rpc('get_boat_average_rating', {
        p_boat_id: boat.id,
      });
      if (!cancelled && rpc?.[0]) {
        setReviewRating({
          avg: rpc[0].average_rating ?? 0,
          total: rpc[0].total_reviews ?? 0,
        });
      }
    };

    const fetchSimilar = async () => {
      const price = boat.price_per_hour;
      let { data } = await publicSupabase
        .from('boats')
        .select('id, name, price_per_hour, capacity, boat_images(image_path, position)')
        .neq('id', boat.id)
        .eq('is_hidden', false)
        .eq('moderation_status', 'approved')
        .gte('price_per_hour', Math.max(0, price - 5000))
        .lte('price_per_hour', price + 5000)
        .order('price_per_hour', { ascending: true })
        .limit(10);

      if (!data || data.length < 4) {
        const { data: fallback } = await publicSupabase
          .from('boats')
          .select('id, name, price_per_hour, capacity, boat_images(image_path, position)')
          .neq('id', boat.id)
          .eq('is_hidden', false)
          .eq('moderation_status', 'approved')
          .order('created_at', { ascending: false })
          .limit(10);
        data = fallback;
      }

      if (!cancelled && data) {
        const processed = data.map((b: any) => {
          const imgs = [...(b.boat_images ?? [])].sort(
            (a: any, b2: any) => a.position - b2.position,
          );
          const _cover = imgs[0]
            ? `${SUPABASE_URL}/storage/v1/object/public/boat_images/${imgs[0].image_path}`
            : null;
          return { ...b, _cover };
        });
        setSimilar(processed);
      }
    };

    fetchReviews();
    fetchSimilar();
    return () => { cancelled = true; };
  }, [boat?.id]);

  const handleSimilarPress = useCallback(
    (boatId: string) => {
      router.push(`/catalog/${boatId}` as any);
    },
    [router],
  );

  const handleReviewSubmitted = useCallback(() => {
    // Review is pending moderation — no immediate list refresh needed
  }, []);

  /* ── render ── */
  return (
    <View style={s.root}>
      {isLoading ? (
        <View style={[s.loading, { paddingTop: insets.top }]}>
          <ActivityIndicator color={COLORS.brandCyan} size="large" />
        </View>
      ) : boat ? (
        <Animated.View entering={FadeIn.duration(250)} style={{ flex: 1 }}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
            >
              {/* IMAGE SWIPER */}
              <BoatImageSwiper
                images={images}
                boatName={boat.name}
                onBack={() => router.back()}
                boat={{
                  boat_id: boat.id,
                  name: boat.name,
                  type: boat.type ?? null,
                  cover_image_url: images[0] ?? null,
                  price_per_hour: boat.price_per_hour,
                  capacity: boat.capacity ?? null,
                  length_meters: boat.length_meters ?? null,
                  pier_name: boat.piers?.name ?? null,
                  rating: null,
                }}
              />

              {/* MAIN CONTENT */}
              <View style={s.content}>
                {boat.type ? (
                  <View style={s.typeBadge}>
                    <Text style={s.typeText}>{boat.type}</Text>
                  </View>
                ) : null}

                <Text style={s.name}>{boat.name}</Text>

                {/* quick stats */}
                <View style={s.statsRow}>
                  {boat.capacity ? (
                    <View style={s.stat}>
                      <Users size={15} color={COLORS.brandCyan} strokeWidth={2} />
                      <Text style={s.statText}>{boat.capacity} чел.</Text>
                    </View>
                  ) : null}
                  {boat.length_meters ? (
                    <View style={s.stat}>
                      <Ruler size={15} color={COLORS.brandCyan} strokeWidth={2} />
                      <Text style={s.statText}>{boat.length_meters} м</Text>
                    </View>
                  ) : null}
                  {boat.piers?.name ? (
                    <View style={s.stat}>
                      <MapPin size={15} color={COLORS.brandCyan} strokeWidth={2} />
                      <Text style={s.statText} numberOfLines={1}>{boat.piers.name}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Описание */}
                {boat.description ? (
                  <View style={s.section}>
                    <Text style={s.sectionTitle}>Описание</Text>
                    <Text style={s.description}>{boat.description}</Text>
                  </View>
                ) : null}

                {/* Характеристики */}
                <BoatSpecs boat={boat} />
              </View>

              {/* ПОХОЖИЕ КАТЕРА */}
              <SimilarBoats boats={similar} onPress={handleSimilarPress} />

              {/* ОТЗЫВЫ */}
              <View style={s.content}>
                <BoatReviews
                  boatId={id as string}
                  averageRating={reviewRating.avg}
                  totalReviews={reviewRating.total}
                  reviews={reviews}
                  onReviewSubmitted={handleReviewSubmitted}
                />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>

          {/* BOOKING BAR */}
          <BoatBookingBar
            pricePerHour={boat.price_per_hour}
            priceNight={boat.public_price_per_hour_night}
            onBook={() => router.push(`/booking/${boat.id}` as any)}
            paddingBottom={insets.bottom + 8}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.white },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  content: { padding: 20, gap: 16 },
  typeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.brandCyan + '1A',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  typeText: { fontSize: 12, color: COLORS.brandCyan, fontWeight: '600' },
  name: { fontSize: 24, fontWeight: '800', color: COLORS.text1, lineHeight: 30 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { fontSize: 14, color: COLORS.text2 },

  section: { gap: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text1 },
  description: { fontSize: 14, color: COLORS.text2, lineHeight: 21 },
});
