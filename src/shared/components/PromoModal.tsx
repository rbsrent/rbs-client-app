import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { X } from "lucide-react-native";
import { useEffect, useRef } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { COLORS } from "@/shared/colors";
import { PromoData } from "@/shared/context/PromoContext";

interface Props {
  visible: boolean;
  data: PromoData | null;
  onClose: () => void;
}

const TIMING_IN  = { duration: 300, easing: Easing.out(Easing.ease) };
const TIMING_OUT = { duration: 220, easing: Easing.in(Easing.ease) };

export function PromoModal({ visible, data, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const progress = useSharedValue(0);

  const lastData = useRef<PromoData | null>(null);
  if (data) lastData.current = data;

  useEffect(() => {
    progress.value = withTiming(visible ? 1 : 0, visible ? TIMING_IN : TIMING_OUT);
  }, [visible]);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * 120 }],
  }));

  if (!lastData.current) return null;
  const d = lastData.current;

  const expired = d.expiresAt ? new Date(d.expiresAt).getTime() < Date.now() : false;

  const handleCta = () => {
    onClose();
    if (d.ctaUrl) router.push(d.ctaUrl as any);
  };

  return (
    <Animated.View style={[s.overlay, overlayStyle]} pointerEvents={visible ? "auto" : "none"}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

      <Animated.View style={[s.sheet, { paddingBottom: insets.bottom + 20 }, sheetStyle]}>
        <View style={s.handle} />

        <Pressable style={s.closeBtn} onPress={onClose} hitSlop={10}>
          <X size={18} color={COLORS.text2} strokeWidth={2} />
        </Pressable>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
          {d.imageUrl ? (
            <View style={s.cover}>
              <Image
                source={{ uri: d.imageUrl }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            </View>
          ) : null}

          <View style={s.info}>
            <Text style={s.title}>{d.title}</Text>
            {(d.description ?? d.body) ? (
              <Text style={s.desc}>{d.description ?? d.body}</Text>
            ) : null}

            {d.code ? (
              <View style={s.codeBox}>
                <Text style={s.codeLabel}>Промокод</Text>
                <Text style={s.codeValue} selectable>{d.code}</Text>
              </View>
            ) : null}

            {d.expiresAt ? (
              <Text style={s.expiry}>
                {expired ? "Акция завершена" : `Действует до ${fmtDate(d.expiresAt)}`}
              </Text>
            ) : null}
          </View>
        </ScrollView>

        {(d.ctaText || d.ctaUrl) && !expired ? (
          <Pressable
            style={({ pressed }) => [s.btn, pressed && { opacity: 0.88 }]}
            onPress={handleCta}
          >
            <Text style={s.btnTxt}>{d.ctaText ?? "Подробнее"}</Text>
          </Pressable>
        ) : (
          <Pressable
            style={({ pressed }) => [s.btn, pressed && { opacity: 0.88 }]}
            onPress={onClose}
          >
            <Text style={s.btnTxt}>Закрыть</Text>
          </Pressable>
        )}
      </Animated.View>
    </Animated.View>
  );
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
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
    maxHeight: "85%",
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
  scroll: {
    paddingBottom: 8,
  },
  cover: {
    height: 200,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: COLORS.greyLight,
  },
  info: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text1,
    marginBottom: 8,
  },
  desc: {
    fontSize: 15,
    lineHeight: 21,
    color: COLORS.text2,
  },
  codeBox: {
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.greyLight,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  codeLabel: {
    fontSize: 11,
    color: COLORS.text2,
    marginBottom: 2,
  },
  codeValue: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 1,
    color: COLORS.brandNavy,
  },
  expiry: {
    fontSize: 13,
    color: COLORS.warning,
    marginTop: 12,
  },
  btn: {
    marginHorizontal: 16,
    marginTop: 8,
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
