import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ArrowRight } from "lucide-react-native";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useDiscountsCache } from "@/features/catalog/hooks/useDiscountsCache";
import { COLORS } from "@/shared/colors";
import { HomeBoat } from "@/store/useHomeStore";
import { CARD_W, PopularBoatCard } from "../cards/PopularBoatCard";
import { PopularSeeAllCard } from "../cards/PopularSeeAllCard";

function SkeletonCard() {
  const tx = useRef(new Animated.Value(-CARD_W)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(tx, { toValue: CARD_W, duration: 1100, useNativeDriver: true }),
    );
    anim.start();
    return () => anim.stop();
  }, []);
  return (
    <View style={sk.card}>
      <View style={sk.img}>
        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX: tx }] }]}>
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.45)', 'transparent']}
            start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
      <View style={sk.line1}>
        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX: tx }] }]}>
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.45)', 'transparent']}
            start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
      <View style={sk.line2}>
        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX: tx }] }]}>
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.45)', 'transparent']}
            start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
    </View>
  );
}

const SkeletonRow = memo(function SkeletonRow() {
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
        {[0, 1, 2].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </ScrollView>
    </View>
  );
});

interface RowProps {
  title: string;
  subtitle: string;
  typeRoute: string;
  boats: HomeBoat[];
  badge?: string;
  discountsMap: ReturnType<typeof useDiscountsCache>;
}

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
  const handleArrow  = useCallback(() => router.push(typeRoute as any), [router, typeRoute]);

  if (boats.length === 0) return null;

  return (
    <View style={s.rowRoot}>
      <View style={s.header}>
        <View>
          <Text style={s.title}>{title}</Text>
          <Text style={s.titleSub}>{subtitle}</Text>
        </View>
        <Pressable
          style={({ pressed }) => [s.arrowBtn, pressed && { opacity: 0.7 }]}
          onPress={handleArrow}
          hitSlop={8}
        >
          <ArrowRight size={15} color={COLORS.text1} strokeWidth={2.5} />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
        removeClippedSubviews
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
        />
      </ScrollView>
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

  if (
    loading &&
    popular.length === 0 &&
    katera.length === 0 &&
    yakhty.length === 0
  ) {
    return (
      <View>
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
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
        badge="Топ выбор"
        discountsMap={discountsMap}
      />
      <PopularRow
        title="Катера"
        subtitle="в Санкт-Петербурге"
        typeRoute="/boats?type=boat"
        boats={katera}
        badge="Катер"
        discountsMap={discountsMap}
      />
      <PopularRow
        title="Яхты"
        subtitle="в Санкт-Петербурге"
        typeRoute="/boats?type=yacht"
        boats={yakhty}
        badge="Яхта"
        discountsMap={discountsMap}
      />
    </View>
  );
});

const s = StyleSheet.create({
  rowRoot: { marginBottom: 24 },
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: { paddingHorizontal: 16, gap: 12, paddingRight: 32 },
});

const SKEL = "#E8E8E8";
const sk = StyleSheet.create({
  card: { width: 148, gap: 0 },
  img:   { width: 148, height: 110, borderRadius: 12, backgroundColor: SKEL, overflow: 'hidden' },
  line1: { width: 100, height: 12, borderRadius: 5, backgroundColor: SKEL, marginTop: 8, overflow: 'hidden' },
  line2: { width: 70,  height: 10, borderRadius: 5, backgroundColor: SKEL, marginTop: 5, overflow: 'hidden' },
  titleBar: { width: 150, height: 14, borderRadius: 5, backgroundColor: SKEL },
  subBar:   { width: 100, height: 10, borderRadius: 5, backgroundColor: SKEL },
});
