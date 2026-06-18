import { useRouter } from 'expo-router';
import { Search } from 'lucide-react-native';
import { memo, useCallback, useRef } from 'react';
import {
  Animated,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '@/shared/colors';
import { useHomeStore } from '@/store/useHomeStore';

import { GiftCertCard } from '../components/GiftCertCard';
import { PromoBanner } from '../components/PromoBanner';
import { ServiceGrid } from '../components/ServiceGrid';
import { PopularBoatsSection } from '../components/sections/PopularBoatsSection';
import { RoutesPreviewSection } from '../components/sections/RoutesPreviewSection';
import { useHomePageData } from '../hooks/useHomePageData';

export const HomeScreen = memo(function HomeScreen() {
  const insets  = useSafeAreaInsets();
  const router  = useRouter();
  const { popular, katera, yakhty, routes, slides, loading } = useHomePageData();
  const setLoading  = useHomeStore((s) => s.setLoading);
  const lastFetch   = useHomeStore((s) => s.lastFetch);
  const isFirstLoad = loading && lastFetch === null;

  const scrollY = useRef(new Animated.Value(0)).current;

  const topBarBg = scrollY.interpolate({
    inputRange: [0, 50, 120],
    outputRange: ['rgba(255,255,255,0)', 'rgba(255,255,255,0.85)', 'rgba(255,255,255,1)'],
    extrapolate: 'clamp',
  });
  const topBarShadow = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 0.07],
    extrapolate: 'clamp',
  });
  const topBarBorderColor = scrollY.interpolate({
    inputRange: [60, 100],
    outputRange: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.07)'],
    extrapolate: 'clamp',
  });

  const onScroll = useCallback(
    Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
      useNativeDriver: false,
    }),
    [],
  );

  const refetch = useCallback(() => {
    useHomeStore.setState({ lastFetch: null });
    setLoading(true);
  }, []);

  return (
    <View style={s.root}>
      <Animated.View
        style={[
          s.topBar,
          {
            paddingTop: insets.top + 8,
            backgroundColor: topBarBg,
            shadowOpacity: topBarShadow,
            borderBottomColor: topBarBorderColor,
          },
        ]}
      >
        <Pressable
          style={s.searchBar}
          onPress={() => router.push('/boats' as any)}
        >
          <Search size={18} color="#8E8E8E" strokeWidth={2} />
          <Text style={s.searchText}>Найти катер, яхту, маршрут...</Text>
        </Pressable>
      </Animated.View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        removeClippedSubviews
        onScroll={onScroll}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refetch} tintColor={COLORS.brandCyan} />
        }
      >
        {/* Service Grid */}
        <View style={[s.sectionBg, { paddingTop: insets.top + 72 }]}>
          <ServiceGrid />
        </View>

        {/* Hero banner */}
        <View style={s.bannerSection}>
          <PromoBanner slides={slides} />
        </View>

        {/* Подарочный сертификат */}
        <View style={s.giftSection}>
          <GiftCertCard />
        </View>

        {/* Куда отправиться */}
        <RoutesPreviewSection routes={routes} loading={isFirstLoad} />

        {/* Популярные суда */}
        <View style={s.popularSection}>
          <PopularBoatsSection popular={popular} katera={katera} yakhty={yakhty} loading={isFirstLoad} />
        </View>
      </ScrollView>
    </View>
  );
});

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F5F5' },

  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8, elevation: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    gap: 10, backgroundColor: '#F0F0F0',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 11,
  },
  searchText: { flex: 1, fontSize: 14, color: '#8E8E8E' },

  scroll:        { flex: 1 },
  scrollContent: { gap: 0 },

  sectionBg: {
    backgroundColor: COLORS.white,
    paddingVertical: 16, paddingHorizontal: 16,
  },
  bannerSection:  { paddingLeft: 16, marginTop: 20 },
  giftSection:    { marginTop: 24 },
  popularSection: { marginTop: 24 },
});
