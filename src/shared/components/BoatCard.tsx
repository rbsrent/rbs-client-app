import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { MapPin } from "lucide-react-native";
import { memo } from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { Easing, SharedTransition } from "react-native-reanimated";

import { ActiveDiscount } from "@/features/catalog/hooks/useDiscountsCache";
import { AvailInfo } from "@/features/catalog/utils/filterUtils";
import { setBoatPreview } from "@/shared/boatPreviewStore";
import { COLORS } from "@/shared/colors";
import { HeartButton } from "./HeartButton";

const heroTransition = SharedTransition
  .duration(380)
  .easing(Easing.bezier(0.35, 0, 0.25, 1) as any);

const { width: W } = Dimensions.get("window");

export type BoatCardLayout = "grid" | "strip";
export type BoatCardVariant = "home" | "catalog";

export interface BoatCardData {
  id: string;
  name: string;
  type?: string | null;
  cover_image_url?: string | null;
  cover_image_path?: string | null;
  price_per_hour: number;
  capacity?: number | null;
  length_meters?: number | null;
  pier_name?: string | null;
  rating?: number | null;
}

interface Props {
  boat: BoatCardData;
  layout?: BoatCardLayout;
  badge?: string;
  availInfo?: AvailInfo;
  discount?: ActiveDiscount;
  route?: string;
  variant?: BoatCardVariant;
}

const GRID_W = (W - 16 * 2 - 12) / 2;
const STRIP_W = Math.round(W * 0.83);

const GRID_IMG_H  = Math.round(GRID_W  * 1.05);
const STRIP_IMG_H = Math.round(STRIP_W * 0.58);

const ruNum = (n: number) => new Intl.NumberFormat("ru-RU").format(Math.round(n));

function availBadgeLabel(info: AvailInfo): string | null {
  if (info.status === "fully_available") return `Свободен ${info.available_hours}ч`;
  if (info.status === "partially_available") {
    const booked = info.total_hours_in_period - info.available_hours;
    return `Занят ${booked}ч из ${info.total_hours_in_period}ч`;
  }
  return null;
}

