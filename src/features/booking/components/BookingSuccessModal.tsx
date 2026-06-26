import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Calendar, CheckCircle, Clock, MapPin, X } from "lucide-react-native";
import { useEffect, useRef } from "react";
import {
  Pressable,
  ScrollView,
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
import { Pier } from "../types";

const RU = new Intl.NumberFormat("ru-RU");
const ruFmt = (n: number) => RU.format(n);

function fmtDate(d: Date) {
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

function fmtHour(h: number) {
  return `${String(h).padStart(2, "0")}:00`;
}

const INFO_LINES = [
  "Прибудьте к месту посадки за 15 минут до начала",
  "При себе необходимо иметь документ, удостоверяющий личность",
  "Остаток оплачивается в день аренды наличными или картой",
] as const;

export interface BookingSuccessData {
  bookingId: string;
  boatName: string;
  boatType?: string | null;
  coverImageUrl: string | null;
  date: Date;
  startHour: number;
  duration: number;
  pier: Pier | null;
  clientName: string;
  payOnline: number;
  prepaymentAmt: number;
  remainingAmt: number;
  totalAfterPromo: number;
}

interface Props {
  visible: boolean;
  data: BookingSuccessData | null;
  onClose: () => void;
}

const TIMING_IN  = { duration: 300, easing: Easing.out(Easing.ease) };
const TIMING_OUT = { duration: 220, easing: Easing.in(Easing.ease) };

export function BookingSuccessModal({ visible, data, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const progress = useSharedValue(0);

  // Preserve data during exit animation
  const lastData = useRef<BookingSuccessData | null>(null);
  if (data) lastData.current = data;

  useEffect(() => {
    progress.value = withTiming(visible ? 1 : 0, visible ? TIMING_IN : TIMING_OUT);
  }, [visible]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * 80 }],
  }));

  // Render null only when never shown yet
  if (!lastData.current) return null;
  const d = lastData.current;

  const endHour = (d?.startHour ?? 0) + (d?.duration ?? 0);

  return (
    <Animated.View
      style={[s.overlay, overlayStyle]}
      pointerEvents={visible ? "auto" : "none"}
    >
      <Animated.View
        style={[s.sheet, { paddingBottom: insets.bottom + 16 }, sheetStyle]}
      >
        {/* Fixed topbar — always above scroll content */}
        <View style={s.topBar}>
          <Pressable style={s.closeBtn} onPress={onClose} hitSlop={10}>
            <X size={18} color={COLORS.text2} strokeWidth={2} />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scroll}
          overScrollMode="never"
        >
          {/* Hero */}
          <View style={s.heroBox}>
            <View style={s.successIconWrap}>
              <CheckCircle size={52} color={COLORS.success} strokeWidth={1.5} />
            </View>
            <Text style={s.heroTitle}>Платёж успешно завершён!</Text>
            <Text style={s.heroSub}>Подтверждение отправлено на ваш телефон</Text>
          </View>

          {/* Boat cover */}
          {d?.coverImageUrl ? (
            <View style={s.coverWrap}>
              <Image
                source={{ uri: d.coverImageUrl }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.5)"]}
                style={StyleSheet.absoluteFill}
              />
              <Text style={s.coverBoatName}>{d.boatName}</Text>
            </View>
          ) : null}

          {/* Booking details */}
          <Text style={s.sectionLabel}>Детали бронирования</Text>
          <View style={s.card}>
            <DetailRow icon="calendar" label="Дата" value={d ? fmtDate(d.date) : ""} />
            <View style={s.sep} />
            <DetailRow
              icon="clock"
              label="Время"
              value={d ? `${fmtHour(d.startHour)} – ${fmtHour(endHour)} · ${d.duration} ч.` : ""}
            />
            {d?.pier && (
              <>
                <View style={s.sep} />
                <DetailRow
                  icon="pin"
                  label="Причал"
                  value={[d.pier.name, d.pier.address].filter(Boolean).join(", ")}
                />
              </>
            )}
            {d?.clientName ? (
              <>
                <View style={s.sep} />
                <DetailRow icon="dot" label="Имя" value={d.clientName} />
              </>
            ) : null}
          </View>

          {/* Payment */}
          <Text style={s.sectionLabel}>Оплата</Text>
          <View style={s.card}>
            {(d?.remainingAmt ?? 0) > 0 && (
              <View style={s.payBadgeRow}>
                <View style={s.payBadge}>
                  <Text style={s.payBadgeTxt}>Доплата в день аренды</Text>
                </View>
              </View>
            )}
            <View style={s.payGrid}>
              <View style={s.payRow}>
                <Text style={s.payLabel}>Оплачено сейчас</Text>
                <Text style={s.payVal}>{ruFmt(d?.payOnline ?? 0)} ₽</Text>
              </View>
              {(d?.remainingAmt ?? 0) > 0 && (
                <View style={s.payRow}>
                  <Text style={s.payLabel}>Остаток (в день аренды)</Text>
                  <Text style={[s.payVal, { color: COLORS.warning }]}>
                    {ruFmt(d?.remainingAmt ?? 0)} ₽
                  </Text>
                </View>
              )}
              <View style={[s.payRow, s.payRowTotal]}>
                <Text style={s.payLabelTotal}>Общая стоимость</Text>
                <Text style={s.payValTotal}>{ruFmt(d?.totalAfterPromo ?? 0)} ₽</Text>
              </View>
            </View>
          </View>

          {/* Info */}
          <View style={s.infoBox}>
            {INFO_LINES.map((t, i) => (
              <View key={i} style={s.infoRow}>
                <Text style={s.infoDot}>•</Text>
                <Text style={s.infoTxt}>{t}</Text>
              </View>
            ))}
          </View>

          {/* CTAs */}
          <View style={s.ctaStack}>
            <Pressable
              style={({ pressed }) => [s.ctaPrimary, pressed && { opacity: 0.88 }]}
              onPress={() => {
                onClose();
                router.replace("/(tabs)/bookings" as any);
              }}
            >
              <Text style={s.ctaPrimaryTxt}>Мои бронирования</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [s.ctaSecondary, pressed && { opacity: 0.88 }]}
              onPress={onClose}
            >
              <Text style={s.ctaSecondaryTxt}>На главную</Text>
            </Pressable>
          </View>
        </ScrollView>
      </Animated.View>
    </Animated.View>
  );
}

