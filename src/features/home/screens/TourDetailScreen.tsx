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
// title appears in header after scrolling past image + tags (~60px)
const TITLE_THRESHOLD = IMG_H + 60;

export function TourDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

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

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top }]}>
        <Pressable style={s.backBtn} onPress={() => router.back()} hitSlop={10}>
          <ArrowLeft size={22} color={COLORS.text1} strokeWidth={2} />
        </Pressable>
        <Animated.Text
          style={[s.headerTitle, headerTitleStyle]}
          numberOfLines={1}
        >
          Прогулки на теплоходе по рекам и каналам Санкт-Петербурга
        </Animated.Text>
      </View>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          s.scroll,
          { paddingBottom: insets.bottom + 32 },
        ]}
      >
        <View style={s.imgWrap}>
          <Image
            source={require("../../../../assets/images/tep.png")}
            style={s.img}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        </View>

        <View style={s.content}>
          {/* tags row */}
          <View style={s.tagsRow}>
            {/* <View style={s.tagOutline}>
              <Text style={s.tagOutlineTxt}>0+</Text>
            </View> */}
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
          <Text style={s.title}>
            Прогулки на теплоходе по рекам и каналам Санкт-Петербурга
          </Text>

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
                {/* <View style={s.discountBadge}>
                  <Text style={s.discountBadgeTxt}>−20%</Text>
                </View> */}
              </View>
              <Text style={s.discountSub}>эксклюзивно в приложении</Text>
            </View>
          </View>

          {/* coming soon closing */}
          <View style={s.closingWrap}>
            {/* <Text style={s.closingEmoji}>🚢</Text> */}
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
      </Animated.ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.white },

  header: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text1,
    marginRight: 16,
  },

  scroll: { gap: 0 },

  imgWrap: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: "hidden",
    height: IMG_H,
    backgroundColor: COLORS.muted,
  },
  img: {
    width: "100%",
    height: IMG_H,
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
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
  // discountBadge: {
  //   backgroundColor: COLORS.red,
  //   borderRadius: 10,
  //   paddingHorizontal: 8,
  //   paddingVertical: 3,
  // },
  // discountBadgeTxt: { color: "#fff", fontSize: 13, fontWeight: "700" },
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
