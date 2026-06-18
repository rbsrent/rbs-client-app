import { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '@/shared/colors';
import { publicSupabase } from '@/shared/supabase/publicClient';

import { RouteCard } from '../components/RouteCard';
import { getCachedRoutes, invalidateRoutesCache, setCachedRoutes } from '../store';
import { useFocusEffect } from 'expo-router';

import { VESSEL_FILTERS, WaterRoute } from '../types';

export function RoutesScreen() {
  const insets = useSafeAreaInsets();
  const [routes,      setRoutes]      = useState<WaterRoute[]>(() => getCachedRoutes() ?? []);
  const [loading,     setLoading]     = useState(() => !getCachedRoutes());
  const [refreshing,  setRefreshing]  = useState(false);
  const [filter,      setFilter]      = useState<'all' | 'boat' | 'yacht'>('all');

  const fetchRoutes = useCallback(async (force = false) => {
    if (!force) {
      const cached = getCachedRoutes();
      if (cached) { setRoutes(cached); setLoading(false); return; }
    }
    try {
      const { data } = await publicSupabase
        .from('water_routes')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      const list = (data as WaterRoute[]) ?? [];
      setCachedRoutes(list);
      setRoutes(list);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    fetchRoutes(false);
  }, [fetchRoutes]));

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    invalidateRoutesCache();
    fetchRoutes(true);
  }, [fetchRoutes]);

  const filtered = filter === 'all'
    ? routes
    : routes.filter((r) => r.vessel_type === filter || r.vessel_type === 'both' || !r.vessel_type);

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* header */}
      <View style={s.header}>
        <Text style={s.title}>Маршруты</Text>
        <Text style={s.subtitle}>По рекам и каналам Санкт-Петербурга</Text>
      </View>

      {/* filter chips */}
      <View style={s.filterRow}>
        {VESSEL_FILTERS.map((f) => (
          <Pressable
            key={f.key}
            style={[s.chip, filter === f.key && s.chipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[s.chipTxt, filter === f.key && s.chipTxtActive]}>
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={s.skeletonList}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={s.skeletonCard} />
          ))}
        </View>
      ) : (
        <Animated.View entering={FadeIn.duration(220)} style={{ flex: 1 }}>
          <FlatList
            data={filtered}
            keyExtractor={(r) => r.id}
            renderItem={({ item }) => <RouteCard route={item} />}
            contentContainerStyle={s.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={COLORS.brandNavy}
              />
            }
            ListEmptyComponent={
              <View style={s.empty}>
                <Text style={s.emptyText}>Маршруты не найдены</Text>
              </View>
            }
          />
        </Animated.View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },

  header: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 12 },
  title:    { fontSize: 28, fontWeight: '700', color: COLORS.text1, letterSpacing: -0.3 },
  subtitle: { fontSize: 13, color: COLORS.text3, marginTop: 3 },

  filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 16 },
  chip: {
    paddingHorizontal: 18, paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.muted,
  },
  chipActive:    { backgroundColor: COLORS.brandNavy },
  chipTxt:       { fontSize: 13, fontWeight: '600', color: COLORS.text2 },
  chipTxtActive: { color: '#fff' },

  list: { paddingHorizontal: 16, gap: 16, paddingBottom: 32 },

  skeletonList: { paddingHorizontal: 16, gap: 16 },
  skeletonCard: {
    height: 220, borderRadius: 16,
    backgroundColor: '#F0F0F0',
  },

  empty:     { paddingTop: 60, alignItems: 'center' },
  emptyText: { fontSize: 15, color: COLORS.text3 },
});
