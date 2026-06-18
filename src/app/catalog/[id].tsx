import { useLocalSearchParams, useRouter } from "expo-router";
import { Anchor, ArrowLeft, Heart, Share2 } from "lucide-react-native";
import { useCallback, useEffect, useRef } from "react";
import {
  ActivityIndicator,
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
import { useBoatDetail } from "@/features/catalog/hooks/useBoatDetail";

const CARD_OVERLAP = 28;

function Divider() {
  return <View style={s.divider} />;
}

export default function BoatDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // captured once on mount — never re-reads store on re-render
  const preview = useRef(getBoatPreview(id as string)).current;

  const { boat, images, similar, reviews, reviewRating, isLoading } =
    useBoatDetail(id as string);

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
    opacity: interpolate(scrollY.value, [TR_START, TR_END], [0, 1], Extrapolation.CLAMP),
  }));
  const borderOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [TR_START, TR_END], [0, 1], Extrapolation.CLAMP),
  }));
  const overlayBtns = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [TR_START, TR_END], [1, 0], Extrapolation.CLAMP),
  }));
  const headerBtns = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [TR_START, TR_END], [0, 1], Extrapolation.CLAMP),
  }));

  const handleShare = useCallback(async () => {
    try {
      await Share.share({ message: `${boat?.name ?? "Судно"} — аренда на rbs.rent` });
    } catch {}
  }, [boat?.name]);

  const handleHeart = useCallback(async () => {
    if (!boat) return;
    const boatData = {
      boat_id:         boat.id,
      name:            boat.name,
      type:            boat.type            ?? null,
      cover_image_url: images[0]            ?? null,
      price_per_hour:  boat.price_per_hour,
      capacity:        boat.capacity        ?? null,
      length_meters:   boat.length_meters   ?? null,
      pier_name:       boat.piers?.name     ?? null,
      rating:          null,
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
      <View style={[s.stickyHeader, { height: HEADER_H }]} pointerEvents="box-none">
        <Animated.View
          style={[StyleSheet.absoluteFill, s.headerWhiteBg, bgOpacity]}
          pointerEvents="none"
        />
        <Animated.View style={[s.headerBorder, borderOpacity]} pointerEvents="none" />

        {/* overlay: dark pill + white icon */}
        <Animated.View style={[StyleSheet.absoluteFill, overlayBtns]} pointerEvents="box-none">
          <View style={[s.headerInner, { paddingTop: insets.top }]} pointerEvents="box-none">
            <View style={s.headerRow} pointerEvents="box-none">
              <Pressable style={s.pillBtn} onPress={() => router.back()} hitSlop={8}>
                <ArrowLeft size={18} color="#fff" strokeWidth={2.5} />
              </Pressable>
              {!isLoading && (
                <View style={s.headerRight}>
                  <Pressable style={s.pillBtn} onPress={handleShare} hitSlop={8}>
                    <Share2 size={18} color="#fff" strokeWidth={2.5} />
                  </Pressable>
                  <Pressable style={s.pillBtn} onPress={handleHeart} hitSlop={8}>
                    <Heart
                      size={18}
                      color={saved ? "#E63946" : "#fff"}
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
          <Animated.View style={[StyleSheet.absoluteFill, headerBtns]} pointerEvents="box-none">
            <View style={[s.headerInner, { paddingTop: insets.top }]} pointerEvents="box-none">
              <View style={s.headerRow} pointerEvents="box-none">
                <Pressable style={s.plainBtn} onPress={() => router.back()} hitSlop={8}>
                  <ArrowLeft size={20} color="#222" strokeWidth={2} />
                </Pressable>
                <View style={s.headerRight}>
                  <Pressable style={s.plainBtn} onPress={handleShare} hitSlop={8}>
                    <Share2 size={20} color="#222" strokeWidth={2} />
                  </Pressable>
                  <Pressable style={s.plainBtn} onPress={handleHeart} hitSlop={8}>
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
        />

        <View style={s.card}>
          {/* name — shown immediately from preview or boat */}
          <View style={s.titleBlock}>
            <Text style={s.boatName}>{boat?.name ?? preview?.name ?? ""}</Text>
            {boat?.type ? <Text style={s.boatSub}>{boat.type}</Text> : null}
            {boat?.piers?.name ? <Text style={s.boatSub}>{boat.piers.name}</Text> : null}
          </View>

          {/* loading state — spinner only */}
          {isLoading ? (
            <ActivityIndicator
              color={COLORS.brandNavy}
              size="small"
              style={{ marginBottom: 36 }}
            />
          ) : boat ? (
            /* ── full content fades in after load ── */
            <Animated.View entering={FadeIn.duration(260)}>
              <View style={s.statsRow}>
                <View style={s.statsCell}>
                  {reviewRating.avg > 0 ? (
                    <Text style={s.statsBig}>★ {ratingStr}</Text>
                  ) : (
                    <View style={s.newBadge}>
                      <Text style={s.newBadgeTxt}>Для вас</Text>
                    </View>
                  )}
                </View>
                <View style={s.vSep} />
                <View style={s.statsCell}>
                  {boat.capacity ? (
                    <Text style={s.statsBig}>{boat.capacity} чел.</Text>
                  ) : null}
                  {boat.length_meters ? (
                    <Text style={s.statsSmall}>{boat.length_meters} м</Text>
                  ) : null}
                </View>
                <View style={s.vSep} />
                <View style={s.statsCell}>
                  <Text style={s.statsBig}>{reviewRating.total}</Text>
                  <Text style={s.statsSmall}>Отзывы</Text>
                </View>
              </View>

              <Divider />

              <View style={s.hostRow}>
                <View style={s.hostAvatar}>
                  <Anchor size={18} color={COLORS.brandNavy} strokeWidth={2} />
                </View>
                <View>
                  <Text style={s.hostName}>RBS Аренда</Text>
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    {/* <Text style={s.hostSub}>Суперхозяин</Text> */}
                    <Text style={s.hostSub}>{boat.piers?.name ?? "Санкт-Петербург"}</Text>
                  </View>
                </View>
              </View>

              <Divider />

              <BoatDetailFeatures boat={boat} />

              <Divider />

              {boat.description ? (
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

              <BoatDetailAmenities boat={boat} />

              <Divider />

              <BoatDetailReviews
                reviews={reviews}
                reviewRating={reviewRating}
                boatId={boat.id}
              />
            </Animated.View>
          ) : null}
        </View>
      </Animated.ScrollView>

      {/* booking bar — only after load */}
      {!isLoading && boat ? (
        <BoatBookingBar
          pricePerHour={boat.price_per_hour}
          priceNight={boat.public_price_per_hour_night}
          onBook={() => router.push(`/booking/${boat.id}` as any)}
          paddingBottom={insets.bottom + 8}
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
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    gap: 4,
  },
  boatName: {
    fontSize: 24,
    fontWeight: "500",
    color: "#000",
    textAlign: "center",
    lineHeight: 34,
  },
  boatSub: { fontSize: 14, color: "#6A6A6A", textAlign: "center", lineHeight: 21 },

  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  statsCell:  { flex: 1, alignItems: "center", gap: 2 },
  statsBig:   { fontSize: 18, fontWeight: "500", color: "#000", textAlign: "center" },
  statsSmall: { fontSize: 12, fontWeight: "500", color: "#222", textAlign: "center" },
  vSep:       { width: 1, height: 32, backgroundColor: "#DDDDDD", marginHorizontal: 4 },
  newBadge:   { backgroundColor: COLORS.brandNavy, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  newBadgeTxt: { fontSize: 11, fontWeight: "700", color: "#fff", letterSpacing: 0.5 },

  divider: { height: 1, backgroundColor: "#DDDDDD", marginHorizontal: 24 },

  hostRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  hostAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.brandNavy + "15",
    alignItems: "center", justifyContent: "center",
  },
  hostName: { fontSize: 14, fontWeight: "500", color: "#222" },
  hostSub:  { fontSize: 14, color: "#6A6A6A" },

  stickyHeader:  { position: "absolute", top: 0, left: 0, right: 0, zIndex: 100 },
  headerWhiteBg: { backgroundColor: "#fff" },
  headerBorder: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#DDDDDD",
  },
  headerInner: { flex: 1, justifyContent: "center" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  headerRight: { flexDirection: "row", gap: 8 },
  pillBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.38)",
    alignItems: "center", justifyContent: "center",
  },
  plainBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: "center", justifyContent: "center",
  },
});
