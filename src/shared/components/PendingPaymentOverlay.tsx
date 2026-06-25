import * as Linking from "expo-linking";
import { useRouter, useSegments } from "expo-router";
import { openAuthSessionAsync } from "expo-web-browser";
import { Clock } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { publicSupabase } from "@/shared/supabase/publicClient";
import { usePendingPayment } from "@/shared/context/PendingPaymentContext";
import { Spinner } from "./Spinner";

const TAB_BAR_H = 60;

// Screens where the overlay should be hidden (user is already in booking flow)
const HIDDEN_SEGMENTS = ["booking"];

export function PendingPaymentOverlay() {
  const { pending, clear } = usePendingPayment();
  const segments = useSegments();
  const { bottom } = useSafeAreaInsets();
  const router = useRouter();
  const [paying, setPaying] = useState(false);

  const visible = useSharedValue(0);

  // Animate in/out
  const isHiddenRoute = HIDDEN_SEGMENTS.some((s) => segments.includes(s as any));
  const shouldShow = !!pending && !isHiddenRoute;

  useEffect(() => {
    if (shouldShow) {
      visible.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) });
    } else {
      visible.value = withTiming(0, { duration: 200, easing: Easing.in(Easing.ease) });
    }
  }, [shouldShow]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: visible.value,
    transform: [{ translateY: (1 - visible.value) * 20 }],
  }));

  if (!pending) return null;

  const handleResume = async () => {
    setPaying(true);
    const returnUrl = Linking.createURL("booking/return");
    await openAuthSessionAsync(pending.confirmationUrl, returnUrl, {
      showInRecents: true,
    });
    // Always poll after browser closes — user may have paid before dismissing
    let attempts = 0;
    const poll = setInterval(async () => {
      attempts++;
      const { data } = await publicSupabase
        .from("public_bookings")
        .select("booking_status")
        .eq("id", pending.bookingId)
        .single();
      const status = (data as any)?.booking_status;
      if (status === "confirmed" || status === "paid" || status === "partially_paid") {
        clearInterval(poll);
        setPaying(false);
        await clear();
        router.push(`/bookings/${pending.bookingId}` as any);
      } else if (status === "cancelled" || attempts >= 20) {
        clearInterval(poll);
        setPaying(false);
        if (status === "cancelled") await clear();
      }
    }, 2000);
  };

  const handleCancel = () => {
    Alert.alert(
      "Отменить бронирование?",
      "Незавершённая бронь будет отменена. Вы сможете создать новую.",
      [
        { text: "Назад", style: "cancel" },
        {
          text: "Отменить бронь",
          style: "destructive",
          onPress: async () => {
            await publicSupabase
              .from("public_bookings")
              .update({ booking_status: "cancelled" })
              .eq("id", pending.bookingId);
            await clear();
          },
        },
      ],
    );
  };

  return (
    <Animated.View
      style={[
        s.container,
        { bottom: TAB_BAR_H + bottom + 8 },
        animStyle,
      ]}
      pointerEvents={shouldShow ? "auto" : "none"}
    >
      <View style={s.row}>
        <View style={s.iconWrap}>
          <Clock size={18} color="#C47A00" strokeWidth={2} />
        </View>
        <View style={s.textWrap}>
          <Text style={s.title}>Незавершённая оплата</Text>
          <Text style={s.sub} numberOfLines={1}>
            {pending.amount.toLocaleString("ru-RU")} ₽ · ждёт подтверждения
          </Text>
        </View>
        <View style={s.actions}>
          <Pressable
            style={({ pressed }) => [s.resumeBtn, pressed && { opacity: 0.7 }]}
            onPress={handleResume}
            disabled={paying}
          >
            {paying ? (
              <Spinner size={14} color="#fff" />
            ) : (
              <Text style={s.resumeTxt}>Оплатить</Text>
            )}
          </Pressable>
          <Pressable
            style={({ pressed }) => [s.cancelBtn, pressed && { opacity: 0.6 }]}
            onPress={handleCancel}
            disabled={paying}
            hitSlop={8}
          >
            <Text style={s.cancelTxt}>✕</Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: {
    position: "absolute",
    left: 12,
    right: 12,
    backgroundColor: "#FFF8E7",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F5C842",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 999,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FEE9A0",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  textWrap: { flex: 1, gap: 2 },
  title: { fontSize: 13, fontWeight: "700", color: "#7A5000" },
  sub: { fontSize: 12, color: "#9A6800" },
  actions: { flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 0 },
  resumeBtn: {
    backgroundColor: "#C47A00",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 72,
  },
  resumeTxt: { fontSize: 13, fontWeight: "700", color: "#fff" },
  cancelBtn: {
    padding: 4,
  },
  cancelTxt: { fontSize: 14, color: "#9A6800", fontWeight: "600" },
});
