import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Clock, X } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { COLORS } from "@/shared/colors";
import { publicSupabase, SUPABASE_URL } from "@/shared/supabase/publicClient";
import { resolveRouteImage } from "@/features/routes/types";
import { SharePreviewTarget } from "@/shared/context/SharePreviewContext";

const RU = new Intl.NumberFormat("ru-RU");

const TIMING_IN  = { duration: 300, easing: Easing.out(Easing.ease) };
const TIMING_OUT = { duration: 220, easing: Easing.in(Easing.ease) };

interface BoatData {
  id: string;
  name: string;
  type: string | null;
  price_per_hour: number;
  coverUrl: string | null;
}

interface RouteData {
  id: string;
  name: string;
  duration_hours: number;
  seo_slug: string | null;
  coverUrl: string | null;
}

interface Props {
  visible: boolean;
  target: SharePreviewTarget | null;
  onClose: () => void;
}

export function SharePreviewModal({ visible, target, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const progress = useSharedValue(0);

  const [boat, setBoat]   = useState<BoatData | null>(null);
  const [route, setRoute] = useState<RouteData | null>(null);
  const [loading, setLoading] = useState(false);

  const lastTarget = useRef<SharePreviewTarget | null>(null);
  if (target) lastTarget.current = target;

  useEffect(() => {
    progress.value = withTiming(visible ? 1 : 0, visible ? TIMING_IN : TIMING_OUT);
  }, [visible]);

  useEffect(() => {
    if (!target) return;
    setBoat(null);
    setRoute(null);
    setLoading(true);

    if (target.type === "boat") {
      publicSupabase
        .from("boats")
        .select("id, name, type, price_per_hour, boat_images(image_path, position)")
        .eq("id", target.id)
        .single()
        .then(({ data }) => {
          if (!data) { setLoading(false); return; }
          const sorted = [...((data.boat_images as any[]) ?? [])].sort(
            (a, b) => a.position - b.position,
          );
          const cover = sorted[0]?.image_path
            ? `${SUPABASE_URL}/storage/v1/object/public/boat_images/${sorted[0].image_path}`
            : null;
          setBoat({ id: data.id, name: data.name, type: data.type, price_per_hour: data.price_per_hour, coverUrl: cover });
          setLoading(false);
        });
    } else {
      publicSupabase
        .from("water_routes")
        .select("id, name, duration_hours, map_image_url, seo_slug")
        .or(`seo_slug.eq.${target.slug},id.eq.${target.slug}`)
        .eq("is_active", true)
        .single()
        .then(({ data }) => {
          if (!data) { setLoading(false); return; }
          setRoute({
            id: data.id,
            name: data.name,
            duration_hours: data.duration_hours,
            seo_slug: data.seo_slug,
            coverUrl: resolveRouteImage(data.map_image_url),
          });
          setLoading(false);
        });
    }
  }, [target?.type === "boat" ? target.id : target?.type === "route" ? target.slug : null]);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const sheetStyle  = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * 120 }],
  }));

  if (!lastTarget.current) return null;
  const t = lastTarget.current;

  const coverUrl = t.type === "boat" ? boat?.coverUrl : route?.coverUrl;
  const name     = t.type === "boat" ? boat?.name     : route?.name;
  const subtitle = t.type === "boat"
    ? boat ? `от ${RU.format(boat.price_per_hour)} ₽/час` : null
    : route ? durLabel(route.duration_hours) : null;
  const tag = t.type === "boat" ? boat?.type : null;

  const handleOpen = () => {
    onClose();
    if (t.type === "boat") {
      router.push(`/catalog/${t.id}` as any);
    } else {
      const dest = route?.seo_slug ?? t.slug;
      router.push(`/routes/${dest}` as any);
    }
  };

  return (
    <Animated.View
      style={[s.overlay, overlayStyle]}
      pointerEvents={visible ? "auto" : "none"}
    >
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

      <Animated.View style={[s.sheet, { paddingBottom: insets.bottom + 20 }, sheetStyle]}>
        {/* Handle */}
        <View style={s.handle} />

        {/* Close */}
        <Pressable style={s.closeBtn} onPress={onClose} hitSlop={10}>
          <X size={18} color={COLORS.text2} strokeWidth={2} />
        </Pressable>

        {/* Cover */}
        <View style={s.cover}>
          {coverUrl ? (
            <>
              <Image
                source={{ uri: coverUrl }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.55)"]}
                style={StyleSheet.absoluteFill}
              />
            </>
          ) : (
            <View style={[StyleSheet.absoluteFill, s.coverPlaceholder]} />
          )}

          {tag ? <View style={s.tag}><Text style={s.tagTxt}>{tag}</Text></View> : null}

          {t.type === "route" ? (
            <View style={s.durationBadge}>
              <Clock size={12} color="#fff" strokeWidth={2} />
              <Text style={s.durationTxt}>{subtitle}</Text>
            </View>
          ) : null}
        </View>

        {/* Info */}
        <View style={s.info}>
          {loading && !name ? (
            <ActivityIndicator color={COLORS.brandNavy} style={{ marginVertical: 20 }} />
          ) : (
            <>
              <Text style={s.name} numberOfLines={2}>{name ?? "—"}</Text>
              {t.type === "boat" && subtitle ? (
                <Text style={s.price}>{subtitle}</Text>
              ) : null}
            </>
          )}
        </View>

        {/* CTA */}
        <Pressable
          style={({ pressed }) => [s.btn, pressed && { opacity: 0.88 }]}
          onPress={handleOpen}
          disabled={loading && !name}
        >
          <Text style={s.btnTxt}>Открыть</Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

function durLabel(h: number) {
  if (h === 1) return "1 час";
  if (h < 5)   return `${h} часа`;
  return `${h} часов`;
}

const s = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
    zIndex: 9999,
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  closeBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.greyLight,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  cover: {
    height: 220,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: COLORS.greyLight,
  },
  coverPlaceholder: {
    backgroundColor: COLORS.greyLight2,
  },
  tag: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  tagTxt: {
    fontSize: 11,
    color: "#fff",
    fontWeight: "600",
    textTransform: "capitalize",
  },
  durationBadge: {
    position: "absolute",
    bottom: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  durationTxt: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
  },
  info: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
    minHeight: 64,
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text1,
    marginBottom: 4,
  },
  price: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.brandNavy,
  },
  btn: {
    marginHorizontal: 16,
    marginTop: 16,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.brandNavy,
  },
  btnTxt: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.white,
  },
});
