import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  Loader,
  MapPin,
  RefreshCw,
  XCircle,
} from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { COLORS } from "@/shared/colors";
import { ScreenHeader } from "@/shared/components/ScreenHeader";
import { Spinner } from '@/shared/components/Spinner';
import { publicSupabase } from "@/shared/supabase/publicClient";

type PaymentState = "loading" | "pending" | "success" | "failed" | "error";

interface BookingData {
  id: string;
  booking_status: string;
  start_datetime: string;
  end_datetime: string;
  total_price: number;
  prepayment_amount: number;
  remaining_amount: number;
  pier_name: string | null;
  pier_address: string | null;
  client_name: string | null;
  boats: {
    name: string;
    type: string | null;
    boat_images: { image_path: string; position: number }[];
  } | null;
}

const MONTHS = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];

function ruFmt(n: number) {
  return new Intl.NumberFormat("ru-RU").format(n);
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function durHours(start: string, end: string) {
  const h = (new Date(end).getTime() - new Date(start).getTime()) / 3_600_000;
  return h === 1 ? "1 час" : h < 5 ? `${h} часа` : `${h} часов`;
}

const SUCCESS_STATUSES = new Set([
  "confirmed",
  "paid",
  "fully_paid",
  "partially_paid",
  "completed",
  "succeeded",
  "client_confirmed",
  "client_arrived",
]);
const FAILED_STATUSES = new Set([
  "cancelled",
  "canceled",
  "failed",
  "declined",
  "expired",
]);

function classifyStatus(s: string): PaymentState {
  const ls = s.toLowerCase();
  if (SUCCESS_STATUSES.has(ls)) return "success";
  if (FAILED_STATUSES.has(ls)) return "failed";
  return "pending";
}

const POLL_INTERVAL = 3000;
const MAX_POLLS = 20;

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [state, setState] = useState<PaymentState>("loading");
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [rechecking, setRechecking] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCount = useRef(0);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const fetchBooking = useCallback(async (): Promise<BookingData | null> => {
    if (!id) return null;
    const { data } = await publicSupabase
      .from("public_bookings")
      .select(
        `
        id, booking_status, start_datetime, end_datetime,
        total_price, prepayment_amount, remaining_amount,
        pier_name, pier_address, client_name,
        boats(name, type, boat_images(image_path, position))
      `,
      )
      .eq("id", id)
      .single();
    return data as BookingData | null;
  }, [id]);

  const refresh = useCallback(
    async (opts?: { manual?: boolean }) => {
      try {
        const data = await fetchBooking();
        if (!data) {
          setState("error");
          return;
        }
        setBooking(data);
        const next = classifyStatus(data.booking_status);
        setState(next);

        if (next === "pending") {
          pollCount.current += 1;
          if (pollCount.current < MAX_POLLS && !pollRef.current) {
            pollRef.current = setInterval(async () => {
              pollCount.current += 1;
              const fresh = await fetchBooking();
              if (!fresh) return;
              setBooking(fresh);
              const s = classifyStatus(fresh.booking_status);
              if (s !== "pending") {
                stopPolling();
                setState(s);
              } else if (pollCount.current >= MAX_POLLS) {
                stopPolling();
              }
            }, POLL_INTERVAL);
          }
        }
      } catch {
        setState("error");
      } finally {
        if (opts?.manual) setRechecking(false);
      }
    },
    [fetchBooking, stopPolling],
  );

  useEffect(() => {
    refresh();
    return stopPolling;
  }, []);

  const handleRecheck = async () => {
    setRechecking(true);
    stopPolling();
    pollCount.current = 0;
    await refresh({ manual: true });
  };

  const coverUri = (() => {
    if (!booking?.boats?.boat_images?.length) return null;
    const sorted = [...booking.boats.boat_images].sort(
      (a, b) => a.position - b.position,
    );
    const path = sorted[0].image_path;
    const { data } = publicSupabase.storage
      .from("boat-images")
      .getPublicUrl(path);
    return data.publicUrl;
  })();

  if (state === "loading") {
    return (
      <View style={[s.root]}>
        <ScreenHeader title="Бронирование" onBack={() => router.back()} />
        <View style={s.centerBox}>
          <Spinner />
          <Text style={s.centerLabel}>Проверяем статус платежа…</Text>
        </View>
      </View>
    );
  }

  if (state === "error") {
    return (
      <View style={[s.root]}>
        <ScreenHeader title="Бронирование" onBack={() => router.back()} />
        <View style={s.centerBox}>
          <AlertCircle size={48} color={COLORS.error} strokeWidth={1.5} />
          <Text style={s.centerTitle}>Не удалось загрузить</Text>
          <Text style={s.centerSub}>
            Проверьте подключение и попробуйте снова
          </Text>
          <Pressable
            style={s.retryBtn}
            onPress={() => {
              setState("loading");
              refresh();
            }}
          >
            <Text style={s.retryBtnTxt}>Повторить</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (state === "pending") {
    return (
      <View style={[s.root]}>
        <ScreenHeader title="Бронирование" onBack={() => router.back()} />
        <View style={s.centerBox}>
          <Animated.View entering={FadeIn.duration(400)}>
            <View style={s.pendingIconWrap}>
              <Loader size={36} color={COLORS.warning} strokeWidth={1.5} />
            </View>
          </Animated.View>
          <Text style={s.centerTitle}>Платёж в обработке</Text>
          <View style={s.pendingHintBox}>
            <Text style={s.pendingHintTxt}>
              Ожидаем подтверждение от платёжной системы. Обычно занимает до 30
              секунд — не закрывайте экран.
            </Text>
          </View>
          <Pressable
            style={[s.recheckBtn, rechecking && { opacity: 0.6 }]}
            onPress={handleRecheck}
            disabled={rechecking}
          >
            {rechecking ? (
              <Spinner size={20} />
            ) : (
              <>
                <RefreshCw size={15} color={COLORS.brandNavy} strokeWidth={2} />
                <Text style={s.recheckBtnTxt}>Проверить сейчас</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    );
  }

  if (state === "failed") {
    return (
      <View style={[s.root]}>
        <ScreenHeader title="Бронирование" onBack={() => router.back()} />
        <View style={s.centerBox}>
          <Animated.View entering={FadeIn.duration(400)}>
            <XCircle size={64} color={COLORS.error} strokeWidth={1.2} />
          </Animated.View>
          <Text style={[s.centerTitle, { color: COLORS.error }]}>
            Оплата не прошла
          </Text>
          <View
            style={[
              s.pendingHintBox,
              {
                borderColor: COLORS.errorLight,
                backgroundColor: COLORS.errorLight,
              },
            ]}
          >
            <Text style={[s.pendingHintTxt, { color: COLORS.error }]}>
              Платёж был отменён или не завершён. Бронирование сохранено —
              попробуйте оплатить снова.
            </Text>
          </View>
          <Pressable style={s.navBtn} onPress={() => router.back()}>
            <Text style={s.navBtnTxt}>Вернуться и попробовать снова</Text>
          </Pressable>
          <Pressable
            style={s.navBtnGhost}
            onPress={() => router.replace("/(tabs)/" as any)}
          >
            <Text style={s.navBtnGhostTxt}>На главную</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.root]}>
      <ScreenHeader
        title="Бронирование"
        onBack={() => router.back()}
      />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Success hero */}
        <Animated.View entering={FadeIn.duration(500)} style={s.heroBox}>
          <View style={s.successIconWrap}>
            <CheckCircle size={52} color={COLORS.success} strokeWidth={1.5} />
          </View>
          <Text style={s.heroTitle}>Платёж успешно завершён!</Text>
          <Text style={s.heroSub}>Подтверждение отправлено на ваш телефон</Text>
        </Animated.View>

        {/* Boat cover */}
        {coverUri && (
          <Animated.View
            entering={FadeIn.duration(400).delay(100)}
            style={s.coverWrap}
          >
            <Image
              source={{ uri: coverUri }}
              style={s.cover}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
            <View style={s.coverOverlay}>
              <Text style={s.coverBoatName}>{booking?.boats?.name}</Text>
            </View>
          </Animated.View>
        )}

        {/* Booking details card */}
        {booking && (
          <>
          <Text style={[s.cardTitle, { marginHorizontal: 16, marginBottom: 4 }]}>Детали бронирования</Text>
          <Animated.View
            entering={FadeIn.duration(400).delay(150)}
            style={s.card}
          >
            <DetailRow
              icon={
                <Calendar
                  size={15}
                  color={COLORS.brandNavy}
                  strokeWidth={1.8}
                />
              }
              label="Дата"
              value={fmtDate(booking.start_datetime)}
            />
            <DetailRow
              icon={
                <Clock size={15} color={COLORS.brandNavy} strokeWidth={1.8} />
              }
              label="Время"
              value={`${fmtTime(booking.start_datetime)} – ${fmtTime(booking.end_datetime)} · ${durHours(booking.start_datetime, booking.end_datetime)}`}
            />
            {booking.pier_name && (
              <DetailRow
                icon={
                  <MapPin
                    size={15}
                    color={COLORS.brandNavy}
                    strokeWidth={1.8}
                  />
                }
                label="Причал"
                value={[booking.pier_name, booking.pier_address].filter(Boolean).join(", ")}
              />
            )}
            {booking.client_name && (
              <DetailRow
                icon={<View style={s.dotIcon} />}
                label="Имя"
                value={booking.client_name}
              />
            )}
          </Animated.View>

          {/* Payment card */}
          <Text style={[s.cardTitle, { marginHorizontal: 16, marginTop: 16, marginBottom: 4 }]}>Оплата</Text>
          <Animated.View entering={FadeIn.duration(400).delay(180)} style={s.card}>
            {booking.remaining_amount > 0 && (
              <View style={s.payBadgeRow}>
                <View style={s.payBadge}>
                  <Text style={s.payBadgeTxt}>Доплата</Text>
                </View>
              </View>
            )}
            <View style={s.payGrid}>
              {booking.remaining_amount > 0 && (
                <View style={s.payItem}>
                  <Text style={s.payItemLabel}>К доплате</Text>
                  <Text style={[s.payItemVal, { color: COLORS.warning }]}>{ruFmt(booking.remaining_amount)} ₽</Text>
                </View>
              )}
              <View style={s.payItem}>
                <Text style={s.payItemLabel}>Оплачено</Text>
                <Text style={s.payItemVal}>{ruFmt(booking.prepayment_amount > 0 ? booking.prepayment_amount : booking.total_price)} ₽</Text>
              </View>
              {booking.prepayment_amount > 0 && (
                <View style={s.payItem}>
                  <Text style={s.payItemLabel}>Предоплата</Text>
                  <Text style={s.payItemVal}>{ruFmt(booking.prepayment_amount)} ₽</Text>
                </View>
              )}
              <View style={[s.payItem, s.payItemTotal]}>
                <Text style={s.payItemLabelTotal}>Общая стоимость</Text>
                <Text style={s.payItemValTotal}>{ruFmt(booking.total_price)} ₽</Text>
              </View>
            </View>
          </Animated.View>
          </>
        )}

        {/* Info box */}
        <Animated.View
          entering={FadeIn.duration(400).delay(200)}
          style={s.infoBox}
        >
          {[
            "Прибудьте к месту посадки за 15 минут до начала",
            "При себе необходимо иметь документ, удостоверяющий личность",
            "Оплата исполнителю производится в день аренды наличными или картой",
          ].map((t, i) => (
            <View key={i} style={s.infoRow}>
              <Text style={s.infoDot}>•</Text>
              <Text style={s.infoTxt}>{t}</Text>
            </View>
          ))}
        </Animated.View>

        {/* CTAs */}
        <Animated.View
          entering={FadeIn.duration(400).delay(250)}
          style={s.ctaStack}
        >
          <Pressable
            style={({ pressed }) => [
              s.ctaPrimary,
              pressed && { opacity: 0.88 },
            ]}
            onPress={() => router.push("/bookings" as any)}
          >
            <Text style={s.ctaPrimaryTxt}>Мои бронирования</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              s.ctaSecondary,
              pressed && { opacity: 0.88 },
            ]}
            onPress={() => router.replace("/(tabs)/" as any)}
          >
            <Text style={s.ctaSecondaryTxt}>На главную</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View style={s.detailRow}>
      <View style={s.detailIcon}>{icon}</View>
      <Text style={s.detailLabel}>{label}</Text>
      <Text style={s.detailValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.white },
  scroll: { flex: 1 },

  /* center states */
  centerBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  centerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text1,
    textAlign: "center",
  },
  centerSub: {
    fontSize: 14,
    color: COLORS.text3,
    textAlign: "center",
    lineHeight: 20,
  },
  centerLabel: { fontSize: 14, color: COLORS.text2, marginTop: 8 },

  retryBtn: {
    marginTop: 8,
    backgroundColor: COLORS.brandNavy,
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 13,
  },
  retryBtnTxt: { fontSize: 15, fontWeight: "700", color: "#fff" },

  /* pending */
  pendingIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.warningLight,
    alignItems: "center",
    justifyContent: "center",
  },
  pendingHintBox: {
    backgroundColor: COLORS.warningLight,
    borderRadius: 12,
    padding: 14,
  },
  pendingHintTxt: {
    fontSize: 13,
    color: "#7a5800",
    lineHeight: 20,
    textAlign: "center",
  },
  recheckBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.greyLight,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 11,
  },
  recheckBtnTxt: { fontSize: 14, fontWeight: "600", color: COLORS.brandNavy },

  /* nav buttons */
  navBtn: {
    width: "100%",
    backgroundColor: COLORS.brandNavy,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  navBtnTxt: { fontSize: 15, fontWeight: "700", color: "#fff" },
  navBtnGhost: { width: "100%", paddingVertical: 12, alignItems: "center" },
  navBtnGhostTxt: { fontSize: 14, color: COLORS.text3 },

  /* success hero */
  heroBox: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 24,
    gap: 8,
  },
  successIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.successLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.text1,
    textAlign: "center",
  },
  heroSub: { fontSize: 14, color: COLORS.text3, textAlign: "center" },

  /* cover */
  coverWrap: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: "hidden",
    height: 160,
  },
  cover: { ...StyleSheet.absoluteFill },
  coverOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
    padding: 14,
  },
  coverBoatName: { fontSize: 18, fontWeight: "800", color: "#fff" },

  /* card */
  card: {
    margin: 16,
    backgroundColor: COLORS.greyLight,
    borderRadius: 16,
    overflow: "hidden",
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.text3,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  detailIcon: { width: 20, alignItems: "center", marginTop: 1 },
  detailLabel: { fontSize: 13, color: COLORS.text3, width: 76 },
  detailValue: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text1,
    textAlign: "right",
  },
  dotIcon: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.text3,
    marginTop: 4,
  },

  /* payment card */
  payBadgeRow: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
  payBadge: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.warningLight,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  payBadgeTxt: { fontSize: 12, fontWeight: "700", color: "#7a5800" },
  payGrid: { paddingHorizontal: 16, paddingBottom: 4 },
  payItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  payItemTotal: {
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.greyDark,
  },
  payItemLabel: { fontSize: 13, color: COLORS.text2 },
  payItemVal: { fontSize: 14, fontWeight: "700", color: COLORS.text1 },
  payItemLabelTotal: { fontSize: 14, fontWeight: "700", color: COLORS.text1 },
  payItemValTotal: { fontSize: 18, fontWeight: "800", color: COLORS.success },

  /* info */
  infoBox: {
    marginHorizontal: 16,
    backgroundColor: COLORS.greyLight,
    borderRadius: 16,
    padding: 14,
    gap: 6,
  },
  infoRow: { flexDirection: "row", gap: 6, alignItems: "flex-start" },
  infoDot: { fontSize: 13, color: COLORS.text3, lineHeight: 20 },
  infoTxt: { flex: 1, fontSize: 13, color: COLORS.text2, lineHeight: 20 },

  /* cta */
  ctaStack: { marginHorizontal: 16, marginTop: 20, gap: 10 },
  ctaPrimary: {
    height: 52,
    backgroundColor: COLORS.brandNavy,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaPrimaryTxt: { fontSize: 15, fontWeight: "700", color: "#fff" },
  ctaSecondary: {
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.greyLight,
  },
  ctaSecondaryTxt: { fontSize: 15, fontWeight: "600", color: COLORS.text2 },
});
