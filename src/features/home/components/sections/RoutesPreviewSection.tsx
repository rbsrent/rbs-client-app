import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import ReAnimated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import { resolveRouteImage } from '@/features/routes/types';
import { COLORS } from '@/shared/colors';
import { HomeRoute } from '@/store/useHomeStore';
import { HomeRouteCard, ROUTE_CARD_H, ROUTE_CARD_W } from '../cards/HomeRouteCard';
import { RoutesSeeAllCard } from '../cards/RoutesSeeAllCard';

const GAP  = 12;
const SKEL = '#E8E8E8';

const AnimatedScrollView = ReAnimated.createAnimatedComponent(ScrollView);

function SkeletonCard() {
  const tx = useRef(new Animated.Value(-ROUTE_CARD_W)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(tx, { toValue: ROUTE_CARD_W, duration: 1100, useNativeDriver: true }),
    );
    anim.start();
    return () => anim.stop();
  }, []);
  return (
    <View style={[sk.card, { width: ROUTE_CARD_W, height: ROUTE_CARD_H }]}>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX: tx }] }]}>
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.45)', 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

interface Props {
  routes:   HomeRoute[];
  loading?: boolean;
}

export const RoutesPreviewSection = memo(function RoutesPreviewSection({ routes, loading }: Props) {
  const router = useRouter();

  const previews = useMemo(
    () => routes.slice(0, 3).map((r) => resolveRouteImage(r.map_image_url)).filter(Boolean) as string[],
    [routes],
  );

  const scrollX  = useSharedValue(0);
  const contentW = useSharedValue(0);
  const viewW    = useSharedValue(0);

  const [seeAllVisible, setSeeAllVisible] = useState(false);

  const scrollHandler = useAnimatedScrollHandler((e) => {
    scrollX.value = e.contentOffset.x;
  });

  useAnimatedReaction(
    () => {
      if (contentW.value === 0 || viewW.value === 0) return false;
      return scrollX.value > contentW.value - viewW.value - ROUTE_CARD_W * 1.5;
    },
    (visible, prev) => {
      if (visible && !prev) runOnJS(setSeeAllVisible)(true);
    },
  );

  const arrowAnimStyle = useAnimatedStyle(() => {
    const maxScroll = Math.max(0, contentW.value - viewW.value);
    const fadeStart = Math.max(0, maxScroll - ROUTE_CARD_W * 0.8);
    const fadeEnd   = Math.max(0, maxScroll - ROUTE_CARD_W * 0.3);
    return {
      opacity: interpolate(scrollX.value, [fadeStart, fadeEnd], [1, 0], Extrapolation.CLAMP),
    };
  });

  const handleSeeAll = useCallback(() => router.push('/(tabs)/routes' as any), [router]);

  if (loading && routes.length === 0) {
    return (
      <View style={s.root}>
        <View style={s.header}>
          <View style={{ gap: 6 }}>
            <View style={sk.titleBar} />
            <View style={sk.subBar} />
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.strip} scrollEnabled={false}>
          <SkeletonCard />
          <SkeletonCard />
        </ScrollView>
      </View>
    );
  }

  if (routes.length === 0) return null;

  return (
    <View style={s.root}>
      <View style={s.header}>
        <View>
          <Text style={s.title}>Куда отправиться</Text>
          <Text style={s.titleSub}>в сезон 2026</Text>
        </View>
        <ReAnimated.View style={arrowAnimStyle}>
          <Pressable
            style={({ pressed }) => [s.arrowBtn, pressed && { opacity: 0.7 }]}
            onPress={handleSeeAll}
            hitSlop={8}
          >
            <Text style={s.seeAllText}>Все</Text>
          </Pressable>
        </ReAnimated.View>
      </View>

      <AnimatedScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.strip}
        decelerationRate="fast"
        snapToInterval={ROUTE_CARD_W + GAP}
        snapToAlignment="start"
        scrollEventThrottle={16}
        removeClippedSubviews
        onScroll={scrollHandler}
        onLayout={(e) => { viewW.value = e.nativeEvent.layout.width; }}
        onContentSizeChange={(w) => { contentW.value = w; }}
      >
        {routes.map((r) => (
          <HomeRouteCard key={r.id} route={r} />
        ))}
        <RoutesSeeAllCard previews={previews} onPress={handleSeeAll} visible={seeAllVisible} />
      </AnimatedScrollView>
    </View>
  );
});

const s = StyleSheet.create({
  root:       { marginTop: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title:     { fontSize: 17, fontWeight: '500', color: COLORS.text1 },
  titleSub:  { fontSize: 13, color: COLORS.text3, marginTop: 2 },
  arrowBtn:  { flexDirection: 'row', alignItems: 'center', gap: 3, paddingTop: 2 },
  seeAllText: { fontSize: 14, fontWeight: '600', color: COLORS.brandBlue },
  strip:     { paddingLeft: 16, paddingRight: 8, gap: GAP },
});

const sk = StyleSheet.create({
  card:     { borderRadius: 14, backgroundColor: SKEL, overflow: 'hidden' },
  titleBar: { width: 160, height: 16, borderRadius: 6, backgroundColor: SKEL },
  subBar:   { width: 100, height: 12, borderRadius: 5, backgroundColor: SKEL },
});
