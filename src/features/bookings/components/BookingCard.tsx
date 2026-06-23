import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { CreditCard, MapPin, Navigation, RotateCcw } from "lucide-react-native";
import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { COLORS } from "@/shared/colors";
import { SUPABASE_URL } from "@/shared/supabase/publicClient";
import { Booking } from "../types";

const _RU_FMT = new Intl.NumberFormat("ru-RU");

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending_payment:  { label: "Ожидает оплаты",      color: COLORS.warning },
  pending:          { label: "Ожидает оплаты",      color: COLORS.warning },
  partially_paid:   { label: "Частично оплачено",   color: COLORS.brandCyan },
  confirmed:        { label: "Подтверждено",         color: COLORS.success },
  paid:             { label: "Оплачено",             color: COLORS.success },
  fully_paid:       { label: "Оплачено",             color: COLORS.success },
  client_confirmed: { label: "Подтверждено",         color: COLORS.success },
  client_arrived:   { label: "Клиент прибыл",        color: COLORS.brandViolet },
  completed:        { label: "Завершено",             color: COLORS.text3 },
  cancelled:        { label: "Отменено",              color: COLORS.error },
};

function bookingShortId(id: string) {
  return "№ " + id.replace(/-/g, "").slice(0, 8).toUpperCase();
}

export const BookingCard = memo(function BookingCard({
  booking,
}: {
  booking: Booking;
}) {
  const router = useRouter();
  const status = STATUS_LABELS[booking.booking_status] ?? {
    label: booking.booking_status,
    color: COLORS.text3,
  };
  const startDate = new Date(booking.start_datetime);
  const endDate = new Date(booking.end_datetime);
  const now = new Date();
  const isUpcoming =
    endDate >= now &&
    booking.booking_status !== "cancelled" &&
    booking.booking_status !== "completed";
  const isPast = !isUpcoming;
  const isPendingPayment = booking.booking_status === "pending_payment";
  const isPaid = [
    "confirmed",
    "paid",
    "fully_paid",
    "partially_paid",
    "client_confirmed",
    "client_arrived",
  ].includes(booking.booking_status);

  const firstImg = booking.boats?.boat_images
    ?.slice()
    .sort((a, b) => a.position - b.position)[0]?.image_path;
  const imgUrl = firstImg
    ? `${SUPABASE_URL}/storage/v1/object/public/boat_images/${firstImg}`
    : null;

  const duration = Math.round(
    (endDate.getTime() - startDate.getTime()) / 3600000,
  );
  const durLabel =
    duration === 1
      ? "1 ч."
      : duration < 5
        ? `${duration} ч.`
        : `${duration} ч.`;

  const dateStr = startDate.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
  });
  const timeStr = startDate.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleCTA = () => {
    if (isPendingPayment) {
      router.push(`/bookings/${booking.id}` as any);
    } else if (isUpcoming && isPaid) {
      const addr = booking.pier_address ?? booking.pier_name ?? "";
      const mapsUrl = `https://maps.apple.com/?q=${encodeURIComponent(addr)}`;
      Linking.openURL(mapsUrl);
    } else if (isPast && booking.boat_id) {
      router.push(`/catalog/${booking.boat_id}` as any);
    }
  };

  const ctaLabel = isPendingPayment
    ? "Оплатить"
    : isUpcoming && isPaid
      ? "Направить к причалу"
      : isPast
        ? "Заказать снова"
        : null;

  const CtaIcon = isPendingPayment
    ? CreditCard
    : isUpcoming && isPaid
      ? Navigation
      : RotateCcw;

  const ctaColor = isPendingPayment
    ? COLORS.error
    : isUpcoming && isPaid
      ? COLORS.brandNavy
      : COLORS.text2;

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/bookings/${booking.id}` as any)}
    >
      {/* ── Top row: ID + status ── */}
      <View style={styles.cardTopRow}>
        <Text style={styles.bookingId}>{bookingShortId(booking.id)}</Text>
        <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
          <Text style={[styles.statusText, { color: COLORS.white }]}>
            {status.label}
          </Text>
        </View>
      </View>

      <View style={styles.cardSep} />

      {/* ── Middle: image + info ── */}
      <View style={styles.cardBody}>
        <View style={styles.cardThumb}>
          {imgUrl ? (
            <Image
              source={{ uri: imgUrl }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
          ) : (
            <LinearGradient
              colors={[COLORS.brandNavy, COLORS.brandCyan]}
              style={StyleSheet.absoluteFill}
            />
          )}
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.boatName} numberOfLines={2}>
            {booking.boats?.name ?? "Судно"}
          </Text>
          {booking.pier_name ? (
            <View style={styles.pierRow}>
              <MapPin size={12} color={COLORS.text3} strokeWidth={2} />
              <Text style={styles.pierText} numberOfLines={1}>
                {booking.pier_name}
              </Text>
            </View>
          ) : null}
          <View style={styles.dateGrid}>
            <View style={styles.dateCol}>
              <Text style={styles.dateLabel}>Дата</Text>
              <Text style={styles.dateVal}>{dateStr}</Text>
            </View>
            <View style={styles.dateCol}>
              <Text style={styles.dateLabel}>Время</Text>
              <Text style={styles.dateVal}>
                {timeStr} · {durLabel}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.cardSep} />

      {/* ── Bottom: price + CTA ── */}
      <View style={styles.cardFooter}>
        <View>
          <Text style={styles.price}>
            {_RU_FMT.format(booking.total_price)} ₽
          </Text>
          {booking.remaining_amount > 0 ? (
            <Text style={styles.remaining}>
              Остаток: {_RU_FMT.format(booking.remaining_amount)} ₽
            </Text>
          ) : null}
        </View>
        {ctaLabel ? (
          <Pressable
            style={({ pressed }) => [
              styles.ctaBtn,
              { backgroundColor: ctaColor },
              pressed && { opacity: 0.8 },
            ]}
            onPress={handleCTA}
          >
            <CtaIcon size={14} color="#fff" strokeWidth={2} />
            <Text style={styles.ctaBtnTxt}>{ctaLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 4,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bookingId: { fontSize: 13, fontWeight: "600", color: COLORS.text2 },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: { fontSize: 12, fontWeight: "600" },
  cardSep: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
    marginHorizontal: 16,
  },
  cardBody: { flexDirection: "row", padding: 14, gap: 12 },
  cardThumb: {
    width: 90,
    height: 90,
    borderRadius: 12,
    overflow: "hidden",
    flexShrink: 0,
  },
  cardInfo: { flex: 1, gap: 4 },
  boatName: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text1,
    lineHeight: 20,
  },
  pierRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  pierText: { fontSize: 12, color: COLORS.text3, flex: 1 },
  dateGrid: { flexDirection: "row", gap: 16, marginTop: 6 },
  dateCol: { gap: 2 },
  dateLabel: { fontSize: 11, color: COLORS.text3 },
  dateVal: { fontSize: 13, fontWeight: "600", color: COLORS.text1 },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  price: { fontSize: 17, fontWeight: "800", color: COLORS.text1 },
  remaining: { fontSize: 11, color: COLORS.warning, marginTop: 2 },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  ctaBtnTxt: { fontSize: 13, fontWeight: "700", color: "#fff" },
});
