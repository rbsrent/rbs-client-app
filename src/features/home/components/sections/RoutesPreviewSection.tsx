import { useRouter } from 'expo-router';
import { memo, useEffect, useRef } from 'react';
import { Animated, ScrollView, StyleSheet, View } from 'react-native';

import { ScrollDots } from '@/shared/components/ScrollDots';
import { SectionHeader } from '@/shared/components/SectionHeader';
import { HomeRoute } from '@/store/useHomeStore';
import { HomeRouteCard, ROUTE_CARD_H, ROUTE_CARD_W } from '../cards/HomeRouteCard';

const GAP      = 10;
const INTERVAL = ROUTE_CARD_W + GAP;
const SKEL     = '#E8E8E8';

function SkeletonRouteCard() {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 750, useNativeDriver: true }),
      ]),
    ).start();
  }, []);
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] });
  return (
    <Animated.View style={[sk.card, { opacity }]} />
  );
}

interface Props {
  routes:   HomeRoute[];
  loading?: boolean;
}

export const RoutesPreviewSection = memo(function RoutesPreviewSection({ routes, loading }: Props) {
  const router  = useRouter();
  const scrollX = useRef(new Animated.Value(0)).current;

  if (loading && routes.length === 0) {
    return (
      <View style={s.root}>
        <View style={s.headerWrap}>
          <View style={sk.titleBar} />
          <View style={[sk.subBar, { marginTop: 6 }]} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.strip} scrollEnabled={false}>
          {[0, 1, 2].map((i) => <SkeletonRouteCard key={i} />)}
        </ScrollView>
      </View>
    );
  }

  if (routes.length === 0) return null;

  return (
    <View style={s.root}>
      <View style={s.headerWrap}>
        <SectionHeader
          title="Куда отправиться"
          sub="в сезон 2026"
          seeAllLabel="Все маршруты"
          onSeeAll={() => router.push('/(tabs)/routes' as any)}
        />
      </View>

      <Animated.ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.strip}
        decelerationRate="fast"
        snapToInterval={INTERVAL}
        snapToAlignment="start"
        scrollEventThrottle={16}
        removeClippedSubviews
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false },
        )}
      >
        {routes.map((r) => (
          <HomeRouteCard key={r.id} route={r} />
        ))}
      </Animated.ScrollView>

      <View style={s.dotsWrap}>
        <ScrollDots count={routes.length} scrollX={scrollX} itemInterval={INTERVAL} />
      </View>
    </View>
  );
});

const s = StyleSheet.create({
  root:       { marginTop: 24 },
  headerWrap: { paddingHorizontal: 16, marginBottom: 12 },
  strip:      { paddingLeft: 16, paddingRight: 8, gap: GAP },
  dotsWrap:   { paddingLeft: 16, paddingTop: 10 },
});

const sk = StyleSheet.create({
  card:     { width: ROUTE_CARD_W, height: ROUTE_CARD_H, borderRadius: 16, backgroundColor: SKEL },
  titleBar: { width: 160, height: 16, borderRadius: 6, backgroundColor: SKEL },
  subBar:   { width: 100, height: 12, borderRadius: 5, backgroundColor: SKEL },
});