type IconType = "calendar" | "clock" | "pin" | "dot";

const ICON_COLOR = COLORS.brandNavy;

function DetailRow({ icon, label, value }: { icon: IconType; label: string; value: string }) {
  return (
    <View style={s.detailRow}>
      <View style={s.detailIcon}>
        {icon === "calendar" && <Calendar size={15} color={ICON_COLOR} strokeWidth={1.8} />}
        {icon === "clock"    && <Clock    size={15} color={ICON_COLOR} strokeWidth={1.8} />}
        {icon === "pin"      && <MapPin   size={15} color={ICON_COLOR} strokeWidth={1.8} />}
        {icon === "dot"      && <View style={s.dot} />}
      </View>
      <Text style={s.detailLabel}>{label}</Text>
      <Text style={s.detailValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
    zIndex: 999,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "92%",
  },
  topBar: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { paddingTop: 0, paddingHorizontal: 16 },

  heroBox: { alignItems: "center", paddingVertical: 28, gap: 8 },
  successIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.successLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  heroTitle: { fontSize: 20, fontWeight: "800", color: COLORS.text1, textAlign: "center" },
  heroSub:   { fontSize: 14, color: COLORS.text3, textAlign: "center" },

  coverWrap: {
    height: 148,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
    justifyContent: "flex-end",
    padding: 14,
  },
  coverBoatName: { fontSize: 17, fontWeight: "800", color: "#fff" },

  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.text3,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 6,
    marginTop: 4,
  },
  card: {
    backgroundColor: COLORS.greyLight,
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
  },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: COLORS.border, marginHorizontal: 16 },
  detailRow:  { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  detailIcon: { width: 20, alignItems: "center", marginTop: 1 },
  detailLabel: { fontSize: 13, color: COLORS.text3, width: 76 },
  detailValue: { flex: 1, fontSize: 13, fontWeight: "600", color: COLORS.text1, textAlign: "right" },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.text3, marginTop: 4 },

  payBadgeRow: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 },
  payBadge: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.warningLight,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  payBadgeTxt:    { fontSize: 12, fontWeight: "700", color: "#7a5800" },
  payGrid:        { paddingHorizontal: 16, paddingBottom: 4 },
  payRow:         { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10 },
  payRowTotal:    { marginTop: 4, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.border },
  payLabel:       { fontSize: 13, color: COLORS.text2 },
  payVal:         { fontSize: 14, fontWeight: "700", color: COLORS.text1 },
  payLabelTotal:  { fontSize: 14, fontWeight: "700", color: COLORS.text1 },
  payValTotal:    { fontSize: 18, fontWeight: "800", color: COLORS.success },

  infoBox: { backgroundColor: COLORS.greyLight, borderRadius: 16, padding: 14, gap: 6, marginBottom: 20 },
  infoRow: { flexDirection: "row", gap: 6, alignItems: "flex-start" },
  infoDot: { fontSize: 13, color: COLORS.text3, lineHeight: 20 },
  infoTxt: { flex: 1, fontSize: 13, color: COLORS.text2, lineHeight: 20 },

  ctaStack: { gap: 10, marginBottom: 8 },
  ctaPrimary: {
    height: 52,
    backgroundColor: COLORS.brandNavy,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaPrimaryTxt:  { fontSize: 15, fontWeight: "700", color: "#fff" },
  ctaSecondary:   { height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.greyLight },
  ctaSecondaryTxt: { fontSize: 15, fontWeight: "600", color: COLORS.text2 },
});
