import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Heart,
  Map,
  MapPin,
  Share2,
  Star,
} from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
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
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getBoatPreview } from "@/shared/boatPreviewStore";
import { COLORS } from "@/shared/colors";
import { useWishlistPicker } from "@/shared/components/WishlistPickerContext";
import { useWishlistStore } from "@/store/useWishlistStore";

import BoatBookingBar from "@/features/catalog/components/BoatBookingBar";
import BoatImageSwiper, {
  SWIPER_IMG_H,
} from "@/features/catalog/components/BoatImageSwiper";
import SimilarBoats from "@/features/catalog/components/SimilarBoats";
import BoatDetailAmenities from "@/features/catalog/components/detail/BoatDetailAmenities";
import BoatDetailDescription from "@/features/catalog/components/detail/BoatDetailDescription";
import BoatDetailFeatures from "@/features/catalog/components/detail/BoatDetailFeatures";
import BoatDetailReviews from "@/features/catalog/components/detail/BoatDetailReviews";
import { BoatDetailSkeleton } from "@/features/catalog/components/detail/BoatDetailSkeleton";
import { PierLocationModal } from "@/features/catalog/components/detail/PierLocationModal";
import RecentlyViewedSection from "@/features/catalog/components/detail/RecentlyViewedSection";
import {
  buildBoatH1,
  getBoatH1,
  useBoatDetail,
} from "@/features/catalog/hooks/useBoatDetail";
import {
  useBoatAllDiscounts,
  useDiscountsCache,
} from "@/features/catalog/hooks/useDiscountsCache";

const CARD_OVERLAP = 28;

function Divider() {
  return <View style={s.divider} />;
}

