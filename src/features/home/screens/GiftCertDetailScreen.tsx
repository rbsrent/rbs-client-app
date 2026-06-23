import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ArrowLeft, Clock, Gift, Heart, Mail, Wallet } from "lucide-react-native";
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
const TITLE_THRESHOLD = IMG_H + 60;

export function GiftCertDetailScreen() {
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
          Подарочный сертификат
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
        {/* Hero image (gradient stand-in) */}
        <View style={s.imgWrap}>
          <LinearGradient
            colors={["#0D1F35", "#1B2A41", "#2D1B5E"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {/* decorative blobs */}
          <View style={s.blob1} />
          <View style={s.blob2} />
          {/* centered icon */}
          <View style={s.heroCenter}>
            <View style={s.heroIconRing}>
              <Gift size={56} color="#fff" strokeWidth={1.4} />
            </View>
            <Text style={s.heroPrice}>от 5 000 ₽</Text>
            <Text style={s.heroSub}>Подарите незабываемые впечатления</Text>
          </View>
        </View>

        <View style={s.content}>
          {/* tags */}
          <View style={s.tagsRow}>
            <View style={[s.tagFilled, { backgroundColor: "#EEF9FE" }]}>
              <Text style={[s.tagFilledTxt, { color: COLORS.brandBlue }]}>PDF на e-mail</Text>
            </View>
            <View style={[s.tagFilled, { backgroundColor: "#EEE9FC" }]}>
              <Text style={[s.tagFilledTxt, { color: COLORS.brandViolet }]}>Действует 1 год</Text>
            </View>
          </View>

          {/* title */}
          <Text style={s.title}>Подарок на прогулку{"\n"}для близких</Text>

          {/* info card 1 */}
          <View style={s.infoCard}>
            <View style={s.infoIconWrap}>
              <Wallet size={22} color={COLORS.brandBlue} strokeWidth={2} />
            </View>
            <Text style={s.infoTxt}>
              Выберите номинал от 5 000 до 50 000 ₽. Остаток сохраняется при
              частичном использовании — деньги не сгорают.
            </Text>
          </View>

          {/* info card 2 */}
          <View style={s.infoCard}>
            <View style={s.infoIconWrap}>
              <Mail size={22} color={COLORS.brandViolet} strokeWidth={2} />
            </View>
            <Text style={s.infoTxt}>
              После оплаты красивый PDF-сертификат с уникальным кодом придёт
              на e-mail — можно распечатать и вручить лично.
            </Text>
          </View>

          {/* info card 3 */}
          <View style={s.infoCard}>
            <View style={s.infoIconWrap}>
              <Heart size={22} color={COLORS.red} strokeWidth={2} />
            </View>
            <Text style={s.infoTxt}>
              Получатель сам выбирает дату, маршрут и судно. При оформлении
              аренды вводит код — сумма списывается автоматически.
            </Text>
          </View>

          {/* info card 4 */}
          <View style={s.infoCard}>
            <View style={s.infoIconWrap}>
              <Clock size={22} color={COLORS.warning} strokeWidth={2} />
            </View>
            <Text style={s.infoTxt}>
              Действует 12 месяцев с даты покупки. Успейте организовать
              незабываемую прогулку по рекам и каналам.
            </Text>
          </View>

          {/* discount card (value prop) */}
          <View style={s.discountCard}>
            <View style={s.discountLeft}>
              <Text style={s.discountFrom}>Номиналы</Text>
              <View style={s.discountRow}>
                <Text style={s.discountPct}>50 000 ₽</Text>
              </View>
              <Text style={s.discountSub}>максимальный номинал</Text>
            </View>
          </View>

          {/* CTA closing */}
          <View style={s.closingWrap}>
            <View style={s.closingRow}>
              <Text style={s.closingTitle}>Оформите за 2 минуты</Text>
            </View>
            <Text style={s.closingDesc}>
              Эксклюзивно в приложении. Заполните форму, выберите номинал —
              сертификат придёт мгновенно.
            </Text>
            <Pressable
              style={({ pressed }) => [s.ctaBtn, pressed && { opacity: 0.88 }]}
              onPress={() => router.push("/certificates" as any)}
            >
              <Gift size={17} color="#fff" strokeWidth={2} />
              <Text style={s.ctaBtnTxt}>Оформить сертификат</Text>
            </Pressable>
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

  /* hero */
  imgWrap: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: "hidden",
    height: IMG_H,
    backgroundColor: COLORS.muted,
    justifyContent: "center",
    alignItems: "center",
  },
  blob1: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(123,92,230,0.2)",
    top: -50,
    right: 20,
  },
  blob2: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(32,134,199,0.2)",
    bottom: -30,
    left: 10,
  },
  heroCenter: {
    alignItems: "center",
    gap: 12,
    zIndex: 1,
  },
  heroIconRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  heroPrice: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  heroSub: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
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
  discountPct: { fontSize: 28, fontWeight: "800", color: COLORS.brandNavy },
  discountSub: { fontSize: 12, color: COLORS.text2 },

  closingWrap: {
    backgroundColor: COLORS.greyLight,
    borderRadius: 18,
    padding: 20,
    gap: 10,
    marginTop: 4,
  },
  closingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  closingTitle: {
    color: COLORS.text1,
    fontSize: 17,
    fontWeight: "700",
  },
  closingDesc: {
    color: COLORS.text2,
    fontSize: 13,
    lineHeight: 19,
  },
  ctaBtn: {
    height: 52,
    backgroundColor: COLORS.brandNavy,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
  },
  ctaBtnTxt: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});
