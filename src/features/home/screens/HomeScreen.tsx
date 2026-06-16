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
import { useAuthStore } from '@/store/useAuthStore';

import { GiftCertCard } from '../components/GiftCertCard';
import { HeroCard } from '../components/HeroCard';
import { PopularSection } from '../components/PopularSection';
import { PromoBanner } from '../components/PromoBanner';
import { ServiceGrid } from '../components/ServiceGrid';
import { useHomeData } from '../hooks/useHomeData';

export const HomeScreen = memo(function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session, smsUser } = useAuthStore();
  const { heroSlides, isLoadingBoats, isLoadingSlides, refetch } = useHomeData();

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
  const topBarBorderOpacity = scrollY.interpolate({
    inputRange: [60, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const onScroll = useCallback(
    Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
      useNativeDriver: false,
    }),
    [],
  );

  return (
    <View style={styles.root}>
      {/* TopBar — transparent until scroll */}
      <Animated.View
        style={[
          styles.topBar,
          {
            paddingTop: insets.top + 8,
            backgroundColor: topBarBg,
            shadowOpacity: topBarShadow,
            borderBottomColor: topBarBorderOpacity.interpolate
              ? topBarBorderOpacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.07)'],
                })
              : 'rgba(0,0,0,0)',
          },
        ]}
      >
        <Pressable
          style={styles.searchBar}
          onPress={() => router.push('/boats' as any)}
        >
          <Search size={18} color="#8E8E8E" strokeWidth={2} />
          <Text style={styles.searchText}>Найти катер, яхту, маршрут...</Text>
        </Pressable>
        <Pressable
          style={styles.profileBtn}
          onPress={() => router.push(session ? '/profile' : '/auth' as any)}
        >
          {smsUser?.full_name ? (
            <Text style={styles.profileInitial}>{smsUser.full_name.charAt(0).toUpperCase()}</Text>
          ) : (
            <Text style={styles.profileInitialEmpty}>👤</Text>
          )}
        </Pressable>
      </Animated.View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={onScroll}
        refreshControl={
          <RefreshControl refreshing={isLoadingBoats} onRefresh={refetch} tintColor={COLORS.brandCyan} />
        }
      >
        {/* Welcome card — top, under transparent TopBar */}
        <View style={[styles.balanceSection, { paddingTop: insets.top + 64 }]}>
          <HeroCard session={session} smsUser={smsUser} />
        </View>

        {/* Service Grid */}
        <View style={styles.sectionBg}>
          <ServiceGrid />
        </View>

        {/* Hero banner */}
        <View style={styles.bannerSection}>
          {isLoadingSlides ? (
            <View style={styles.bannerSkeleton} />
          ) : (
            <PromoBanner slides={heroSlides} />
          )}
        </View>

        {/* Подарочный сертификат */}
        <View style={styles.giftSection}>
          <GiftCertCard />
        </View>

        {/* Популярные суда сейчас */}
        <PopularSection />
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F5F5' },

  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  searchText: { flex: 1, fontSize: 14, color: '#8E8E8E' },
  profileBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: { fontSize: 15, fontWeight: '700', color: COLORS.brandNavy },
  profileInitialEmpty: { fontSize: 16 },

  scroll: { flex: 1 },
  scrollContent: { gap: 0 },

  balanceSection: { paddingHorizontal: 16 },

  sectionBg: {
    backgroundColor: COLORS.white,
    marginTop: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },

  bannerSection: { paddingLeft: 16, marginTop: 20 },
  bannerSkeleton: {
    height: 139,
    width: 287,
    borderRadius: 16,
    backgroundColor: '#E8E8E8',
  },

  giftSection: { marginTop: 24 },
});
