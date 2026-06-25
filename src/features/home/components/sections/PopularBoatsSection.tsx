import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import ReAnimated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

import { useDiscountsCache } from "@/features/catalog/hooks/useDiscountsCache";
import { COLORS } from "@/shared/colors";
import { STRIP_IMG_H, STRIP_W } from "@/shared/components/BoatCard";
import { HomeBoat } from "@/store/useHomeStore";
import { CARD_W, PopularBoatCard } from "../cards/PopularBoatCard";
import { PopularSeeAllCard } from "../cards/PopularSeeAllCard";

const SHIMMER = ["transparent", "rgba(255,255,255,0.5)", "transparent"] as const;

function SkeletonCard({ tx }: { tx: Animated.Value }) {
  return (
    <View style={sk.card}>
      <View style={sk.img}>
        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX: tx }] }]}>
          <LinearGradient colors={SHIMMER} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
        </Animated.View>
      </View>
      <View style={sk.line1}>
        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX: tx }] }]}>
          <LinearGradient colors={SHIMMER} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
        </Animated.View>
      </View>
      <View style={sk.line2}>
        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX: tx }] }]}>
          <LinearGradient colors={SHIMMER} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
        </Animated.View>
      </View>
    </View>
  );
}

function SkeletonRow({ tx }: { tx: Animated.Value }) {
  return (
    <View style={s.rowRoot}>
      <View style={s.header}>
        <View style={{ gap: 6 }}>
          <View style={sk.titleBar} />
          <View style={sk.subBar} />
        </View>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
        scrollEnabled={false}
      >
        <SkeletonCard tx={tx} />
        <SkeletonCard tx={tx} />
      </ScrollView>
    </View>
  );
}

interface RowProps {
  title: string;
  subtitle: string;
  typeRoute: string;
  boats: HomeBoat[];
  badge?: string;
  discountsMap: ReturnType<typeof useDiscountsCache>;
}

const AnimatedScrollView = ReAnimated.createAnimatedComponent(ScrollView);

const PopularRow = memo(function PopularRow({
  title,
  subtitle,
  typeRoute,
  boats,
  badge,
  discountsMap,
}: RowProps) {
  const router = useRouter();
  const previews = useMemo(
    () => boats.slice(0, 3).map((b) => b.cover_image_url).filter(Boolean) as string[],
    [boats],
  );
  const handleSeeAll = useCallback(() => router.push(typeRoute as any), [router, typeRoute]);
  const handleArrow = useCallback(() => router.push(typeRoute as any), [router, typeRoute]);

  const scrollX = useSharedValue(0);
  const contentW = useSharedValue(0);
  const viewW = useSharedValue(0);

  const [seeAllVisible, setSeeAllVisible] = useState(false);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollX.value = event.contentOffset.x;
  });

  // fire once when SeeAll card enters viewport (within 1.5 card widths of end)
  useAnimatedReaction(
    () => {
      if (contentW.value === 0 || viewW.value === 0) return false;
      const maxScroll = contentW.value - viewW.value;
      return scrollX.value > maxScroll - CARD_W * 1.5;
    },
    (visible, prev) => {
      if (visible && !prev) runOnJS(setSeeAllVisible)(true);
    },
  );

  const arrowAnimStyle = useAnimatedStyle(() => {
    const maxScroll = Math.max(0, contentW.value - viewW.value);
    const fadeStart = Math.max(0, maxScroll - CARD_W * 0.8);
    const fadeEnd = Math.max(0, maxScroll - CARD_W * 0.3);
    const opacity = interpolate(scrollX.value, [fadeStart, fadeEnd], [1, 0], Extrapolation.CLAMP);
    return { opacity };
  });

  if (boats.length === 0) return null;

  return (
    <View style={s.rowRoot}>
      <View style={s.header}>
        <View>
          <Text style={s.title}>{title}</Text>
          <Text style={s.titleSub}>{subtitle}</Text>
        </View>
        <ReAnimated.View style={arrowAnimStyle}>
          <Pressable
            style={({ pressed }) => [s.arrowBtn, pressed && { opacity: 0.7 }]}
            onPress={handleArrow}
            hitSlop={8}
          >
            <Text style={s.seeAllText}>Все</Text>
          </Pressable>
        </ReAnimated.View>
      </View>

      <AnimatedScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
        removeClippedSubviews
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onLayout={(e) => { viewW.value = e.nativeEvent.layout.width; }}
        onContentSizeChange={(w) => { contentW.value = w; }}
      >
        {boats.map((b) => (
          <PopularBoatCard
            key={b.boat_id}
            boat={b}
            badge={badge}
            discount={discountsMap.get(b.boat_id)}
          />
        ))}
        <PopularSeeAllCard
          previews={previews}
          onPress={handleSeeAll}
          visible={seeAllVisible}
        />
      </AnimatedScrollView>
    </View>
  );
});