export const BoatCard = memo(function BoatCard({
  boat,
  layout = "grid",
  badge,
  availInfo,
  discount,
  route,
  variant = "home",
}: Props) {
  const router = useRouter();
  const hasRate     = (boat.rating ?? 0) > 0;
  const isCatalog   = variant === "catalog";
  const imgH        = layout === "strip" ? STRIP_IMG_H : isCatalog ? Math.round(GRID_W) : GRID_IMG_H;
  const cardSrc     = boat.cover_image_url ?? null;
  const availLabel  = availInfo ? availBadgeLabel(availInfo) : null;
  const topBadge    = availLabel ?? badge ?? null;
  const originalPrice = discount
    ? Math.round(boat.price_per_hour / (1 - discount.percentage / 100))
    : null;

  const heartData = {
    boat_id:         boat.id,
    name:            boat.name,
    type:            boat.type            ?? null,
    cover_image_url: boat.cover_image_url ?? null,
    price_per_hour:  boat.price_per_hour,
    capacity:        boat.capacity        ?? null,
    length_meters:   boat.length_meters   ?? null,
    pier_name:       boat.pier_name       ?? null,
    rating:          boat.rating          ?? null,
  };

  return (
    <Pressable
      style={({ pressed }) => [
        s.card,
        layout === "strip" ? { width: STRIP_W } : { flex: 1 },
        pressed && { opacity: 0.93 },
      ]}
      onPress={() => {
        setBoatPreview({ id: boat.id, name: boat.name, cover: boat.cover_image_url ?? null });
        router.push((route ?? `/catalog/${boat.id}`) as any);
      }}
    >
      <Animated.View
        style={[s.imgWrap, { height: imgH }, isCatalog && s.imgWrapCatalog]}
        sharedTransitionTag={`boat-img-${boat.id}`}
        sharedTransitionStyle={heroTransition}
      >
        {cardSrc ? (
          <Image
            source={{ uri: cardSrc }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={{ duration: 200, effect: "cross-dissolve" }}
            cachePolicy="memory-disk"
            recyclingKey={boat.id}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.muted }]} />
        )}

        <View style={s.topRow}>
          {topBadge ? (
            isCatalog ? (
              <LinearGradient
                colors={["#F9F9F9", "#F5F5F5"]}
                style={s.catalogBadge}
              >
                <Text style={s.catalogBadgeTxt}>{topBadge}</Text>
              </LinearGradient>
            ) : (
              <View style={[s.badgePill, availLabel ? s.badgeAvail : s.badgeDefault]}>
                <Text style={s.badgeTxt}>{topBadge}</Text>
              </View>
            )
          ) : <View />}
          <HeartButton boat={heartData} size={18} />
        </View>

        {!isCatalog && (
          <>
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.68)"]}
              style={s.gradient}
              pointerEvents="none"
            />
            <View style={s.bottomOverlay}>
              <Text style={s.price}>От {ruNum(boat.price_per_hour)} ₽</Text>
              {originalPrice ? (
                <Text style={s.priceOld}>{ruNum(originalPrice)} ₽</Text>
              ) : null}
              {discount ? (
                <View style={s.discountPill}>
                  <Text style={s.discountTxt}>−{discount.percentage}%</Text>
                </View>
              ) : null}
            </View>
          </>
        )}
      </Animated.View>

      {isCatalog ? (
        <View style={s.catalogInfo}>
          <Text style={s.catalogName} numberOfLines={2}>{boat.name}</Text>
          {(boat.type || boat.capacity) ? (
            <Text style={s.catalogMetaTxt} numberOfLines={1}>
              {[
                boat.type ?? null,
                boat.capacity ? `до ${boat.capacity} чел.` : null,
              ].filter(Boolean).join("  ·  ")}
            </Text>
          ) : null}
          {boat.pier_name ? (
            <View style={s.locationRow}>
              <MapPin size={10} color="#6A6A6A" strokeWidth={2} />
              <Text style={[s.catalogMetaTxt, { flex: 1 }]} numberOfLines={1}>{boat.pier_name}</Text>
            </View>
          ) : null}
          <View style={s.catalogPriceRow}>
            <Text style={s.catalogMetaTxt} numberOfLines={1}>
              От {ruNum(boat.price_per_hour)} ₽/ч
            </Text>
            {originalPrice ? (
              <Text style={[s.catalogMetaTxt, s.catalogOld]}>{ruNum(originalPrice)} ₽</Text>
            ) : null}
            {discount ? (
              <Text style={s.catalogDiscount}>−{discount.percentage}%</Text>
            ) : null}
            {hasRate ? (
              <Text style={s.catalogMetaTxt}>★ {boat.rating!.toFixed(1)}</Text>
            ) : null}
          </View>
        </View>
      ) : (
        <View style={s.info}>
          <Text style={s.name} numberOfLines={2}>{boat.name}</Text>
          <Text style={s.meta} numberOfLines={1}>
            {[
              boat.type ?? null,
              boat.capacity ? `до ${boat.capacity} чел.` : null,
              hasRate ? `★ ${boat.rating!.toFixed(1)}` : null,
            ].filter(Boolean).join("  ·  ")}
          </Text>
          {boat.pier_name ? (
            <View style={s.locationRow}>
              <MapPin size={10} color={COLORS.text3} strokeWidth={2} />
              <Text style={s.locationTxt} numberOfLines={1}>{boat.pier_name}</Text>
            </View>
          ) : null}
        </View>
      )}
    </Pressable>
  );
});

const s = StyleSheet.create({
  card: {},

  imgWrap: {
    borderRadius: 14,
    backgroundColor: COLORS.muted,
    overflow: "hidden",
  },
  imgWrapCatalog: {
    borderRadius: 20,
  },

  topRow: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
  },

  catalogBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 4,
    elevation: 4,
  },
  catalogBadgeTxt: {
    fontSize: 11,
    fontWeight: "500",
    color: "#000000",
    lineHeight: 12,
  },

  badgePill: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeDefault: { backgroundColor: "rgba(255,255,255,0.88)" },
  badgeAvail:   { backgroundColor: "rgba(37,160,119,0.9)" },
  badgeTxt: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.text1,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },

  gradient: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    height: 72,
  },

  bottomOverlay: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 10,
    gap: 6,
  },
  price:    { fontSize: 14, fontWeight: "800", color: "#fff" },
  priceOld: { fontSize: 11, color: "rgba(255,255,255,0.55)", textDecorationLine: "line-through" },

  discountPill: {
    backgroundColor: "#E53935",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  discountTxt: { fontSize: 12, fontWeight: "800", color: "#fff" },

  catalogInfo: {
    paddingTop: 8,
    gap: 6,
  },
  catalogName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000000",
    lineHeight: 15,
  },
  catalogPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
  },
  catalogMetaTxt: {
    fontSize: 12,
    fontWeight: "400",
    color: "#6A6A6A",
    lineHeight: 13,
  },
  catalogOld: {
    textDecorationLine: "line-through",
  },
  catalogDiscount: {
    fontSize: 12,
    fontWeight: "500",
    color: "#E53935",
    lineHeight: 13,
    marginLeft: 4,
  },

  info: {
    paddingTop: 8,
    gap: 3,
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text1,
    lineHeight: 21,
  },
  meta: {
    fontSize: 12,
    color: COLORS.text3,
    lineHeight: 17,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationTxt: {
    flex: 1,
    fontSize: 12,
    color: COLORS.text3,
    lineHeight: 17,
  },
});
