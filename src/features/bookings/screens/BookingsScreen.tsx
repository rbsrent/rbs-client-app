import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { COLORS } from "@/shared/colors";
import { authSupabase } from "@/shared/supabase/authClient";
import { phoneVariants } from "@/shared/utils/phone";
import { useAuthStore } from "@/store/useAuthStore";
import { BookingCard } from "../components/BookingCard";
import { Booking } from "../types";

const TABS = ["upcoming", "past", "all"] as const;
const TIMING = { duration: 240, easing: Easing.inOut(Easing.ease) };

export const BookingsScreen = memo(function BookingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session, smsUser } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [tab, setTab] = useState<"upcoming" | "past" | "all">("upcoming");
  const tabLayouts = useRef<Record<string, { x: number; width: number }>>({});
  const indicatorX = useSharedValue(0);
  const indicatorW = useSharedValue(0);
  const indicatorReady = useSharedValue(0);

  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: indicatorReady.value,
    transform: [{ translateX: indicatorX.value }],
    width: indicatorW.value,
  }));

  const handleTabPress = useCallback((t: typeof TABS[number]) => {
    setTab(t);
    const layout = tabLayouts.current[t];
    if (layout) {
      indicatorX.value = withTiming(layout.x, TIMING);
      indicatorW.value = withTiming(layout.width, TIMING);
    }
  }, [indicatorX, indicatorW]);

  const fetchBookings = useCallback(async () => {
    if (!session) return;
    setIsLoading(true);
    try {
      const SELECT = `
        id, boat_id, start_datetime, end_datetime, booking_status,
        total_price, prepayment_amount, remaining_amount,
        pier_name, pier_address, client_name,
        boats(name, type, boat_images(image_path, position))
      `;
      const phone =
        session.user?.phone ??
        session.user?.user_metadata?.phone_number ??
        smsUser?.phone_number ??
        "";

      let data: any[] | null = null;

      if (phone) {
        const variants = phoneVariants(phone);
        const res = await authSupabase
          .from("public_bookings")
          .select(SELECT)
          .in("client_phone", variants)
          .order("start_datetime", { ascending: false });
        data = res.data;
      } else if (smsUser?.id) {
        const res = await authSupabase
          .from("public_bookings")
          .select(SELECT)
          .eq("sms_user_id", smsUser.id)
          .order("start_datetime", { ascending: false });
        data = res.data;
      }

      setBookings((data ?? []) as any[]);
    } finally {
      setIsLoading(false);
    }
  }, [session, smsUser]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const filtered = useMemo(() => {
    const now = new Date();
    return bookings.filter((b) => {
      const end = new Date(b.end_datetime);
      if (tab === "upcoming")
        return end >= now && b.booking_status !== "cancelled";
      if (tab === "past") return end < now || b.booking_status === "cancelled";
      return true;
    });
  }, [bookings, tab]);

  const renderItem = useCallback(
    ({ item }: { item: Booking }) => <BookingCard booking={item} />,
    [],
  );

  const listContentStyle = useMemo(
    () => [styles.list, { paddingBottom: insets.bottom + 80 }],
    [insets.bottom],
  );

  const listEmpty = useMemo(
    () => (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>
          {isLoading ? "Загрузка..." : "Бронирований нет"}
        </Text>
      </View>
    ),
    [isLoading],
  );

  if (!session) {
    return (
      <View
        style={[styles.container, styles.gateRoot, { paddingTop: insets.top }]}
      >
        <Text style={styles.pageTitle}>Поездки</Text>
        <View style={styles.gateBody}>
          <Text style={styles.gateTitle}>
            Войдите, чтобы посмотреть{"\n"}свои поездки
          </Text>
          <Text style={styles.gateDesc}>
            Для просмотра ваших бронирований необходимо войти в аккаунт.
          </Text>
          <Pressable
            style={styles.gateBtn}
            onPress={() => router.push("/auth" as any)}
          >
            <Text style={styles.gateBtnTxt}>Вход</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.topBar}>
          <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={8}>
            <ArrowLeft size={22} color="#000" strokeWidth={2} />
          </Pressable>
          <Text style={styles.pageTitle}>Мои бронирования</Text>
          <View style={styles.backBtn} />
        </View>

        <View style={styles.tabs}>
          {TABS.map((t) => (
            <Pressable
              key={t}
              style={styles.tabBtn}
              onPress={() => handleTabPress(t)}
              onLayout={(e) => {
                const { x, width } = e.nativeEvent.layout;
                tabLayouts.current[t] = { x, width };
                if (t === tab) {
                  indicatorX.value = x;
                  indicatorW.value = width;
                  indicatorReady.value = withTiming(1, { duration: 150 });
                }
              }}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === "upcoming" ? "Предстоящие" : t === "past" ? "Прошедшие" : "Все"}
              </Text>
            </Pressable>
          ))}
          {/* Single animated underline shared across all tabs */}
          <Animated.View style={[styles.tabUnderline, indicatorStyle]} />
        </View>
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(b) => b.id}
        renderItem={renderItem}
        contentContainerStyle={listContentStyle}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        initialNumToRender={6}
        maxToRenderPerBatch={4}
        windowSize={5}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={fetchBookings}
            tintColor={COLORS.brandCyan}
          />
        }
        ListEmptyComponent={listEmpty}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  gateRoot: { backgroundColor: "#fff", paddingHorizontal: 16 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 4,
  },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  pageTitle: { flex: 1, fontSize: 17, fontWeight: "700", color: "#000", textAlign: "center" },
  gateBody: { paddingTop: 24, gap: 10 },
  gateTitle: { fontSize: 24, fontWeight: "700", color: "#000", lineHeight: 32 },
  gateDesc: { fontSize: 15, color: "#888", lineHeight: 22 },
  gateBtn: {
    alignSelf: "flex-start",
    marginTop: 12,
    backgroundColor: "#000",
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  gateBtnTxt: { fontSize: 15, fontWeight: "700", color: "#fff" },
  header: {
    backgroundColor: COLORS.white,
    paddingBottom: 0,
  },
  tabs: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: 4,
    position: "relative",
  },
  tabBtn: {
    marginRight: 24,
    paddingVertical: 12,
    alignItems: "center",
  },
  tabText: { fontSize: 15, color: COLORS.text3, fontWeight: "500" },
  tabTextActive: { color: "#000", fontWeight: "700" },
  tabUnderline: {
    position: "absolute",
    bottom: 0,
    left: 0,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: COLORS.brandNavy,
  },
  list: { padding: 16, gap: 12 },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: COLORS.text1 },
  emptySubtitle: { fontSize: 14, color: COLORS.text2 },
});