interface Props {
  popular: HomeBoat[];
  katera: HomeBoat[];
  yakhty: HomeBoat[];
  loading?: boolean;
}

export const PopularBoatsSection = memo(function PopularBoatsSection({
  popular,
  katera,
  yakhty,
  loading,
}: Props) {
  const discountsMap = useDiscountsCache();
  const tx = useRef(new Animated.Value(-STRIP_W)).current;

  useEffect(() => {
    if (!loading) return;
    const anim = Animated.loop(
      Animated.timing(tx, { toValue: STRIP_W, duration: 1200, useNativeDriver: true }),
    );
    anim.start();
    return () => anim.stop();
  }, [loading]);

  if (
    loading &&
    popular.length === 0 &&
    katera.length === 0 &&
    yakhty.length === 0
  ) {
    return (
      <View>
        <SkeletonRow tx={tx} />
        <SkeletonRow tx={tx} />
        <SkeletonRow tx={tx} />
      </View>
    );
  }
  return (
    <View>
      <PopularRow
        title="Популярные суда"
        subtitle="На основе бронирований за 30 дней"
        typeRoute="/boats"
        boats={popular}
        // badge="Топ выбор"
        discountsMap={discountsMap}
      />
      <PopularRow
        title="Катера"
        subtitle="в Санкт-Петербурге"
        typeRoute="/boats?type=boat"
        boats={katera.slice(0, 10)}
        // badge="Катер"
        discountsMap={discountsMap}
      />
      <PopularRow
        title="Яхты"
        subtitle="в Санкт-Петербурге"
        typeRoute="/boats?type=yacht"
        boats={yakhty.slice(0, 10)}
        // badge="Яхта"
        discountsMap={discountsMap}
      />
    </View>
  );
});

const s = StyleSheet.create({
  rowRoot: { 
    paddingBottom: 24,
    // borderBottomWidth: 1,
    // borderBottomColor: COLORS.greyLight
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: { fontSize: 18, fontWeight: "500", color: COLORS.text1 },
  titleSub: { fontSize: 12, color: COLORS.text3, marginTop: 1 },
  arrowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingTop: 2,
  },
  scrollContent: { paddingHorizontal: 16, gap: 12, paddingRight: 32 },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.brandBlue,
  },
});

const SKEL = "#E8E8E8";
const sk = StyleSheet.create({
  card: { width: STRIP_W },
  img: { width: STRIP_W, height: STRIP_IMG_H, borderRadius: 14, backgroundColor: SKEL, overflow: 'hidden' },
  line1: { width: Math.round(STRIP_W * 0.55), height: 13, borderRadius: 5, backgroundColor: SKEL, marginTop: 8, overflow: 'hidden' },
  line2: { width: Math.round(STRIP_W * 0.38), height: 10, borderRadius: 5, backgroundColor: SKEL, marginTop: 5, overflow: 'hidden' },
  titleBar: { width: 150, height: 14, borderRadius: 5, backgroundColor: SKEL },
  subBar: { width: 100, height: 10, borderRadius: 5, backgroundColor: SKEL },
});
