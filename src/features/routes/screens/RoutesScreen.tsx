import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '@/shared/colors';
import { publicSupabase } from '@/shared/supabase/publicClient';
import { isRoutesStale, useRoutesStore } from '@/store/useRoutesStore';

import { RouteCard } from '../components/RouteCard';
import { WaterRoute } from '../types';

export function RoutesScreen() {
  const insets = useSafeAreaInsets();
  const { routes, loading, setRoutes, setLoading, invalidate } = useRoutesStore();
  const [refreshing, setRefreshing] = useState(false);
  const fetchingRef = useRef(false);

  const fetchRoutes = useCallback(async (force = false) => {
    if (!force && !isRoutesStale()) return;
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const { data } = await publicSupabase
        .from('water_routes')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      setRoutes((data as WaterRoute[]) ?? []);
    } catch {
      setLoading(false);
    } finally {
      setRefreshing(false);
      fetchingRef.current = false;
    }
  }, [setRoutes, setLoading]);

  useEffect(() => {
    fetchRoutes(false);
  }, []); // Zustand state persists across tab switches — no re-fetch on focus

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    invalidate();
    fetchRoutes(true);
  }, [fetchRoutes, invalidate]);

  const renderRoute = useCallback(
    ({ item }: { item: WaterRoute }) => <RouteCard route={item} />,
    [],
  );

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Text style={s.title}>Маршруты</Text>
        <Text style={s.subtitle}>По рекам и каналам Санкт-Петербурга</Text>
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
            data={routes}
            keyExtractor={(r) => r.id}
            renderItem={renderRoute}
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

  list: { paddingHorizontal: 16, gap: 16, paddingBottom: 32 },

  skeletonList: { paddingHorizontal: 16, gap: 16 },
  skeletonCard: {
    height: 220, borderRadius: 16,
    backgroundColor: '#F0F0F0',
  },

  empty:     { paddingTop: 60, alignItems: 'center' },
  emptyText: { fontSize: 15, color: COLORS.text3 },
});
