import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Clock, Heart, MapPin, Share2 } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Extrapolation,
  FadeIn,
  FadeInLeft,
  FadeInRight,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  ZoomIn,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  getCachedRoute,
  getRoutePreview,
  setCachedRoute,
} from "@/features/routes/store";
import {
  DIFFICULTY,
  resolveRouteImage,
  WaterRoute,
} from "@/features/routes/types";
import { COLORS } from "@/shared/colors";
import { useRouteWishlistPicker } from "@/shared/components/RouteWishlistPickerContext";
import { Spinner } from "@/shared/components/Spinner";
import { publicSupabase } from "@/shared/supabase/publicClient";
import { useRouteSavedStore } from "@/store/useRouteSavedStore";

const { width: W } = Dimensions.get("window");
const IMG_H = 280;
const NAVY = COLORS.brandNavy;
const TITLE_THRESHOLD = IMG_H + 60;

function durationLabel(h: number) {
  if (h === 1) return "1 час";
  if (h < 5) return `${h} часа`;
  return `${h} часов`;
}

function SnakePath({ points }: { points: string[] }) {
  if (points.length === 0) return null;

  return (
    <View style={sp.wrap}>
      <View style={sp.header}>
        <MapPin size={16} color={NAVY} strokeWidth={2} />
        <Text style={sp.headerTxt}>Маршрут · {points.length} точек</Text>
      </View>

      <View style={sp.body}>
        {points.map((name, i) => {
          const isRight = i % 2 === 0;
          const isFirst = i === 0;
          const isLast = i === points.length - 1;
          const STEP = 340;
          const cardDelay = i * STEP;

          const cardEnter = isRight
            ? FadeInLeft.delay(cardDelay).duration(320).springify().damping(18).stiffness(120)
            : FadeInRight.delay(cardDelay).duration(320).springify().damping(18).stiffness(120);

          return (
            <View key={i}>
              <View style={[sp.row, isRight ? sp.rowRight : sp.rowLeft]}>
                <Animated.View
                  entering={cardEnter}
                  style={[sp.labelCard, isRight ? sp.labelRight : sp.labelLeft]}
                >
                  {(isFirst || isLast) && (
                    <Text style={sp.badge}>{isFirst ? "Старт" : "Финиш"}</Text>
                  )}
                  <Text style={sp.label}>{name}</Text>
                </Animated.View>

                <View style={sp.dotWrap}>
                  <Animated.View
                    entering={ZoomIn.delay(cardDelay + 180).duration(280).springify().damping(12).stiffness(180)}
                    style={sp.dot}
                  >
                    <Text style={sp.dotNum}>{i + 1}</Text>
                  </Animated.View>
                </View>

                <View style={sp.spacer} />
              </View>

              {!isLast && (
                <Animated.View
                  entering={FadeIn.delay(cardDelay + 280).duration(80)}
                  style={[sp.connector, isRight ? sp.connRight : sp.connLeft]}
                >
                  <View style={[sp.arc, isRight ? sp.arcTopRight : sp.arcTopLeft]} />
                  <View style={[sp.arc, isRight ? sp.arcBotRight : sp.arcBotLeft]} />
                </Animated.View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

function RouteDescription({ text }: { text: string }) {
  return (
    <View style={rd.wrap}>
      <Text style={rd.title}>О маршруте</Text>
      <View style={rd.quoteBar} />
      <Text style={rd.body}>{text}</Text>
    </View>
  );
}

export default function RouteDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const preview = useRef(getRoutePreview(slug as string)).current;
  const cached = useRef(getCachedRoute(slug as string)).current;
  const [route, setRoute] = useState<WaterRoute | null>(cached);
  const [loading, setLoading] = useState(!cached);

  const { openRoutePicker } = useRouteWishlistPicker();
  const isSaved = useRouteSavedStore((s) => (route ? s.savedIds.has(route.id) : false));
  const hydrate = useRouteSavedStore((s) => s.hydrate);

  useEffect(() => { hydrate(); }, []);

  const handleShare = useCallback(async () => {
    try {
      const name = route?.name ?? "Маршрут";
      const webUrl = `https://rbs.rent/routes/${slug}?from=share_${Platform.OS}`;
      const appUrl = `rbsrent://routes/${slug}`;
      await Share.share(
        Platform.OS === "ios"
          ? { title: name, message: appUrl, url: webUrl }
          : { title: name, message: `${name}\n${webUrl}` },
      );
    } catch {}
  }, [route?.name, slug]);

  const handleHeart = useCallback(() => {
    if (!route) return;
    openRoutePicker({
      route_id: route.id,
      name: route.name,
      map_image_url: route.map_image_url,
      duration_hours: route.duration_hours,
    });
  }, [route, openRoutePicker]);

  useEffect(() => {
    if (!slug || cached) return;
    let cancelled = false;
    (async () => {
      const { data } = await publicSupabase
        .from("water_routes")
        .select("*")
        .or(`seo_slug.eq.${slug},id.eq.${slug}`)
        .eq("is_active", true)
        .single();
      if (!cancelled) {
        const result = (data as WaterRoute) ?? null;
        if (result) setCachedRoute(slug as string, result);
        setRoute(result);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  // scroll → header title
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });
  const headerTitleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [TITLE_THRESHOLD, TITLE_THRESHOLD + 40],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));

  const imageUrl = route
    ? resolveRouteImage(route.map_image_url)
    : (preview?.imageUrl ?? null);
  const diff = route
    ? (DIFFICULTY[route.difficulty_level] ?? { label: route.difficulty_level, color: COLORS.text3 })
    : null;
  const points = (route?.route_points ?? []).map((p) => p.name).filter(Boolean);
  const routeName = route?.name ?? preview?.name ?? "";

  return (
    <View style={s.root}>
      {/* ── always-white header ── */}
      <View style={[s.header, { paddingTop: insets.top }]}>
        <Pressable style={s.backBtn} onPress={() => router.back()} hitSlop={10}>
          <ArrowLeft size={22} color={COLORS.text1} strokeWidth={2} />
        </Pressable>

        <Animated.Text style={[s.headerTitle, headerTitleStyle]} numberOfLines={1}>
          {routeName}
        </Animated.Text>

        <View style={s.headerRight}>
          <Pressable style={s.headerIconBtn} onPress={handleShare} hitSlop={10}>
            <Share2 size={20} color={COLORS.text1} strokeWidth={2} />
          </Pressable>
          <Pressable style={s.headerIconBtn} onPress={handleHeart} hitSlop={10}>
            <Heart
              size={20}
              color={isSaved ? "#E63946" : COLORS.text1}
              fill={isSaved ? "#E63946" : "transparent"}
              strokeWidth={2}
            />
          </Pressable>
        </View>
      </View>

      {/* ── scroll content ── */}
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        {/* image */}
        <View style={s.imgWrap}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={s.img}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          ) : (
            <LinearGradient
              colors={[NAVY, COLORS.brandCyan]}
              style={StyleSheet.absoluteFill}
            />
          )}
        </View>

        {/* top content block — same style as TourDetailScreen */}
        <View style={s.content}>
          {/* tags */}
          <View style={s.tagsRow}>
            {diff && (
              <View style={[s.tagFilled, { backgroundColor: diff.color }]}>
                <Text style={s.tagFilledTxt}>{diff.label}</Text>
              </View>
            )}
            <View style={s.tagOutline}>
              <Text style={s.tagOutlineTxt}>Маршрут</Text>
            </View>
          </View>

          {/* title */}
          <Text style={s.title}>{routeName}</Text>

          {/* info cards */}
          {route && (
            <>
              <View style={s.infoCard}>
                <View style={s.infoIconWrap}>
                  <Clock size={22} color={NAVY} strokeWidth={2} />
                </View>
                <Text style={s.infoTxt}>
                  Продолжительность: {durationLabel(route.duration_hours)}
                </Text>
              </View>

              {points.length > 0 && (
                <View style={s.infoCard}>
                  <View style={s.infoIconWrap}>
                    <MapPin size={22} color={COLORS.brandViolet} strokeWidth={2} />
                  </View>
                  <Text style={s.infoTxt}>
                    {points.length} точек маршрута — от старта до финиша
                  </Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* loading / error */}
        {loading ? (
          <View style={s.loadingBlock}>
            <Spinner size={20} />
          </View>
        ) : !route ? (
          <View style={s.loadingBlock}>
            <Text style={{ color: COLORS.text3 }}>Маршрут не найден</Text>
          </View>
        ) : (
          <Animated.View entering={FadeIn.duration(260)} style={s.sections}>
            <View style={s.divider} />

            {/* snake path */}
            {points.length > 0 && <SnakePath points={points} />}

            {/* description */}
            {route.detailed_description ? (
              <RouteDescription text={route.detailed_description} />
            ) : null}

            {/* highlights */}
            {route.highlights && route.highlights.length > 0 && (
              <View style={s.highlightsSection}>
                <Text style={s.sectionTitle}>Что увидите</Text>
                <View style={s.chips}>
                  {route.highlights.map((h, i) => (
                    <View key={i} style={s.chip}>
                      <Text style={s.chipTxt}>{h}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </Animated.View>
        )}
      </Animated.ScrollView>
    </View>
  );
}

const DOT_SIZE = 36;
const SIDE_W = (W - 48 - DOT_SIZE) / 2;
const CONN_H = 28;
const CONN_W = SIDE_W * 0.55;

const sp = StyleSheet.create({
  wrap: {},
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  headerTxt: { fontSize: 17, fontWeight: "700", color: COLORS.text1 },
  body: { paddingHorizontal: 24 },
  row: { flexDirection: "row", alignItems: "center" },
  rowRight: { flexDirection: "row" },
  rowLeft: { flexDirection: "row-reverse" },
  labelCard: {
    width: SIDE_W,
    backgroundColor: "#F8F9FB",
    borderRadius: 12,
    padding: 12,
    gap: 3,
  },
  labelRight: { marginRight: 12 },
  labelLeft: { marginLeft: 12 },
  badge: {
    fontSize: 10,
    fontWeight: "700",
    color: NAVY,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  label: { fontSize: 13, fontWeight: "600", color: COLORS.text1, lineHeight: 18 },
  dotWrap: { width: DOT_SIZE, alignItems: "center" },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: NAVY,
    alignItems: "center",
    justifyContent: "center",
  },
  dotNum: { fontSize: 13, fontWeight: "700", color: "#fff" },
  spacer: { width: SIDE_W },
  connector: { width: CONN_W, alignSelf: "flex-start" },
  connRight: { alignSelf: "flex-end", marginRight: SIDE_W + DOT_SIZE / 2 - CONN_W / 2 },
  connLeft: { alignSelf: "flex-start", marginLeft: SIDE_W + DOT_SIZE / 2 - CONN_W / 2 },
  arc: { width: CONN_W, height: CONN_H },
  arcTopRight: { borderRightWidth: 2, borderBottomWidth: 2, borderBottomRightRadius: CONN_W * 0.7, borderColor: NAVY },
  arcBotRight: { borderLeftWidth: 2, borderBottomWidth: 2, borderBottomLeftRadius: CONN_W * 0.7, borderColor: NAVY },
  arcTopLeft: { borderLeftWidth: 2, borderBottomWidth: 2, borderBottomLeftRadius: CONN_W * 0.7, borderColor: NAVY },
  arcBotLeft: { borderRightWidth: 2, borderBottomWidth: 2, borderBottomRightRadius: CONN_W * 0.7, borderColor: NAVY },
});

const rd = StyleSheet.create({
  wrap: { paddingHorizontal: 20, gap: 12 },
  title: { fontSize: 17, fontWeight: "700", color: COLORS.text1 },
  quoteBar: { width: 36, height: 3, borderRadius: 2, backgroundColor: NAVY },
  body: { fontSize: 15, color: COLORS.text2, lineHeight: 24 },
});


const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.white },

  // header
  header: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: "600", color: COLORS.text1 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 4 },
  headerIconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },

  // image
  imgWrap: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: "hidden",
    height: IMG_H,
    backgroundColor: COLORS.muted,
  },
  img: { width: "100%", height: IMG_H },

  // top content (same as TourDetailScreen)
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  tagsRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  tagFilled: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  tagFilledTxt: { fontSize: 12, fontWeight: "700", color: "#fff" },
  tagOutline: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagOutlineTxt: { fontSize: 12, fontWeight: "500", color: COLORS.text2 },
  title: { fontSize: 22, fontWeight: "800", color: COLORS.text1, lineHeight: 29 },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    backgroundColor: COLORS.greyLight,
    borderRadius: 10,
    padding: 14,
  },
  infoIconWrap: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },
  infoTxt: { flex: 1, fontSize: 13, lineHeight: 20, color: COLORS.text1 },

  // sections below
  loadingBlock: { paddingTop: 40, alignItems: "center" },
  sections: { paddingTop: 4, gap: 28, paddingBottom: 8 },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
    marginHorizontal: 16,
    marginBottom: 4,
  },

  highlightsSection: { paddingHorizontal: 20, gap: 12 },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: COLORS.text1 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.backgroundAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipTxt: { fontSize: 13, color: COLORS.text2, fontWeight: "500" },
});
