import { SlidersHorizontal } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '@/shared/colors';
import { ScreenHeader } from '@/shared/components/ScreenHeader';
import { publicSupabase, SUPABASE_URL } from '@/shared/supabase/publicClient';
import { Boat } from '@/store/useCatalogStore';

import { ServiceBoatCard } from '../components/ServiceBoatCard';

type VesselType = 'boat' | 'yacht';

const CONFIG: Record<VesselType, { title: string; subtitle: string; typeFilter: string }> = {
  boat: {
    title: 'Катера',
    subtitle: 'Аренда катеров в Санкт-Петербурге',
    typeFilter: 'катер',
  },
  yacht: {
    title: 'Яхты',
    subtitle: 'Аренда яхт в Санкт-Петербурге',
    typeFilter: 'яхта',
  },
};

interface Props {
  vesselType: VesselType;
}

export function BoatServiceScreen({ vesselType }: Props) {
  const insets = useSafeAreaInsets();
  const cfg = CONFIG[vesselType];

  const [boats, setBoats] = useState<Boat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBoats = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const { data } = await publicSupabase
        .from('boats')
        .select(`
          id, name, type, capacity, length_meters,
          price_per_hour, public_price_per_hour_night,
          pier_id, seo_slug,
          has_tarp, has_heating, has_toilet,
          boat_images(image_path, position),
          piers(name)
        `)
        .ilike('type', `%${cfg.typeFilter}%`)
        .eq('moderation_status', 'approved')
        .eq('is_hidden', false)
        .order('display_order', { ascending: true });

      const mapped: Boat[] = ((data ?? []) as any[]).map((b) => {
        const sorted = (b.boat_images ?? []).sort((a: any, z: any) => a.position - z.position);
        const firstImg = sorted[0]?.image_path ?? null;
        return {
          id: b.id,
          name: b.name,
          type: b.type,
          capacity: b.capacity,
          length_meters: b.length_meters,
          price_per_hour: b.price_per_hour,
          public_price_per_hour_night: b.public_price_per_hour_night,
          public_price_per_hour_weekend: null,
          pier_id: b.pier_id,
          pier_name: b.piers?.name ?? null,
          seo_slug: b.seo_slug,
          promo_video_url: null,
          cover_image_url: firstImg
            ? `${SUPABASE_URL}/storage/v1/object/public/boat_images/${firstImg}`
            : null,
          rating: null,
          review_count: 0,
          has_tarp: b.has_tarp ?? false,
          has_heating: b.has_heating ?? false,
          has_toilet: b.has_toilet ?? false,
          has_covered_saloon: b.has_covered_saloon ?? false,
          has_bluetooth: b.has_bluetooth ?? false,
        };
      });

      setBoats(mapped);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchBoats(); }, [vesselType]);

  return (
    <View style={styles.root}>
      <ScreenHeader
        title={cfg.title}
        right={<SlidersHorizontal size={20} color={COLORS.text2} strokeWidth={1.8} />}
      />

      {/* Subtitle + count */}
      {!loading && (
        <View style={styles.countRow}>
          <Text style={styles.countSub}>{cfg.subtitle}</Text>
          <Text style={styles.countText}>{boats.length} судов</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={COLORS.brandNavy} size="large" />
        </View>
      ) : (
        <FlatList
          data={boats}
          keyExtractor={(b) => b.id}
          renderItem={({ item }) => <ServiceBoatCard boat={item} />}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 90 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchBoats(true)}
              tintColor={COLORS.brandNavy}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Суда не найдены</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.backgroundAlt },

  countRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  countSub: { fontSize: 13, color: COLORS.text3 },
  countText: { fontSize: 13, color: COLORS.text3, fontWeight: '600' },

  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: 16, paddingTop: 4, gap: 12 },
  empty: { paddingTop: 80, alignItems: 'center' },
  emptyText: { fontSize: 15, color: COLORS.text3 },
});
