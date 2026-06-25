import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { ArrowLeft, Calendar, Ship } from "lucide-react-native"; //flame
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import RecentlyViewedSection from "@/features/catalog/components/detail/RecentlyViewedSection";
import { COLORS } from "@/shared/colors";

const IMG_H = 280;
const TITLE = "Прогулки на теплоходе по рекам и каналам Санкт-Петербурга";

export function TourDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const HEADER_H = insets.top + 56;
  const TR_END = IMG_H - HEADER_H;
  const TR_START = TR_END - 60;

  const scrollY = useSharedValue(0);
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

  return (
    <View style={s.root}>
      {/* ── absolute sticky header ── */}
      <View style={[s.stickyHeader, { height: HEADER_H }]} pointerEvents="box-none">
        <Animated.View style={[StyleSheet.absoluteFill, s.headerWhiteBg, bgOpacity]} pointerEvents="none" />
        <Animated.View style={[s.headerBorder, borderOpacity]} pointerEvents="none" />

        {/* over-image: pill back button */}
        <Animated.View style={[StyleSheet.absoluteFill, overlayBtns]} pointerEvents="box-none">
          <View style={[s.headerInner, { paddingTop: insets.top }]} pointerEvents="box-none">
            <View style={s.headerRow} pointerEvents="box-none">
              <Pressable style={s.pillBtn} onPress={() => router.back()} hitSlop={8}>
                <ArrowLeft size={18} color={COLORS.brandNavy} strokeWidth={2.5} />
              </Pressable>
            </View>
          </View>
        </Animated.View>

        {/* white header: plain back + title */}
        <Animated.View style={[StyleSheet.absoluteFill, headerBtns]} pointerEvents="box-none">
          <View style={[s.headerInner, { paddingTop: insets.top }]} pointerEvents="box-none">
            <View style={s.headerRow} pointerEvents="box-none">
              <Pressable style={s.plainBtn} onPress={() => router.back()} hitSlop={8}>
                <ArrowLeft size={20} color={COLORS.text1} strokeWidth={2} />
              </Pressable>
              <Text style={s.headerTitle} numberOfLines={1}>{TITLE}</Text>
              <View style={s.plainBtn} />
            </View>
          </View>
        </Animated.View>
      </View>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      >
        <View style={s.imgWrap}>
          <Image
            source={require("../../../../assets/images/tep.png")}
            style={s.img}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        </View>

        <View style={s.card}>
          <View style={s.content}>
            {/* tags row */}
            <View style={s.tagsRow}>
              <View style={[s.tagFilled, { backgroundColor: COLORS.red }]}>
                <Text style={[s.tagFilledTxt, { color: "#fff" }]}>НОВИНКА</Text>
              </View>
              <View style={[s.tagFilled, { backgroundColor: "#EEE9FC" }]}>
                <Text style={[s.tagFilledTxt, { color: COLORS.brandViolet }]}>
                  СКОРО
                </Text>
              </View>
            </View>

            {/* title */}
            <Text style={s.title}>{TITLE}</Text>

            {/* coming soon note */}
            <View style={s.comingSoonRow}>
              <Text style={s.comingSoonTxt}>
                ⏳ Готовится к запуску · совсем скоро
              </Text>
            </View>

            {/* info card 1 */}
            <View style={s.infoCard}>
              <View style={s.infoIconWrap}>
                <Ship size={22} color={COLORS.red} strokeWidth={2} />
              </View>
              <Text style={s.infoTxt}>
                Мы готовим для вас удобный способ бронировать билеты на теплоход.
                Совсем скоро вы сможете купить их прямо в приложении — без
                очередей и звонков.
              </Text>
            </View>

            {/* info card 2 */}
            <View style={s.infoCard}>
              <View style={s.infoIconWrap}>
                <Calendar size={22} color={COLORS.brandNavy} strokeWidth={2} />
              </View>
              <Text style={s.infoTxt}>
                Скоро: ежедневно, каждый час, с 11:00 до 21:00
              </Text>
            </View>

            {/* discount preview */}
            <View style={s.discountCard}>
              <View style={s.discountLeft}>
                <Text style={s.discountFrom}>Скидки до</Text>
                <View style={s.discountRow}>
                  <Text style={s.discountPct}>20%</Text>
                </View>
                <Text style={s.discountSub}>эксклюзивно в приложении</Text>
              </View>
            </View>

            {/* coming soon closing */}
            <View style={s.closingWrap}>
              <Text style={s.closingTitle}>
                Северная столица — ближе, чем кажется
              </Text>
              <Text style={s.closingDesc}>
                Следите за обновлениями. Мы запустим теплоходы в приложении совсем
                скоро — чтобы ваш отдых стал ещё удобнее и ярче.
              </Text>
            </View>
          </View>
          <RecentlyViewedSection title="Рекомендуем" />
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.white },

  stickyHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  headerWhiteBg: { backgroundColor: COLORS.white },
  headerBorder: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
  },
  headerInner: { flex: 1, justifyContent: "center" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text1,
    marginHorizontal: 8,
  },
  pillBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
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

  imgWrap: {
    overflow: "hidden",
    height: IMG_H,
    backgroundColor: COLORS.muted,
  },
  img: {
    width: "100%",
    height: IMG_H,
  },

  card: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -28,
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 24,
    gap: 12,
  },

  tagsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  tagOutline: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagOutlineTxt: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.text2,
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

  title: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.text1,
    lineHeight: 29,
  },

  comingSoonRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  comingSoonTxt: {
    fontSize: 13,
    color: COLORS.text2,
  },

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
  infoTxt: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.text1,
  },

  discountCard: {
    backgroundColor: COLORS.greyLight,
    borderRadius: 14,
    padding: 16,
  },
  discountLeft: { gap: 4 },
  discountFrom: { fontSize: 13, color: COLORS.text2 },
  discountRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  discountPct: { fontSize: 28, fontWeight: "800", color: COLORS.red },
  discountSub: { fontSize: 12, color: COLORS.text2 },

  closingWrap: {
    backgroundColor: COLORS.greyLight,
    borderRadius: 18,
    padding: 20,
    gap: 8,
    marginTop: 4,
  },
  closingEmoji: { fontSize: 32 },
  closingTitle: {
    color: COLORS.text1,
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 23,
  },
  closingDesc: {
    color: COLORS.text1,
    fontSize: 13,
    lineHeight: 19,
  },
});
