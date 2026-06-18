import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, Clock, MapPin } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getCachedRoute, setCachedRoute, getRoutePreview } from "@/features/routes/store";
import {
  DIFFICULTY,
  resolveRouteImage,
  WaterRoute,
} from "@/features/routes/types";
import { COLORS } from "@/shared/colors";
import { publicSupabase } from "@/shared/supabase/publicClient";

const { width: W } = Dimensions.get("window");
const HERO_H = 380;
const NAVY = COLORS.brandNavy;

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

          return (
            <View key={i}>
              {/* waypoint row */}
              <View style={[sp.row, isRight ? sp.rowRight : sp.rowLeft]}>
                {/* label card */}
                <View
                  style={[sp.labelCard, isRight ? sp.labelRight : sp.labelLeft]}
                >
                  {(isFirst || isLast) && (
                    <Text style={sp.badge}>{isFirst ? "Старт" : "Финиш"}</Text>
                  )}
                  <Text style={sp.label}>{name}</Text>
                </View>

                {/* dot */}
                <View style={sp.dotWrap}>
                  <View style={sp.dot}>
                    <Text style={sp.dotNum}>{i + 1}</Text>
                  </View>
                </View>

                {/* spacer opposite side */}
                <View style={sp.spacer} />
              </View>

              {/* connector between this and next point */}
              {!isLast && (
                <View
                  style={[sp.connector, isRight ? sp.connRight : sp.connLeft]}
                >
                  {/* top half: horizontal run + down */}
                  <View
                    style={[sp.arc, isRight ? sp.arcTopRight : sp.arcTopLeft]}
                  />
                  {/* bottom half: back to center */}
                  <View
                    style={[sp.arc, isRight ? sp.arcBotRight : sp.arcBotLeft]}
                  />
                </View>
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
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const imageUrl = route
    ? resolveRouteImage(route.map_image_url)
    : (preview?.imageUrl ?? null);
  const diff = route
    ? (DIFFICULTY[route.difficulty_level] ?? {
        label: route.difficulty_level,
        color: COLORS.text3,
      })
    : null;
  const points = (route?.route_points ?? []).map((p) => p.name).filter(Boolean);

  return (
    <View style={s.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        {/* ── hero ── */}
        <View style={s.hero}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          ) : (
            <LinearGradient
              colors={[NAVY, COLORS.brandCyan]}
              style={StyleSheet.absoluteFill}
            />
          )}

          <LinearGradient
            colors={["rgba(0,0,0,0.52)", "transparent"]}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 130,
            }}
            pointerEvents="none"
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.78)"]}
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: HERO_H * 0.58,
            }}
            pointerEvents="none"
          />

          <Pressable
            style={[s.backBtn, { top: insets.top + 8 }]}
            onPress={() => router.back()}
            hitSlop={8}
          >
            <ChevronLeft size={20} color="#fff" strokeWidth={2.5} />
          </Pressable>

          <View style={s.heroContent}>
            {diff && (
              <View style={[s.diffPill, { backgroundColor: diff.color }]}>
                <Text style={s.diffTxt}>{diff.label}</Text>
              </View>
            )}
            <Text style={s.heroName} numberOfLines={3}>
              {route?.name ?? preview?.name ?? ""}
            </Text>
            {route && (
              <View style={s.heroMeta}>
                <View style={s.heroMetaItem}>
                  <Clock
                    size={13}
                    color="rgba(255,255,255,0.8)"
                    strokeWidth={2}
                  />
                  <Text style={s.heroMetaTxt}>
                    {durationLabel(route.duration_hours)}
                  </Text>
                </View>
                {points.length > 0 && (
                  <View style={s.heroMetaItem}>
                    <MapPin
                      size={13}
                      color="rgba(255,255,255,0.8)"
                      strokeWidth={2}
                    />
                    <Text style={s.heroMetaTxt}>
                      {points.length} точек маршрута
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

        {/* ── content ── */}
        {loading ? (
          <View style={s.loadingBlock}>
            <ActivityIndicator color={NAVY} size="small" />
          </View>
        ) : !route ? (
          <View style={s.loadingBlock}>
            <Text style={{ color: COLORS.text3 }}>Маршрут не найден</Text>
          </View>
        ) : (
          <Animated.View entering={FadeIn.duration(260)} style={s.content}>
            {/* ── snake path ── */}
            {points.length > 0 && <SnakePath points={points} />}

            {/* ── description ── */}
            {route.detailed_description ? (
              <RouteDescription text={route.detailed_description} />
            ) : null}

            {/* ── highlights ── */}
            {route.highlights && route.highlights.length > 0 && (
              <View style={s.section}>
                <View style={s.sectionRow}>
                  <Text style={s.sectionTitle}>Что увидите</Text>
                </View>
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
      </ScrollView>
    </View>
  );
}

const DOT_SIZE = 36;
const SIDE_W = (W - 48 - DOT_SIZE) / 2; // available per side
const CONN_H = 28; // half-arc height
const CONN_W = SIDE_W * 0.55;

const sp = StyleSheet.create({
  wrap: { marginHorizontal: 0 },
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
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text1,
    lineHeight: 18,
  },

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

  // connector: sits between two waypoint rows, centered on dot column
  connector: {
    width: CONN_W,
    alignSelf: "flex-start", // overridden per direction below
  },
  connRight: {
    alignSelf: "flex-end",
    marginRight: SIDE_W + DOT_SIZE / 2 - CONN_W / 2,
  },
  connLeft: {
    alignSelf: "flex-start",
    marginLeft: SIDE_W + DOT_SIZE / 2 - CONN_W / 2,
  },

  // each arc is half the S-curve
  arc: { width: CONN_W, height: CONN_H },

  // right-side S-curve: top arc curves RIGHT, bottom curves back LEFT
  arcTopRight: {
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderBottomRightRadius: CONN_W * 0.7,
    borderColor: NAVY,
  },
  arcBotRight: {
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderBottomLeftRadius: CONN_W * 0.7,
    borderColor: NAVY,
  },

  // left-side S-curve: mirror
  arcTopLeft: {
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderBottomLeftRadius: CONN_W * 0.7,
    borderColor: NAVY,
  },
  arcBotLeft: {
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderBottomRightRadius: CONN_W * 0.7,
    borderColor: NAVY,
  },
});

const rd = StyleSheet.create({
  wrap: { paddingHorizontal: 20, gap: 12 },
  title: { fontSize: 17, fontWeight: "700", color: COLORS.text1 },
  quoteBar: {
    width: 36,
    height: 3,
    borderRadius: 2,
    backgroundColor: NAVY,
  },
  body: { fontSize: 15, color: COLORS.text2, lineHeight: 24 },
});

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },

  hero: { width: W, height: HERO_H, backgroundColor: COLORS.muted },
  backBtn: {
    position: "absolute",
    left: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.38)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    gap: 8,
  },
  diffPill: {
    alignSelf: "flex-start",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 2,
  },
  diffTxt: { fontSize: 11, fontWeight: "700", color: "#fff" },
  heroName: { fontSize: 26, fontWeight: "800", color: "#fff", lineHeight: 32 },
  heroMeta: { flexDirection: "row", gap: 14, marginTop: 2 },
  heroMetaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  heroMetaTxt: {
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "500",
  },

  loadingBlock: { paddingTop: 40, alignItems: "center" },
  content: { paddingVertical: 28, gap: 28 },

  section: { paddingHorizontal: 20, gap: 12 },
  sectionRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: COLORS.text1 },

  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    backgroundColor: COLORS.muted,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipTxt: { fontSize: 13, color: COLORS.text2, fontWeight: "500" },
});
