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
import { publicSupabase } from '@/shared/supabase/publicClient';

import { RouteCard } from '../components/RouteCard';
import { VESSEL_FILTERS, WaterRoute } from '../types';

export function RoutesScreen() {
  const insets = useSafeAreaInsets();
  const [routes, setRoutes] = useState<WaterRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'boat' | 'yacht'>('all');

  const fetchRoutes = async () => {
    setLoading(true);
    try {
      const { data } = await publicSupabase
        .from('water_routes')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      setRoutes((data as WaterRoute[]) ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRoutes(); }, []);

  const filtered = filter === 'all'
    ? routes
    : routes.filter((r) => r.vessel_type === filter || r.vessel_type === 'both' || !r.vessel_type);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Маршруты</Text>
        <Text style={styles.subtitle}>По рекам и каналам Санкт-Петербурга</Text>
      </View>

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {VESSEL_FILTERS.map((f) => (
          <Pressable
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={COLORS.brandNavy} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(r) => r.id}
          renderItem={({ item }) => <RouteCard route={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchRoutes} tintColor={COLORS.brandNavy} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Маршруты не найдены</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.white },

  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text1,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.text2,
    marginTop: 2,
  },

  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: COLORS.muted,
  },
  filterChipActive: {
    backgroundColor: COLORS.brandNavy,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text2,
  },
  filterTextActive: {
    color: COLORS.white,
  },

  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: 16, gap: 12, paddingBottom: 24 },

  empty: { paddingTop: 60, alignItems: 'center' },
  emptyText: { fontSize: 15, color: COLORS.text3 },
});
