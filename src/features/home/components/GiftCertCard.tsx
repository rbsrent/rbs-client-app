import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Clock, Gift, Mail } from "lucide-react-native";
import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { COLORS } from "@/shared/colors";

const CARD_H = 260;

export const GiftCertCard = memo(function GiftCertCard() {
  const router = useRouter();

  return (
    <View>
      <Pressable
        style={({ pressed }) => [s.card, pressed && { opacity: 0.9 }]}
        onPress={() => router.push("/gift-cert" as any)}
      >
        <Image
          source={require("../../../../assets/images/captain.png")}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy="memory-disk"
        />

        <View style={[StyleSheet.absoluteFill, s.dim]} />

        <LinearGradient
          colors={["rgba(0,0,0,0.35)", "rgba(0,0,0,0.75)"]}
          style={[StyleSheet.absoluteFill, s.gradient]}
        >
          {/* top content */}
          <View style={s.top}>
            <View style={s.titleRow}>
              <Gift size={20} color={COLORS.white} strokeWidth={1.8} />
              <Text style={s.title}>Подарите прогулку близким</Text>
            </View>

            <View style={s.pillsRow}>
              <View style={s.pill}>
                <Mail size={11} color="rgba(255,255,255,0.85)" strokeWidth={2} />
                <Text style={s.pillTxt}>PDF на e-mail</Text>
              </View>
              <View style={s.pill}>
                <Clock size={11} color="rgba(255,255,255,0.85)" strokeWidth={2} />
                <Text style={s.pillTxt}>Действует 1 год</Text>
              </View>
              <View style={s.pill}>
                <Text style={s.pillTxt}>5 000 – 50 000 ₽</Text>
              </View>
            </View>

            <Text style={s.desc}>
              Оформите за 2 минуты — получатель сам выбирает дату и маршрут
            </Text>
          </View>

          {/* button absolute bottom-right */}
          <View style={s.ctaBtn}>
            <Text style={s.ctaTxt}>Купить сертификат</Text>
          </View>
        </LinearGradient>
      </Pressable>
    </View>
  );
});

const s = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    height: CARD_H,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: COLORS.brandNavy,
  },
  dim: {
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  gradient: {
    padding: 16,
    flex: 1,
  },
  top: {
    gap: 10,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 24,
  },
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  pillTxt: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 11,
    fontWeight: "600",
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
  },
  desc: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    lineHeight: 18,
  },
  ctaBtn: {
    position: "absolute",
    bottom: 16,
    right: 16,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  ctaTxt: {
    color: COLORS.brandNavy,
    fontSize: 12,
    fontWeight: "700",
  },
});
