import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Star } from "lucide-react-native";
import { memo } from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";

import { ActiveDiscount } from "@/features/catalog/hooks/useDiscountsCache";
import { AvailInfo } from "@/features/catalog/utils/filterUtils";
import { setBoatPreview } from "@/shared/boatPreviewStore";
import { COLORS } from "@/shared/colors";
import { HeartButton } from "./HeartButton";

const { width: W } = Dimensions.get("window");

// Two layout modes
// grid  — fills half the parent row (AllBoats / SimilarBoats)
// strip — fixed width for horizontal scroll (Home popular rows)
export type BoatCardLayout = "grid" | "strip";

export interface BoatCardData {
  id: string;
  name: string;
  type?: string | null;
  cover_image_url?: string | null;
  /** raw image_path from boat_images — used for progressive loading */
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
  /** route to push on press — default: /catalog/${id} */
  route?: string;
}

const GRID_W = (W - 16 * 2 - 12) / 2;
const STRIP_W = W * 0.46;

const ruNum = (n: number) =>
  new Intl.NumberFormat("ru-RU").format(Math.round(n));
const GRID_IMG_H = Math.round(GRID_W * 1.05);
const STRIP_IMG_H = Math.round(STRIP_W * 1.05);

function availBadgeLabel(info: AvailInfo): string | null {
  if (info.status === "fully_available")
    return `Свободен ${info.available_hours}ч`;
  if (info.status === "partially_available") {
    const booked = info.total_hours_in_period - info.available_hours;
    return `Частично занят ${booked}ч из ${info.total_hours_in_period}ч`;
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
}: Props) {
  const router = useRouter();
  const hasRate = (boat.rating ?? 0) > 0;
  const imgH = layout === "strip" ? STRIP_IMG_H : GRID_IMG_H;
  const cardSrc = boat.cover_image_url ?? null;
  const typeLabel = boat.type ?? null;
  const availLabel = availInfo ? availBadgeLabel(availInfo) : null;

  return (
    <Pressable
      style={({ pressed }) => [
        s.card,
        {
          width: layout === "strip" ? STRIP_W : undefined,
          flex: layout === "grid" ? 1 : undefined,
        },
        pressed && { opacity: 0.92 },
      ]}
      onPress={() => {
        setBoatPreview({
          id: boat.id,
          name: boat.name,
          cover: boat.cover_image_url ?? null,
        });
        router.push((route ?? `/catalog/${boat.id}`) as any);
      }}
    >
      <View style={[s.imgWrap, { height: imgH }]}>
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
          <View
            style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.muted }]}
          />
        )}
        <View style={s.imgTopRow}>
          {discount ? (
            <View style={[s.badge, s.badgePromo]}>
              <Text style={[s.badgeTxt, s.badgePromoTxt]}>{discount.percentage}%</Text>
            </View>
          ) : badge ? (
            <View style={s.badge}>
              <Text style={s.badgeTxt}>{badge}</Text>
            </View>
          ) : (
            <View />
          )}
          <HeartButton
            boat={{
              boat_id: boat.id,
              name: boat.name,
              type: boat.type ?? null,
              cover_image_url: boat.cover_image_url ?? null,
              price_per_hour: boat.price_per_hour,
              capacity: boat.capacity ?? null,
              length_meters: boat.length_meters ?? null,
              pier_name: boat.pier_name ?? null,
              rating: boat.rating ?? null,
            }}
            size={20}
          />
        </View>
        {availLabel ? (
          <View
            style={[
              s.availBadge,
              availInfo!.status === "fully_available"
                ? s.availBadgeGreen
                : s.availBadgeOrange,
            ]}
          >
            <Text style={s.availBadgeTxt}>{availLabel}</Text>
          </View>
        ) : null}
      </View>

      <View style={s.info}>
        <View style={s.nameRow}>
          <Text style={s.name} numberOfLines={2}>
            {boat.name}
          </Text>
          {hasRate ? (
            <View style={s.ratingRow}>
              <Star size={11} color={COLORS.text3} fill={COLORS.text3} strokeWidth={0} />
              <Text style={s.sub}>{boat.rating!.toFixed(2)}</Text>
            </View>
          ) : null}
        </View>
        <Text style={s.sub} numberOfLines={1}>
          {[
            typeLabel,
            boat.capacity ? `до ${boat.capacity} чел.` : null,
            boat.length_meters ? `${boat.length_meters} м` : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </Text>
        <Text style={s.price}>
          <Text style={s.priceBold}>{ruNum(boat.price_per_hour)} ₽</Text>
          <Text style={s.priceUnit}> / час</Text>
        </Text>
      </View>
    </Pressable>
  );
});

const s = StyleSheet.create({
  card: {},
  imgWrap: {
    borderRadius: 12,
    backgroundColor: COLORS.muted,
    overflow: "hidden",
  },
  imgTopRow: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 8,
  },
  badge: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  badgeTxt: { fontSize: 10, fontWeight: "600", color: COLORS.text1 },
  badgePromo: { backgroundColor: "rgba(234, 179, 8, 0.95)" },
  badgePromoTxt: { color: "#fff" },
  availBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  availBadgeGreen: { backgroundColor: "rgba(22, 163, 74, 0.88)" },
  availBadgeOrange: { backgroundColor: "rgba(234, 88, 12, 0.88)" },
  availBadgeTxt: { fontSize: 10, fontWeight: "700", color: "#fff" },
  info: { paddingTop: 8, gap: 2 },
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  name: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text1,
    flex: 1,
    marginRight: 6,
    lineHeight: 18,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginTop: 1,
  },
  ratingTxt: { fontSize: 12, fontWeight: "600", color: COLORS.text1 },
  sub: { fontSize: 12, color: COLORS.text3, lineHeight: 17 },
  price: { marginTop: 1 },
  priceBold: { fontSize: 12, fontWeight: "700", color: COLORS.text1 },
  priceUnit: { fontSize: 12, color: COLORS.text3 },
});
