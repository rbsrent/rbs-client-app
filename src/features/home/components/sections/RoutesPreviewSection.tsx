import { useRouter } from 'expo-router';
import { memo, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { SectionHeader } from '@/shared/components/SectionHeader';
import { ScrollDots } from '@/shared/components/ScrollDots';
import { HomeRoute } from '@/store/useHomeStore';
import { HomeRouteCard, ROUTE_CARD_H, ROUTE_CARD_W } from '../cards/HomeRouteCard';

const GAP      = 10;
const INTERVAL = ROUTE_CARD_W + GAP;

interface Props {
  routes: HomeRoute[];
}

export const RoutesPreviewSection = memo(function RoutesPreviewSection({ routes }: Props) {
  const router  = useRouter();
  const scrollX = useRef(new Animated.Value(0)).current;

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
