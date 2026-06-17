import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Anchor,
  ArrowRight,
  ChevronLeft,
  Clock,
  MapPin,
  Ship,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  DIFFICULTY,
  resolveRouteImage,
  WaterRoute,
} from "@/features/routes/types";
import { COLORS } from "@/shared/colors";
import { publicSupabase } from "@/shared/supabase/publicClient";

const { width: W } = Dimensions.get("window");
const IMG_H = 300;

export default function RouteDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [route, setRoute] = useState<WaterRoute | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      const { data } = await publicSupabase
        .from("water_routes")
        .select("*")
        .or(`seo_slug.eq.${slug},id.eq.${slug}`)
        .eq("is_active", true)
        .single();
      if (!cancelled) {
        setRoute((data as WaterRoute) ?? null);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <View style={[s.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={COLORS.brandNavy} size="large" />
      </View>
    );
  }

  if (!route) {
    return (
      <View style={[s.center, { paddingTop: insets.top }]}>
        <Text style={s.notFound}>Маршрут не найден</Text>
        <Pressable onPress={() => router.back()} style={s.backLink}>
          <Text style={s.backLinkTxt}>← Назад</Text>
        </Pressable>
      </View>
    );
  }

  const imageUrl = resolveRouteImage(route.map_image_url);
  const diff = DIFFICULTY[route.difficulty_level] ?? {
    label: route.difficulty_level,
    color: COLORS.text3,
  };
  const points = (route.route_points ?? []).map((p) => p.name).filter(Boolean);

  const durationLabel = (() => {
    const h = route.duration_hours;
    if (!h) return null;
    if (h === 1) return "1 час";
    if (h < 5) return `${h} часа`;
    return `${h} часов`;
  })();

  return (
    <View style={s.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      >
        {/* Hero image */}
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
              colors={[COLORS.brandNavy, COLORS.brandCyan]}
              style={StyleSheet.absoluteFill}
            />
          )}
          <LinearGradient
            colors={["rgba(0,0,0,0.45)", "transparent"]}
            style={[StyleSheet.absoluteFill, { height: 120 }]}
            pointerEvents="none"
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.6)"]}
            style={[StyleSheet.absoluteFill, { top: IMG_H * 0.4 }]}
            pointerEvents="none"
          />

          {/* Back button */}
          <Pressable
            style={[s.backBtn, { top: insets.top + 8 }]}
            onPress={() => router.back()}
            hitSlop={8}
          >
            <ChevronLeft size={20} color="#fff" strokeWidth={2.5} />
          </Pressable>

          {/* Badges */}
          <View style={s.heroBadges}>
            <View style={[s.badge, { backgroundColor: diff.color }]}>
              <Text style={s.badgeTxt}>{diff.label}</Text>
            </View>
            {route.vessel_type === "boat" && (
              <View style={[s.badge, s.badgeDark]}>
                <Ship size={11} color="#fff" strokeWidth={2} />
                <Text style={s.badgeTxt}>Катер</Text>
              </View>
            )}
            {route.vessel_type === "yacht" && (
              <View style={[s.badge, s.badgeDark]}>
                <Anchor size={11} color="#fff" strokeWidth={2} />
                <Text style={s.badgeTxt}>Яхта</Text>
              </View>
            )}
          </View>

          {/* Duration bottom-right */}
          {durationLabel && (
            <View style={s.heroDuration}>
              <Clock size={13} color="rgba(255,255,255,0.85)" strokeWidth={2} />
              <Text style={s.heroDurationTxt}>{durationLabel}</Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={s.content}>
          <Text style={s.name}>{route.name}</Text>

          {/* Route points */}
          {points.length > 0 && (
            <View style={s.pointsRow}>
              <MapPin size={14} color={COLORS.brandCyan} strokeWidth={2} />
              <View style={s.pointsInner}>
                {points.map((p, i) => (
                  <View key={i} style={s.pointItem}>
                    <Text style={s.pointTxt}>{p}</Text>
                    {i < points.length - 1 && (
                      <ArrowRight
                        size={12}
                        color={COLORS.text3}
                        strokeWidth={2}
                      />
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Description */}
          {route.description ? (
            <View style={s.section}>
              <Text style={s.sectionTitle}>О маршруте</Text>
              <Text style={s.description}>{route.description}</Text>
            </View>
          ) : null}

          {/* Highlights */}
          {route.highlights && route.highlights.length > 0 && (
            <View style={s.section}>
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

          {/* Stats row */}
          <View style={s.statsCard}>
            {durationLabel && (
              <View style={s.statItem}>
                <Clock size={20} color={COLORS.brandCyan} strokeWidth={1.8} />
                <Text style={s.statVal}>{durationLabel}</Text>
                <Text style={s.statLbl}>Длительность</Text>
              </View>
            )}
            {points.length > 0 && (
              <View style={[s.statItem, s.statDivider]}>
                <MapPin size={20} color={COLORS.brandCyan} strokeWidth={1.8} />
                <Text style={s.statVal}>{points.length}</Text>
                <Text style={s.statLbl}>Точек маршрута</Text>
              </View>
            )}
            <View style={[s.statItem, points.length > 0 && s.statDivider]}>
              <View style={[s.diffDot, { backgroundColor: diff.color }]} />
              <Text style={s.statVal}>{diff.label}</Text>
              <Text style={s.statLbl}>Сложность</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  notFound: { fontSize: 16, color: COLORS.text2 },
  backLink: { paddingVertical: 8 },
  backLinkTxt: { fontSize: 15, color: COLORS.brandCyan, fontWeight: "600" },

  hero: { width: W, height: IMG_H, backgroundColor: COLORS.muted },

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

  heroBadges: {
    position: "absolute",
    bottom: 14,
    left: 14,
    flexDirection: "row",
    gap: 6,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeDark: { backgroundColor: "rgba(0,0,0,0.45)" },
  badgeTxt: { fontSize: 12, fontWeight: "700", color: "#fff" },

  heroDuration: {
    position: "absolute",
    bottom: 14,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.38)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  heroDurationTxt: {
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "600",
  },

  content: { padding: 20, gap: 20 },

  name: {
    fontSize: 26,
    fontWeight: "800",
    color: COLORS.text1,
    lineHeight: 33,
  },

  pointsRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  pointsInner: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    alignItems: "center",
  },
  pointItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  pointTxt: { fontSize: 13, color: COLORS.text2, fontWeight: "500" },

  section: { gap: 10 },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: COLORS.text1 },
  description: { fontSize: 14, color: COLORS.text2, lineHeight: 22 },

  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    backgroundColor: COLORS.muted,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipTxt: { fontSize: 13, color: COLORS.text2, fontWeight: "500" },

  statsCard: {
    flexDirection: "row",
    backgroundColor: "#F8F9FB",
    borderRadius: 16,
    padding: 16,
  },
  statItem: { flex: 1, alignItems: "center", gap: 6 },
  statDivider: {
    borderLeftWidth: 1,
    borderLeftColor: "#E8E8E8",
  },
  statVal: { fontSize: 14, fontWeight: "700", color: COLORS.text1 },
  statLbl: { fontSize: 11, color: COLORS.text3, textAlign: "center" },
  diffDot: { width: 20, height: 20, borderRadius: 10 },
});
