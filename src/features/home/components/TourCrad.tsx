import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { COLORS } from "@/shared/colors";

const CARD_H = 236;

export function TourCard() {
  const router = useRouter();

  return (
    <View>
      <View style={s.header}>
        <Text style={s.headerTitle}>Скоро для вас</Text>
      </View>

      <Pressable
        style={({ pressed }) => [s.card, pressed && { opacity: 0.9 }]}
        onPress={() => router.push('/services/teplokhod' as any)}
      >
        <Image
          source={require("../../../../assets/images/tep.png")}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy="memory-disk"
        />

        <View style={[StyleSheet.absoluteFill, s.dim]} />

        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.78)"]}
          style={[StyleSheet.absoluteFill, s.gradient]}
        >
          <Text style={s.title}>Прогулки на теплоходе</Text>
          <Text style={s.desc}>
            Покупайте билеты онлайн со скидками до 20% прямо в приложении
          </Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    width: "100%",
    height: CARD_H,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: COLORS.brandNavy,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  headerTitle: { fontSize: 18, fontWeight: "600", color: COLORS.text1 },
  dim: {
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  gradient: {
    justifyContent: "flex-end",
    padding: 16,
    gap: 5,
  },
  title: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 24,
  },
  desc: {
    color: "rgba(255,255,255,0.76)",
    fontSize: 12,
    lineHeight: 18,
  },
});
