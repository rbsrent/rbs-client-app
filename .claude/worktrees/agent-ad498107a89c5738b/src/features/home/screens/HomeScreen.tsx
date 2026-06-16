import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Bell,
  Search,
} from 'lucide-react-native';
import React, { memo, useMemo } from 'react';
import {
  ActivityIndicator,
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

import { BalanceCard } from '../components/BalanceCard';
import { FilterChips } from '../components/FilterChips';
import { PromoCard } from '../components/PromoCard';
import { PromoBanner } from '../components/PromoBanner';
import { ServiceGrid } from '../components/ServiceGrid';
import { useHomeData } from '../hooks/useHomeData';

export const HomeScreen = memo(function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session, smsUser } = useAuthStore();
  const { boats, heroSlides, isLoadingBoats, isLoadingSlides, refetch } = useHomeData();

  const featuredBoats = useMemo(() => boats.slice(0, 6), [boats]);

  return (
    <View style={styles.root}>
      {/* Top status / search bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <LinearGradient
          colors={[COLORS.white, COLORS.white]}
          style={StyleSheet.absoluteFill}
        />
        <Pressable
          style={styles.searchBar}
          onPress={() => router.push('/catalog' as any)}
        >
          <Search size={18} color="#8E8E8E" strokeWidth={2} />
          <Text style={styles.searchText}>Найти катер, яхту, маршрут...</Text>
        </Pressable>
        <Pressable
          style={styles.profileBtn}
          onPress={() => session ? router.push('/(tabs)/profile' as any) : router.push('/auth' as any)}
        >
          {smsUser?.full_name ? (
            <Text style={styles.profileInitial}>{smsUser.full_name.charAt(0).toUpperCase()}</Text>
          ) : (
            <Bell size={18} color={COLORS.brandNavy} strokeWidth={1.8} />
          )}
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={isLoadingBoats} onRefresh={refetch} tintColor={COLORS.brandCyan} />
        }
      >
        {/* Balance / Info Card */}
        <View style={styles.section}>
          <BalanceCard session={session} smsUser={smsUser} />
        </View>

        {/* Service Grid */}
        <View style={styles.sectionBg}>
          <ServiceGrid />
        </View>

        {/* Promo Banner Strip */}
        <View style={styles.bannerSection}>
          {isLoadingSlides ? (
            <View style={styles.bannerSkeleton} />
          ) : (
            <PromoBanner slides={heroSlides} />
          )}
        </View>

        {/* Filter chips */}
        <View style={styles.section}>
          <FilterChips />
        </View>

        {/* Promo cards */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Суда рядом с вами</Text>
            <Pressable onPress={() => router.push('/catalog' as any)}>
              <Text style={styles.seeAll}>Все</Text>
            </Pressable>
          </View>
          {isLoadingBoats ? (
            <View style={styles.loaderBox}>
              <ActivityIndicator color={COLORS.brandCyan} />
            </View>
          ) : (
            <View style={styles.promoList}>
              {featuredBoats.map((b) => (
                <PromoCard key={b.id} boat={b} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    zIndex: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 11,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  searchText: {
    flex: 1,
    fontSize: 14,
    color: '#8E8E8E',
  },
  profileBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  profileInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.brandNavy,
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { gap: 0 },
  section: { paddingHorizontal: 16, paddingTop: 16 },
  sectionBg: {
    backgroundColor: COLORS.white,
    marginTop: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1D1D1D',
  },
  seeAll: {
    fontSize: 13,
    color: COLORS.brandCyan,
    fontWeight: '600',
  },

  // Banner strip
  bannerSection: {
    paddingLeft: 16,
    paddingTop: 16,
  },
  bannerSkeleton: {
    height: 139,
    width: 287,
    borderRadius: 16,
    backgroundColor: '#E8E8E8',
  },

  // Promo cards
  loaderBox: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoList: {
    gap: 12,
  },
});
