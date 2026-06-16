import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Star } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { COLORS } from '@/shared/colors';
import { SectionHeader } from '@/shared/components/SectionHeader';
import { publicSupabase, SUPABASE_URL } from '@/shared/supabase/publicClient';

const WEB_BASE = 'https://rbs.rent';

interface PopularBoat {
  boat_id: string;
  name: string;
  type: string | null;
  capacity: number | null;
  length_meters: number | null;
  price_per_hour: number;
  average_rating: number;
  total_reviews: number;
  pier_name: string | null;
  pier_address: string | null;
  badge_override: string | null;
  is_pinned: boolean;
  images: any;
}

const FILTERS = [
  { key: 'all', label: 'Все' },
  { key: 'boat', label: 'Катера' },
  { key: 'yacht', label: 'Яхты' },
] as const;

type FilterKey = typeof FILTERS[number]['key'];

function resolveCoverImage(images: any): string | null {
  try {
    const arr: any[] = Array.isArray(images) ? images : JSON.parse(images ?? '[]');
    const first = arr[0]?.image_path;
    if (!first) return null;
    if (first.startsWith('http')) return first;
    if (first.startsWith('/')) return `${WEB_BASE}${first}`;
    return `${SUPABASE_URL}/storage/v1/object/public/boat_images/${first}`;
  } catch {
    return null;
  }
}

function getBadge(boat: PopularBoat, index: number): string | null {
  if (boat.badge_override === 'top_choice' || index === 0) return 'Топ выбор';
  if (boat.badge_override === 'verified' || boat.is_pinned || index <= 2) return 'Verified';
  return 'Топ выбор';
}

function PopularBoatCard({ boat, index }: { boat: PopularBoat; index: number }) {
  const router = useRouter();
  const cover = resolveCoverImage(boat.images);
  const badge = getBadge(boat, index);
  const hasRating = boat.average_rating > 0;
  const ruNum = (n: number) => new Intl.NumberFormat('ru-RU').format(Math.round(n));

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.94 }]}
      onPress={() => router.push(`/catalog/${boat.boat_id}` as any)}
    >
      {/* Image */}
      <View style={styles.imageWrap}>
        {cover ? (
          <Image
            source={{ uri: cover }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.brandNavy }]} />
        )}
        {badge ? (
          <View style={[styles.badge, badge === 'Топ выбор' ? styles.badgeDark : styles.badgeLight]}>
            {badge !== 'Топ выбор' && <View style={styles.badgeDot} />}
            <Text style={[styles.badgeText, badge !== 'Топ выбор' && styles.badgeTextLight]}>
              {badge}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Meta */}
      <View style={styles.meta}>
        <View style={styles.cityRatingRow}>
          <Text style={styles.city}>Санкт-Петербург</Text>
          <View style={styles.ratingPill}>
            <Star size={11} color="#F5A623" fill="#F5A623" strokeWidth={0} />
            <Text style={styles.ratingText}>
              {hasRating ? boat.average_rating.toFixed(2) : '—'}
            </Text>
            {boat.total_reviews > 0 ? (
              <Text style={styles.reviewCount}>({boat.total_reviews})</Text>
            ) : null}
          </View>
        </View>

        <Text style={styles.name} numberOfLines={1}>{boat.name}</Text>

        <Text style={styles.specs} numberOfLines={1}>
          {[
            boat.capacity ? `до ${boat.capacity} гостей` : null,
            boat.length_meters ? `${boat.length_meters} м` : null,
          ].filter(Boolean).join(' · ')}
        </Text>

        <View style={styles.priceRow}>
          <Text style={styles.price}>{ruNum(boat.price_per_hour)} ₽</Text>
          <Text style={styles.priceUnit}> / час</Text>
        </View>
      </View>
    </Pressable>
  );
}

export function PopularSection() {
  const router = useRouter();
  const [boats, setBoats] = useState<PopularBoat[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await publicSupabase.rpc('get_popular_boats', { limit_count: 10 });
        if (!cancelled) setBoats((data as PopularBoat[]) ?? []);
      } catch {
        setBoats([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = boats.filter((b) => {
    if (activeFilter === 'all') return true;
    const t = (b.type ?? '').toLowerCase();
    if (activeFilter === 'boat') return t.includes('катер');
    if (activeFilter === 'yacht') return t.includes('яхт');
    return true;
  });

  return (
    <View style={styles.root}>
      <View style={styles.headerWrap}>
        <SectionHeader
          title="Популярные сейчас"
          sub="На основе бронирований за 30 дней"
          seeAllLabel="Все"
          onSeeAll={() => router.push('/boats' as any)}
        />
      </View>

      {/* Filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterStrip}
      >
        {FILTERS.map((f) => (
          <Pressable
            key={f.key}
            style={[styles.filterChip, activeFilter === f.key && styles.filterChipActive]}
            onPress={() => setActiveFilter(f.key)}
          >
            <Text style={[styles.filterLabel, activeFilter === f.key && styles.filterLabelActive]}>
              {f.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={COLORS.brandNavy} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.loader}>
          <Text style={styles.emptyText}>Суда не найдены</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {filtered.map((b, i) => (
            <PopularBoatCard key={b.boat_id} boat={b} index={i} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { marginTop: 24 },
  headerWrap: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  filterStrip: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.brandNavy,
    borderColor: COLORS.brandNavy,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text2,
  },
  filterLabelActive: {
    color: COLORS.white,
  },
  loader: {
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.text3,
  },
  list: {
    paddingHorizontal: 16,
    gap: 16,
  },

  // Card
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
    height: 200,
    backgroundColor: COLORS.muted,
    overflow: 'hidden',
  },
  badge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeDark: {
    backgroundColor: 'rgba(10,16,26,0.85)',
  },
  badgeLight: {
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.brandNavy,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
  },
  badgeTextLight: {
    color: COLORS.brandNavy,
  },
  meta: {
    padding: 14,
    gap: 5,
  },
  cityRatingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  city: {
    fontSize: 13,
    color: COLORS.text3,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text1,
  },
  reviewCount: {
    fontSize: 12,
    color: COLORS.text3,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text1,
    letterSpacing: 0.1,
  },
  specs: {
    fontSize: 13,
    color: COLORS.text3,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2,
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text1,
  },
  priceUnit: {
    fontSize: 13,
    color: COLORS.text3,
  },
});