export default function BoatDetailScreen() {
  const { id, selectedDate } = useLocalSearchParams<{
    id: string;
    selectedDate?: string;
  }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // captured once on mount — never re-reads store on re-render
  const preview = useRef(getBoatPreview(id as string)).current;

  const { boat, images, similar, reviews, reviewRating, isLoading } =
    useBoatDetail(id as string);

  const discountsMap = useDiscountsCache();
  const activeDiscount = boat ? (discountsMap.get(boat.id) ?? null) : null;
  const boatDiscounts = useBoatAllDiscounts(boat?.id ?? "");

  const [showPierMap, setShowPierMap] = useState(false);

  // wishlist
  const { openPicker } = useWishlistPicker();
  const saved = useWishlistStore((st) =>
    boat ? (st.saved[boat.id] ?? false) : false,
  );
  const checkBoat = useWishlistStore((st) => st.checkBoat);
  const removeBoatFromAll = useWishlistStore((st) => st.removeBoatFromAll);
  const refreshBoat = useWishlistStore((st) => st.refreshBoat);

  useEffect(() => {
    if (boat && useWishlistStore.getState().saved[boat.id] === undefined) {
      checkBoat(boat.id);
    }
  }, [boat?.id]);

  // animated header
  const scrollY = useSharedValue(0);
  const HEADER_H = insets.top + 56;
  const TR_END = SWIPER_IMG_H - HEADER_H;
  const TR_START = TR_END - 60;

  const scrollHandler = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  const bgOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [TR_START, TR_END],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));
  const borderOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [TR_START, TR_END],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));
  const overlayBtns = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [TR_START, TR_END],
      [1, 0],
      Extrapolation.CLAMP,
    ),
  }));
  const headerBtns = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [TR_START, TR_END],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));

  const handleShare = useCallback(async () => {
    try {
      const name = boat?.name ?? "Судно";
      const webUrl = `https://rbs.rent/catalog/${id}?from=share_${Platform.OS}`;
      const appUrl = `rbsrent://catalog/${id}`;
      await Share.share(
        Platform.OS === "ios"
          ? { title: name, message: appUrl, url: webUrl }
          : { title: name, message: `${name}\n${webUrl}` },
      );
    } catch {}
  }, [boat?.name, id]);

  const handleHeart = useCallback(async () => {
    if (!boat) return;
    const boatData = {
      boat_id: boat.id,
      name: boat.name,
      type: boat.type ?? null,
      cover_image_url: images[0] ?? null,
      price_per_hour: boat.price_per_hour,
      capacity: boat.capacity ?? null,
      length_meters: boat.length_meters ?? null,
      pier_name: boat.piers?.name ?? null,
      rating: null,
    };
    if (saved) {
      await removeBoatFromAll(boat.id);
    } else {
      openPicker(boatData, () => refreshBoat(boat.id));
    }
  }, [boat, images, saved, openPicker, removeBoatFromAll, refreshBoat]);

  const ratingStr = reviewRating.avg > 0 ? reviewRating.avg.toFixed(2) : "—";

  return (
    <View style={s.root}>
      {/* ── sticky animated header — always on top ── */}
      <View
        style={[s.stickyHeader, { height: HEADER_H }]}
        pointerEvents="box-none"
      >
        <Animated.View
          style={[StyleSheet.absoluteFill, s.headerWhiteBg, bgOpacity]}
          pointerEvents="none"
        />
        <Animated.View
          style={[s.headerBorder, borderOpacity]}
          pointerEvents="none"
        />

        {/* overlay: dark pill + white icon */}
        <Animated.View
          style={[StyleSheet.absoluteFill, overlayBtns]}
          pointerEvents="box-none"
        >
          <View
            style={[s.headerInner, { paddingTop: insets.top }]}
            pointerEvents="box-none"
          >
            <View style={s.headerRow} pointerEvents="box-none">
              <Pressable
                style={s.pillBtn}
                onPress={() => router.back()}
                hitSlop={8}
              >
                <ArrowLeft
                  size={18}
                  color={COLORS.brandNavy}
                  strokeWidth={2.5}
                />
              </Pressable>
              {!isLoading && (
                <View style={s.headerRight}>
                  <Pressable
                    style={s.pillBtn}
                    onPress={handleShare}
                    hitSlop={8}
                  >
                    <Share2
                      size={18}
                      color={COLORS.brandNavy}
                      strokeWidth={2.5}
                    />
                  </Pressable>
                  <Pressable
                    style={s.pillBtn}
                    onPress={handleHeart}
                    hitSlop={8}
                  >
                    <Heart
                      size={18}
                      color={saved ? "#E63946" : COLORS.brandNavy}
                      fill={saved ? "#E63946" : "transparent"}
                      strokeWidth={2.5}
                    />
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        </Animated.View>

        {/* header: plain dark icon */}
        {!isLoading && (
          <Animated.View
            style={[StyleSheet.absoluteFill, headerBtns]}
            pointerEvents="box-none"
          >
            <View
              style={[s.headerInner, { paddingTop: insets.top }]}
              pointerEvents="box-none"
            >
              <View style={s.headerRow} pointerEvents="box-none">
                <Pressable
                  style={s.plainBtn}
                  onPress={() => router.back()}
                  hitSlop={8}
                >
                  <ArrowLeft size={20} color="#222" strokeWidth={2} />
                </Pressable>
                <View style={s.headerRight}>
                  <Pressable
                    style={s.plainBtn}
                    onPress={handleShare}
                    hitSlop={8}
                  >
                    <Share2 size={20} color="#222" strokeWidth={2} />
                  </Pressable>
                  <Pressable
                    style={s.plainBtn}
                    onPress={handleHeart}
                    hitSlop={8}
                  >
                    <Heart
                      size={20}
                      color={saved ? "#E63946" : "#222"}
                      fill={saved ? "#E63946" : "transparent"}
                      strokeWidth={2}
                    />
                  </Pressable>
                </View>
              </View>
            </View>
          </Animated.View>
        )}
      </View>

      {/* ── scroll content ── */}
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        {/* image: preview cover while loading, full swiper after */}
        <BoatImageSwiper
          images={images}
          previewUri={preview?.cover}
          heroSharedTag={`boat-img-${id}`}
        />

        <View style={s.card}>
          {/* name — shown immediately from preview or boat */}
          <View style={s.titleBlock}>
            <View style={s.typeRow}>
              {reviewRating.avg > 0 ? (
                <View style={s.ratingTag}>
                  <Star
                    size={12}
                    color="#FFDA62"
                    fill="#FFDA62"
                    strokeWidth={0}
                  />
                  <Text style={s.ratingTagTxt}>{ratingStr}</Text>
                </View>
              ) : (
                <View style={s.newBadge}>
                  <Text style={s.newBadgeTxt}>Для вас</Text>
                </View>
              )}
              {/* {boat?.type ? (
                <View style={[s.tagFilled, { backgroundColor: COLORS.red }]}>
                  <Text style={[s.tagFilledTxt, { color: "#fff" }]}>
                    {boat.type.toLocaleUpperCase()}
                  </Text>
                </View>
              ) : null} */}

              {reviewRating.avg >= 4 && (
                <View style={s.badgeRow}>
                  {reviewRating.avg >= 5 && (
                    <View
                      style={[s.tagFilled, { backgroundColor: COLORS.red }]}
                    >
                      <Text style={[s.tagFilledTxt, { color: "#fff" }]}>
                        ХИТ
                      </Text>
                    </View>
                  )}
                  <View
                    style={[s.tagFilled, { backgroundColor: COLORS.warning }]}
                  >
                    <Text style={[s.tagFilledTxt, { color: "#fff" }]}>
                      ЛУЧШИЕ ОТЗЫВЫ
                    </Text>
                  </View>
                </View>
              )}
            </View>

            <Text style={s.boatName}>
              {boat ? getBoatH1(boat) : preview ? buildBoatH1(preview) : ""}
            </Text>

            {boatDiscounts.length > 0 && (
              <View style={s.discountTagRow}>
                {boatDiscounts.map((d, i) => (
                  <View
                    key={i}
                    style={[
                      s.tagFilled,
                      {
                        backgroundColor: d.isCurrentlyActive
                          ? COLORS.success
                          : COLORS.backgroundAlt,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        s.tagFilledTxt,
                        { color: d.isCurrentlyActive ? "#fff" : COLORS.grey },
                      ]}
                    >
                      {d.name} −{d.percentage}%
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* loading state — skeleton */}
          {isLoading ? (
            <BoatDetailSkeleton />
          ) : (
            <Animated.View entering={FadeIn.duration(260)}>
              <View style={s.hostRow}>
                <View style={s.hostAvatar}>
                  <MapPin size={18} color={COLORS.brandNavy} strokeWidth={2} />
                </View>
                <View style={{ flex: 1 }}>
                  {/* <Text style={s.hostName}>RBS Аренда</Text> */}
                  {boat?.piers ? (
                    <Pressable
                      style={s.pierMapRow}
                      onPress={() => {
                        if (boat.piers?.latitude && boat.piers?.longitude) {
                          setShowPierMap(true);
                        }
                      }}
                      hitSlop={4}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={s.hostName}>{boat.piers.name}</Text>
                        {boat.piers.address ? (
                          <Text style={s.hostSub}>{boat.piers.address}</Text>
                        ) : null}
                      </View>
                      {boat.piers.latitude && boat.piers.longitude ? (
                        <View style={s.mapIconBtn}>
                          <Map
                            size={18}
                            color={COLORS.brandNavy}
                            strokeWidth={1.8}
                          />
                        </View>
                      ) : null}
                    </Pressable>
                  ) : (
                    <Text style={s.hostSub}>Санкт-Петербург</Text>
                  )}
                </View>
              </View>

              <Divider />

              {boat ? <BoatDetailFeatures boat={boat} /> : null}

              <Divider />

              {boat?.description ? (
                <>
                  <BoatDetailDescription description={boat.description} />
                  <Divider />
                </>
              ) : null}

              {similar.length > 0 ? (
                <>
                  <SimilarBoats boats={similar} onPress={() => {}} />
                  <Divider />
                </>
              ) : null}

              {boat ? <BoatDetailAmenities boat={boat} /> : null}

              <Divider />

              <BoatDetailReviews
                reviews={reviews}
                reviewRating={reviewRating}
                boatId={boat?.id ?? ""}
              />

              <RecentlyViewedSection currentBoatId={id as string} />
            </Animated.View>
          )}
        </View>
      </Animated.ScrollView>

      {/* booking bar — only after load */}
      {!isLoading && boat ? (
        <BoatBookingBar
          pricePerHour={boat.price_per_hour}
          priceNight={boat.public_price_per_hour_night}
          discount={activeDiscount}
          onBook={() => {
            const p = new URLSearchParams({ boatId: boat.id });
            if (selectedDate) p.set("date", selectedDate);
            p.set("boatName", getBoatH1(boat));
            if (boat.piers?.name) p.set("pierName", boat.piers.name);
            if (boat.piers?.address) p.set("pierAddress", boat.piers.address);
            router.push(`/booking/date-select?${p.toString()}` as any);
          }}
          paddingBottom={insets.bottom + 8}
        />
      ) : null}

      {boat?.piers?.latitude && boat?.piers?.longitude ? (
        <PierLocationModal
          visible={showPierMap}
          name={boat.piers.name}
          address={boat.piers.address}
          latitude={boat.piers.latitude}
          longitude={boat.piers.longitude}
          onClose={() => setShowPierMap(false)}
        />
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },

  card: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -CARD_OVERLAP,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 6,
  },

  titleBlock: {
    alignItems: "flex-start",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    gap: 4,
  },
  boatName: {
    fontSize: 24,
    fontWeight: "500",
    color: "#000",
    textAlign: "left",
    lineHeight: 34,
  },
  boatSub: {
    fontSize: 14,
    color: "#6A6A6A",
    textAlign: "left",
    lineHeight: 21,
  },

  typeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    alignSelf: "stretch",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  ratingTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: COLORS.greyLight2,
  },
  ratingTagTxt: { fontSize: 12, fontWeight: "700", color: "#000" },
  statsBig: {
    fontSize: 18,
    fontWeight: "500",
    color: "#000",
    textAlign: "center",
  },
  statsSmall: {
    fontSize: 12,
    fontWeight: "500",
    color: "#222",
    textAlign: "center",
  },
  vSep: {
    width: 1,
    height: 32,
    backgroundColor: "#DDDDDD",
    marginHorizontal: 4,
  },
  newBadge: {
    backgroundColor: COLORS.brandNavy,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  newBadgeTxt: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.5,
  },

  divider: { height: 1, backgroundColor: "#DDDDDD", marginHorizontal: 24 },

  hostRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  hostAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.brandNavy + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  hostName: { fontSize: 14, fontWeight: "500", color: "#222" },
  hostSub: { fontSize: 14, color: "#6A6A6A" },
  pierMapRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  pierAddrSub: { fontSize: 12, color: COLORS.text3, flex: 1 },
  mapIconBtn: {
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },

  stickyHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  headerWhiteBg: { backgroundColor: "#fff" },
  headerBorder: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#DDDDDD",
  },
  headerInner: { flex: 1, justifyContent: "center" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
  },
  headerRight: { flexDirection: "row", gap: 8 },
  pillBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    // backgroundColor: "rgba(0,0,0,0.38)",
    backgroundColor: COLORS.greyLight2,
    alignItems: "center",
    justifyContent: "center",
  },
  plainBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },

  tagFilled: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagFilledTxt: {
    fontSize: 12,
    fontWeight: "700",
  },
  discountTagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },

  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  bestBadge: {
    backgroundColor: "rgba(37,160,119,0.12)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  hitBadge: {
    backgroundColor: "rgba(230,126,34,0.12)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  bestBadgeTxt: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1a7a5a",
  },
  hitBadgeTxt: {
    fontSize: 11,
    fontWeight: "600",
    color: "#c0621a",
  },
});
