import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import { openAuthSessionAsync, WebBrowserResultType } from "expo-web-browser";
import {
  ArrowLeft,
  Clock,
  Edit2,
  MessageCircle,
  Phone,
  Plus,
  Send,
  Tag,
  X,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  AppState,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { COLORS } from "@/shared/colors";
import { fmtDateFull } from "@/shared/components/CalendarPicker";
import { PhoneInput } from "@/shared/components/PhoneInput";
import { SheetBackdrop } from "@/shared/components/SheetBackdrop";
import { Spinner } from "@/shared/components/Spinner";
import { usePendingPayment } from "@/shared/context/PendingPaymentContext";
import { authSupabase } from "@/shared/supabase/authClient";
import { publicSupabase, SUPABASE_URL } from "@/shared/supabase/publicClient";
import {
  digitsToE164,
  isValidDigits,
  parsePhoneDigits,
} from "@/shared/utils/phone";
import { useAuthStore } from "@/store/useAuthStore";

import { useBookingSuccess } from "@/shared/context/BookingSuccessContext";
import { addGuestBooking } from "@/store/offlineStore";
import { offlineReduxStore } from "@/store/offlineStore";
import { BookingSuccessData } from "../components/BookingSuccessModal";
import { cachePiers, setTripEditCallback } from "../tripEditResult";
import { Boat, Pier, PricingResult } from "../types";
import { buildDatetime, durLabel, fmtHour, ruFmt, uuid } from "../utils";

interface PromoResult {
  id: string;
  code: string;
  discount_percent: number;
}
interface GiftCertResult {
  id: string;
  code: string;
  balance: number;
}

type PaymentMode = "prepayment" | "contact";

const CONTACT_WA = "whatsapp://send?phone=79810076500";
const CONTACT_TEL = "tel:+79810076500";

const BOOKING_RULES = [
  "Бронирование действительно только после успешной оплаты",
  "Возврат средств возможен не позднее чем за 24 часа до начала аренды",
  "При отмене менее чем за 24 часа возврат составляет 50%",
  "В случае форс-мажора полный возврат гарантирован",
];

function fmtDotDate(d: Date) {
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

// ─────────────────────────────────────────────────────────────────────────────

export function BookingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    boatId,
    date: dateParam,
    startHour: hourParam,
    duration: durParam,
  } = useLocalSearchParams<{
    boatId: string;
    date?: string;
    startHour?: string;
    duration?: string;
  }>();

  const session = useAuthStore((s) => s.session);
  const smsUser = useAuthStore((s) => s.smsUser);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);

  // ── Core booking state ───────────────────────────────────────────────────
  const [boat, setBoat] = useState<Boat | null>(null);
  const [loadingBoat, setLoadingBoat] = useState(true);

  const [date, setDate] = useState<Date>(() => {
    if (dateParam) {
      const d = new Date(dateParam);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  });
  const [startHour, setStartHour] = useState<number>(
    hourParam ? Number(hourParam) : -1,
  );
  const [duration, setDuration] = useState<number>(
    durParam ? Number(durParam) : 0,
  );
  const [timeConfirmed, setTimeConfirmed] = useState(
    () => !!(hourParam && durParam),
  );

  const [piers, setPiers] = useState<Pier[]>([]);
  const [selectedPier, setSelectedPier] = useState<Pier | null>(null);

  const [codeInput, setCodeInput] = useState("");
  const [promo, setPromo] = useState<PromoResult | null>(null);
  const [gift, setGift] = useState<GiftCertResult | null>(null);
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeError, setCodeError] = useState("");
  const [codeExpanded, setCodeExpanded] = useState(false);

  const [pricing, setPricing] = useState<PricingResult | null>(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("prepayment");

  const [clientName, setClientName] = useState("");
  const [clientPhoneDigits, setClientPhoneDigits] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [paying, setPaying] = useState(false);
  const { show: showSuccess } = useBookingSuccess();
  const { pending: pendingPayment, save: savePendingPayment, clear: clearPendingPayment } = usePendingPayment();

  const bookingIdRef = useRef<string | null>(null);
  const snapshotRef = useRef<Omit<BookingSuccessData, "bookingId"> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const contactSheetRef = useRef<BottomSheetModal>(null);
  const appStateRef = useRef(AppState.currentState);

  // ── Promo slide animation (reanimated, same pattern as BoatSearchScreen) ─
  const codeProgress = useSharedValue(0);
  const [codeToggleH, setCodeToggleH] = useState(0);
  const [codeInputH, setCodeInputH] = useState(0);

  const PROMO_TIMING = { duration: 280, easing: Easing.inOut(Easing.ease) };

  const codeContainerStyle = useAnimatedStyle(() => ({
    height: interpolate(codeProgress.value, [0, 1], [codeToggleH || 48, codeInputH || 68]),
    overflow: "hidden" as const,
  }));
  const codeToggleStyle = useAnimatedStyle(() => ({
    position: "absolute" as const,
    width: "100%" as const,
    opacity: interpolate(codeProgress.value, [0, 0.4], [1, 0]),
    transform: [{ translateX: interpolate(codeProgress.value, [0, 1], [0, -80]) }],
  }));
  const codeInputStyle = useAnimatedStyle(() => ({
    position: "absolute" as const,
    width: "100%" as const,
    opacity: interpolate(codeProgress.value, [0.4, 1], [0, 1]),
    transform: [{ translateX: interpolate(codeProgress.value, [0, 1], [80, 0]) }],
  }));
  const awaitingReturn = useRef(false);
  const skipDateReset = useRef(false);

  // ── Auto-fill from session ───────────────────────────────────────────────
  // If smsUser not loaded yet but session exists, trigger fetch
  useEffect(() => {
    if (session && !smsUser) fetchProfile();
  }, [session, smsUser]);

  useEffect(() => {
    if (smsUser) {
      if (smsUser.full_name) setClientName(smsUser.full_name);
      if (smsUser.phone_number)
        setClientPhoneDigits(parsePhoneDigits(smsUser.phone_number));
      if (smsUser.email) setClientEmail(smsUser.email);
    } else if (session?.user) {
      // Fallback: phone is always on session.user for SMS auth
      const phone = (session.user as any).phone ?? session.user.phone;
      if (phone) setClientPhoneDigits(parsePhoneDigits(phone));
    }
  }, [smsUser, session]);

  // ── AppState for payment return ──────────────────────────────────────────
  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        next === "active" &&
        awaitingReturn.current &&
        bookingIdRef.current
      ) {
        awaitingReturn.current = false;
        startPolling(bookingIdRef.current, snapshotRef.current ?? {} as any);
      }
      appStateRef.current = next;
    });
    return () => {
      sub.remove();
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const saveGuestBooking = (
    bId: string,
    snapshot: Omit<BookingSuccessData, "bookingId">,
    status: string,
  ) => {
    const IMG_PREFIX = `${SUPABASE_URL}/storage/v1/object/public/boat_images/`;
    const imagePath = snapshot.coverImageUrl?.startsWith(IMG_PREFIX)
      ? snapshot.coverImageUrl.slice(IMG_PREFIX.length)
      : null;
    const startDt = new Date(snapshot.date);
    startDt.setHours(snapshot.startHour, 0, 0, 0);
    const endDt = new Date(snapshot.date);
    endDt.setHours(snapshot.startHour + snapshot.duration, 0, 0, 0);
    offlineReduxStore.dispatch(addGuestBooking({
      id: bId,
      boat_id: null,
      start_datetime: startDt.toISOString(),
      end_datetime: endDt.toISOString(),
      booking_status: status,
      total_price: snapshot.totalAfterPromo,
      prepayment_amount: snapshot.prepaymentAmt,
      remaining_amount: snapshot.remainingAmt,
      pier_name: snapshot.pier?.name ?? null,
      pier_address: snapshot.pier?.address ?? null,
      client_name: snapshot.clientName,
      boats: {
        name: snapshot.boatName,
        type: snapshot.boatType ?? "",
        boat_images: imagePath ? [{ image_path: imagePath, position: 0 }] : [],
      },
    }));
  };

  const startPolling = useCallback(
    (bId: string, snapshot: Omit<BookingSuccessData, "bookingId">) => {
      if (pollRef.current) clearInterval(pollRef.current);
      let attempts = 0;
      pollRef.current = setInterval(async () => {
        attempts++;
        const { data } = await publicSupabase
          .from("public_bookings")
          .select("booking_status")
          .eq("id", bId)
          .single();
        const status = (data as any)?.booking_status;
        if (status === "confirmed" || status === "paid" || status === "partially_paid") {
          clearInterval(pollRef.current!);
          setPaying(false);
          clearPendingPayment();
          router.replace("/(tabs)/" as any);
          showSuccess({ bookingId: bId, ...snapshot });
          saveGuestBooking(bId, snapshot, status);
        } else if (status === "cancelled") {
          clearInterval(pollRef.current!);
          setPaying(false);
          Alert.alert("Оплата не прошла", "Попробуйте ещё раз.");
        } else if (attempts >= 30) {
          clearInterval(pollRef.current!);
          setPaying(false);
        }
      }, 2000);
    },
    [router, showSuccess, clearPendingPayment],
  );

  // ── Reset time on date change (suppress when edit-trip callback fires) ───
  const isFirstDate = useRef(true);
  useEffect(() => {
    if (isFirstDate.current) {
      isFirstDate.current = false;
      return;
    }
    if (skipDateReset.current) {
      skipDateReset.current = false;
      return;
    }
    setStartHour(-1);
    setDuration(0);
    setTimeConfirmed(false);
    setPricing(null);
  }, [date]);

  // ── Load boat + piers ────────────────────────────────────────────────────
  useEffect(() => {
    if (!boatId) return;
    (async () => {
      const { data } = await publicSupabase
        .from("boats")
        .select(
          "id, name, type, capacity, length_meters, price_per_hour, pier_id, boat_images(image_path, position), piers(id, name, address, latitude, longitude)",
        )
        .eq("id", boatId)
        .single();
      if (data) {
        const d = data as any;
        const sorted = [...(d.boat_images ?? [])].sort(
          (a: any, z: any) => a.position - z.position,
        );
        const img = sorted[0]?.image_path ?? null;
        setBoat({
          id: d.id,
          name: d.name,
          type: d.type,
          capacity: d.capacity,
          length_meters: d.length_meters,
          price_per_hour: d.price_per_hour,
          min_duration_hours: null,
          cover_image_url: img
            ? `${SUPABASE_URL}/storage/v1/object/public/boat_images/${img}`
            : null,
        });
        const { data: asgn } = await publicSupabase
          .from("boat_pier_assignments")
          .select("pier_id, piers(id, name, address, latitude, longitude)")
          .eq("boat_id", boatId);
        let pierList: Pier[] = asgn?.length
          ? (asgn as any[]).map((a: any) => a.piers).filter(Boolean)
          : [];
        if (!pierList.length && d.piers) pierList = [d.piers];
        setPiers(pierList);
        if (pierList.length) setSelectedPier(pierList[0]);

        // Optional: fetch min_duration_hours (may not exist in DB yet)
        try {
          const { data: minData, error: minErr } = await publicSupabase
            .from("boats")
            .select("min_duration_hours")
            .eq("id", boatId)
            .single();
          if (!minErr && minData?.min_duration_hours) {
            setBoat((prev) =>
              prev
                ? { ...prev, min_duration_hours: minData.min_duration_hours }
                : prev,
            );
          }
        } catch {
          /* column doesn't exist yet — default 1 */
        }
      }
      setLoadingBoat(false);
    })();
  }, [boatId]);

  // ── Pricing fetch ────────────────────────────────────────────────────────
  const fetchPricing = useCallback(
    async (h: number, dur: number) => {
      if (!boatId) return;
      setPricingLoading(true);
      try {
        const startDt = buildDatetime(date, h);
        const endDt = buildDatetime(date, h + dur);
        const { data, error } = await publicSupabase.functions.invoke(
          "calculate-public-booking-pricing",
          {
            body: {
              boatId,
              startTime: startDt.toISOString(),
              endTime: endDt.toISOString(),
            },
          },
        );
        if (!error && data?.publicPrice) {
          setPricing({
            publicPrice: data.publicPrice,
            prepaymentAmount:
              data.prepaymentAmount ?? Math.round(data.publicPrice * 0.2),
            remainingAmount:
              data.remainingAmount ??
              data.publicPrice - Math.round(data.publicPrice * 0.2),
            durationHours: data.durationHours ?? dur,
            originalHourlyRate: data.originalHourlyRate,
            finalHourlyRate: data.finalHourlyRate,
            appliedDiscount: data.appliedDiscount ?? null,
            totalSavings: data.totalSavings ?? 0,
          });
          setPaymentMode("prepayment");
        } else {
          const base = (boat?.price_per_hour ?? 0) * dur;
          const dp = Math.round(base * 0.2);
          setPricing({
            publicPrice: base,
            prepaymentAmount: dp,
            remainingAmount: base - dp,
            durationHours: dur,
          });
          setPaymentMode("prepayment");
        }
      } catch {
        const base = (boat?.price_per_hour ?? 0) * dur;
        const dp = Math.round(base * 0.2);
        setPricing({
          publicPrice: base,
          prepaymentAmount: dp,
          remainingAmount: base - dp,
          durationHours: dur,
        });
      }
      setPricingLoading(false);
    },
    [boatId, date, boat],
  );

  // Auto-fetch pricing when time is confirmed
  useEffect(() => {
    if (!timeConfirmed || startHour < 0 || duration <= 0) return;
    fetchPricing(startHour, duration);
  }, [timeConfirmed, startHour, duration, fetchPricing]);

  // ── Open edit-trip screen ────────────────────────────────────────────────
  const handleEditCard = useCallback(() => {
    cachePiers(piers);
    setTripEditCallback(({ date: d, startHour: h, duration: dur, pier: p }) => {
      skipDateReset.current = true;
      setDate(d);
      setStartHour(h);
      setDuration(dur);
      setTimeConfirmed(h >= 0 && dur > 0);
      if (p) setSelectedPier(p);
      setPricing(null);
    });
    const dateISO = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const minDur = boat?.min_duration_hours ?? 1;
    const boatName = encodeURIComponent(boat?.name ?? "");
    const pierName = encodeURIComponent(selectedPier?.name ?? "");
    const pierAddress = encodeURIComponent(selectedPier?.address ?? "");
    router.push(
      `/booking/edit-trip?boatId=${boatId}&date=${dateISO}&startHour=${startHour}&duration=${duration}&pierId=${selectedPier?.id ?? ""}&minDuration=${minDur}&boatName=${boatName}&pierName=${pierName}&pierAddress=${pierAddress}` as any,
    );
  }, [piers, date, startHour, duration, selectedPier, boatId, router]);

  const applyCode = async () => {
    const val = codeInput.trim();
    if (!val) return;
    setCodeLoading(true);
    setCodeError("");
    if (val.toUpperCase().startsWith("GIFT")) {
      const { data } = await publicSupabase
        .from("gift_certificates")
        .select("id, code, balance")
        .ilike("code", val)
        .eq("is_active", true)
        .gt("balance", 0)
        .maybeSingle();
      if (!data) {
        setCodeError("Сертификат не найден или исчерпан");
        setGift(null);
      } else {
        setGift(data as any);
        setPromo(null);
      }
    } else {
      const { data } = await publicSupabase
        .from("promo_codes")
        .select("id, code, discount_percent")
        .ilike("code", val)
        .eq("is_active", true)
        .maybeSingle();
      if (!data) {
        setCodeError("Промокод не найден или недействителен");
        setPromo(null);
      } else {
        setPromo(data as any);
        setGift(null);
      }
    }
    setCodeLoading(false);
  };

  // ── Price math ───────────────────────────────────────────────────────────
  const {
    baseTotal,
    promoDiscount,
    totalAfterPromo,
    prepaymentAmt,
    remainingAmt,
    isPrepayment,
    payNow,
    giftUsed,
    payOnline,
  } = useMemo(() => {
    const baseTotal =
      pricing?.publicPrice ?? (boat?.price_per_hour ?? 0) * duration;
    const promoDiscount = promo
      ? Math.round((baseTotal * promo.discount_percent) / 100)
      : 0;
    const totalAfterPromo = baseTotal - promoDiscount;
    const prepaymentAmt = pricing
      ? Math.max(0, pricing.prepaymentAmount - promoDiscount)
      : Math.round(totalAfterPromo * 0.2);
    const remainingAmt = totalAfterPromo - prepaymentAmt;
    const isPrepayment = paymentMode === "prepayment";
    const payNow = isPrepayment ? prepaymentAmt : totalAfterPromo;
    const giftUsed = gift ? Math.min(gift.balance, payNow, totalAfterPromo) : 0;
    const payOnline = Math.max(0, payNow - giftUsed);
    return {
      baseTotal,
      promoDiscount,
      totalAfterPromo,
      prepaymentAmt,
      remainingAmt,
      isPrepayment,
      payNow,
      giftUsed,
      payOnline,
    };
  }, [pricing, promo, paymentMode, gift, boat?.price_per_hour, duration]);


  // ── Pay / Contact ────────────────────────────────────────────────────────
  const handleAction = async () => {
    if (!boat) return;
    if (!timeConfirmed) {
      Alert.alert("", "Выберите время");
      return;
    }
    if (!clientName.trim()) {
      Alert.alert("", "Введите имя");
      return;
    }
    if (!isValidDigits(clientPhoneDigits)) {
      Alert.alert("", "Введите корректный номер");
      return;
    }

    if (paymentMode === "contact") {
      const msg = encodeURIComponent(
        `Здравствуйте! Хочу забронировать ${boat.name} на ${fmtDotDate(date)} в ${fmtHour(startHour)}`,
      );
      Linking.openURL(`${CONTACT_WA}&text=${msg}`).catch(() =>
        Linking.openURL(CONTACT_TEL),
      );
      return;
    }

    if (!selectedPier) {
      Alert.alert("", "Выберите место посадки");
      return;
    }
    if (!pricing) {
      Alert.alert("", "Рассчитываем стоимость, подождите");
      return;
    }

    const startDt = buildDatetime(date, startHour);
    const endDt = buildDatetime(date, startHour + duration);
    setPaying(true);
    try {
      const { data, error } = await publicSupabase.functions.invoke(
        "create-yookassa-payment",
        {
          body: {
            amount: Math.round(payOnline * 100),
            description: `Аренда катера ${boat.name}`,
            payment_type: isPrepayment ? "prepayment" : "full_payment",
            idempotency_key: uuid(),
            return_url: Linking.createURL("booking/return"),
            booking_data: {
              boat_id: boat.id,
              start_datetime: startDt.toISOString(),
              end_datetime: endDt.toISOString(),
              client_name: clientName.trim(),
              client_phone: digitsToE164(clientPhoneDigits),
              client_email: clientEmail.trim() || null,
              sms_user_id: smsUser?.id ?? null,
              total_public_price: totalAfterPromo,
              prepayment_amount: isPrepayment ? prepaymentAmt : 0,
              remaining_amount: isPrepayment ? remainingAmt : 0,
              online_payment_amount: payOnline,
              payment_method: "online",
              payment_notes: isPrepayment ? "Предоплата" : "Полная оплата",
              pier_id: selectedPier.id,
              pier_name: selectedPier.name,
              pier_address: selectedPier.address ?? null,
              promo_code_id: promo?.id ?? null,
              original_price: baseTotal,
              discount_amount: promoDiscount,
              gift_certificate_id: gift?.id ?? null,
              gift_certificate_amount: giftUsed,
            },
          },
        },
      );
      if (error) throw error;
      if (!data?.success)
        throw new Error(data?.error ?? "Ошибка создания платежа");

      // Save phone to sms_users if Telegram user has no phone yet
      if (smsUser?.id && !smsUser.phone_number && clientPhoneDigits) {
        const e164 = digitsToE164(clientPhoneDigits);
        authSupabase
          .from("sms_users")
          .update({ phone_number: e164 })
          .eq("id", smsUser.id)
          .then(() => fetchProfile());
      }

      const bId = data.public_booking_id as string;
      const confirmUrl = data.confirmation_url as string;
      bookingIdRef.current = bId;
      snapshotRef.current = {
        boatName: boat?.name ?? "",
        boatType: boat?.type ?? null,
        coverImageUrl: boat?.cover_image_url ?? null,
        date,
        startHour,
        duration,
        pier: selectedPier,
        clientName,
        payOnline,
        prepaymentAmt,
        remainingAmt,
        totalAfterPromo,
      };
      awaitingReturn.current = true;
      const returnUrl = Linking.createURL("booking/return");
      const result = await openAuthSessionAsync(confirmUrl, returnUrl, {
        showInRecents: true,
      });
      if (
        result.type === WebBrowserResultType.CANCEL ||
        result.type === WebBrowserResultType.DISMISS
      ) {
        awaitingReturn.current = false;
        setPaying(false);
        await savePendingPayment({ bookingId: bId, confirmationUrl: confirmUrl, amount: payOnline });
      }
    } catch (e: any) {
      setPaying(false);
      Alert.alert(
        "Ошибка",
        e?.message ?? "Не удалось создать платёж. Попробуйте позже.",
      );
    }
  };

  const handleRetryPayment = async () => {
    if (!pendingPayment) return;
    setPaying(true);
    bookingIdRef.current = pendingPayment.bookingId;
    awaitingReturn.current = true;
    const returnUrl = Linking.createURL("booking/return");
    const result = await openAuthSessionAsync(
      pendingPayment.confirmationUrl,
      returnUrl,
      { showInRecents: true },
    );
    if (
      result.type === WebBrowserResultType.CANCEL ||
      result.type === WebBrowserResultType.DISMISS
    ) {
      awaitingReturn.current = false;
      setPaying(false);
    }
  };

  const handleCancelPending = async () => {
    if (!pendingPayment) return;
    await publicSupabase
      .from("public_bookings")
      .update({ booking_status: "cancelled" })
      .eq("id", pendingPayment.bookingId);
    await clearPendingPayment();
    bookingIdRef.current = null;
  };

  // ── Header ───────────────────────────────────────────────────────────────
  const header = (
    <View style={[s.header, { paddingTop: insets.top }]}>
      <Pressable style={s.headerBtn} onPress={() => router.back()} hitSlop={8}>
        <ArrowLeft size={22} color={COLORS.text1} strokeWidth={2} />
      </Pressable>
      <Text style={s.headerTitle}>Оформление брони</Text>
      <View style={s.headerBtn} />
    </View>
  );

  if (loadingBoat)
    return (
      <View style={s.root}>
        {header}
        <View style={s.loader}>
          <Spinner />
        </View>
      </View>
    );
  if (!boat)
    return (
      <View style={s.root}>
        {header}
        <View style={s.loader}>
          <Text style={s.errTxt}>Судно не найдено</Text>
        </View>
      </View>
    );

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {header}

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[
          s.content,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ══ 1. Contact form ══════════════════════════════════════════════ */}
        <Text style={s.secLabel}>Данные для получения заказа</Text>
        <TextInput
          style={s.inputField}
          placeholder="Имя и фамилия"
          placeholderTextColor={COLORS.text3}
          value={clientName}
          onChangeText={setClientName}
          autoCapitalize="words"
          returnKeyType="next"
        />
        <PhoneInput
          digits={clientPhoneDigits}
          onChangeDigits={setClientPhoneDigits}
          style={s.inputField}
          returnKeyType="next"
        />
        <TextInput
          style={s.inputField}
          placeholder="E-mail"
          placeholderTextColor={COLORS.text3}
          value={clientEmail}
          onChangeText={setClientEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          returnKeyType="done"
        />

        {/* ══ 2. Payment method ════════════════════════════════════════════ */}
        <Text style={[s.secLabel, { marginTop: 24 }]}>Оплата бронирования</Text>
        <View style={s.payGrid}>
          <View style={s.payCardWrap}>
            <Pressable style={[s.payCard, s.payCardOn]}>
              <Image source={require("@/../assets/images/yu.png")} style={s.yuImg} contentFit="contain" />
              <Text style={s.payCardSub}>Часть сейчас, остаток на месте</Text>
            </Pressable>
          </View>
        </View>

        {/* ── Менеджер button ───────────────────────────────────────────── */}
        <Pressable
          style={({ pressed }) => [s.managerBtn, pressed && { opacity: 0.7 }]}
          onPress={() => contactSheetRef.current?.present()}
        >
          <MessageCircle size={18} color={COLORS.text2} strokeWidth={1.8} />
          <Text style={s.managerBtnTxt}>Связаться с менеджером</Text>
        </Pressable>

        {/* ══ 3. Promo / Gift (unified) ════════════════════════════════════ */}
        <View style={s.codeSpacer} />

        {/* Container: height animates between toggle height and input height */}
        <Animated.View style={[s.codeContainer, codeContainerStyle]}>

          {/* Toggle row — slides left on open */}
          <Animated.View
            style={codeToggleStyle}
            onLayout={(e) => setCodeToggleH(e.nativeEvent.layout.height)}
            pointerEvents={codeExpanded ? "none" : "auto"}
          >
            <Pressable
              style={s.codeToggleRow}
              onPress={() => {
                setCodeExpanded(true);
                codeProgress.value = withTiming(1, PROMO_TIMING);
              }}
              hitSlop={8}
            >
              <Plus size={16} color={COLORS.text3} strokeWidth={2} />
              <Text style={s.codeToggleTxt}>Промокод или код сертификата</Text>
            </Pressable>
          </Animated.View>

          {/* Input card — slides in from right */}
          <Animated.View
            style={codeInputStyle}
            onLayout={(e) => setCodeInputH(e.nativeEvent.layout.height)}
            pointerEvents={codeExpanded ? "auto" : "none"}
          >
            <View style={s.codeExpandedCard}>
              <View style={s.codeInputRow}>
                <Tag size={15} color={COLORS.text3} strokeWidth={1.8} />
                <TextInput
                  style={s.codeInput}
                  placeholder="Промокод или код сертификата"
                  placeholderTextColor={COLORS.text3}
                  value={codeInput}
                  onChangeText={(t) => {
                    setCodeInput(t.toUpperCase());
                    setPromo(null);
                    setGift(null);
                    setCodeError("");
                  }}
                  autoCapitalize="characters"
                  returnKeyType="done"
                  onSubmitEditing={applyCode}
                  autoFocus={codeExpanded}
                />
                {codeLoading ? (
                  <Spinner size={16} color={COLORS.text3} />
                ) : promo || gift ? (
                  <Pressable
                    onPress={() => {
                      setPromo(null);
                      setGift(null);
                      setCodeInput("");
                      setCodeError("");
                    }}
                    hitSlop={8}
                  >
                    <X size={16} color={COLORS.text3} strokeWidth={2} />
                  </Pressable>
                ) : codeInput.trim() ? (
                  <Pressable onPress={applyCode} hitSlop={8}>
                    <Text style={s.codeOkTxt}>OK</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={() => {
                      codeProgress.value = withTiming(0, PROMO_TIMING, () => {
                        runOnJS(setCodeExpanded)(false);
                        runOnJS(setCodeInput)("");
                        runOnJS(setCodeError)("");
                        runOnJS(setPromo)(null);
                        runOnJS(setGift)(null);
                      });
                    }}
                    hitSlop={8}
                  >
                    <X size={16} color={COLORS.text3} strokeWidth={2} />
                  </Pressable>
                )}
              </View>
              {codeError ? <Text style={s.codeErrTxt}>{codeError}</Text> : null}
              {promo && (
                <Text style={s.codeOkNote}>
                  Скидка {promo.discount_percent}% применена ✓
                </Text>
              )}
              {gift && giftUsed > 0 && (
                <Text style={s.codeOkNote}>
                  Сертификат: −{ruFmt(giftUsed)} ₽ ✓
                </Text>
              )}
            </View>
          </Animated.View>
        </Animated.View>

        {/* ══ 4. White summary card ════════════════════════════════════════ */}
        <View style={s.summaryCard}>
          {/* Boat header */}
          <View style={s.summaryHeader}>
            <View style={s.summaryThumb}>
              {boat.cover_image_url ? (
                <Image
                  source={{ uri: boat.cover_image_url }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
              ) : (
                <LinearGradient
                  colors={[COLORS.brandNavy, COLORS.brandCyan]}
                  style={StyleSheet.absoluteFill}
                />
              )}
            </View>
            <View style={s.summaryBoatInfo}>
              <Text style={s.summaryBoatName} numberOfLines={2}>
                {boat.name}
              </Text>
              {boat.type && <Text style={s.summaryBoatMeta}>{boat.type}</Text>}
            </View>
            <Pressable style={s.editBtn} onPress={handleEditCard} hitSlop={8}>
              <Edit2 size={12} color={COLORS.brandNavy} strokeWidth={2.5} />
              <Text style={s.editBtnTxt}>Изменить</Text>
            </Pressable>
          </View>

          {/* Pier */}
          {selectedPier && (
            <View style={s.pierRow}>
              <Text style={s.pierName}>{selectedPier.name}</Text>
              {selectedPier.address && (
                <Text style={s.pierAddr}>{selectedPier.address}</Text>
              )}
            </View>
          )}

          {/* Tags */}
          <View style={s.tagsRow}>
            {boat.capacity ? (
              <View style={s.tag}>
                <Text style={s.tagTxt}>до {boat.capacity} чел.</Text>
              </View>
            ) : null}
            <View style={s.tag}>
              <Text style={s.tagTxt}>{fmtDateFull(date)}</Text>
            </View>
            {timeConfirmed && (
              <View style={s.tag}>
                <Text style={s.tagTxt}>
                  {fmtHour(startHour)} – {fmtHour(startHour + duration)}
                </Text>
              </View>
            )}
          </View>

          <View style={s.summaryDivider} />

          {/* Price rows */}
          <Text style={s.priceHeader}>Стоимость</Text>
          {timeConfirmed ? (
            <>
              {pricing?.appliedDiscount && (
                <View style={s.discountInfoBanner}>
                  <Text style={s.discountInfoTxt}>
                    🏷 {pricing.appliedDiscount.name} · −{pricing.appliedDiscount.percentage}%
                  </Text>
                </View>
              )}
              <View style={s.priceRow}>
                <Text style={s.priceLabel}>{durLabel(duration)}</Text>
                <Text style={s.priceVal}>
                  {pricingLoading ? "…" : `${ruFmt(baseTotal)} ₽`}
                </Text>
              </View>
              {pricing?.totalSavings && pricing.totalSavings > 0 ? (
                <View style={s.priceRow}>
                  <Text style={s.priceLabel}>
                    Скидка {pricing.appliedDiscount?.percentage}%
                  </Text>
                  <Text style={[s.priceVal, s.priceDiscount]}>
                    −{ruFmt(pricing.totalSavings)} ₽
                  </Text>
                </View>
              ) : null}
              {promoDiscount > 0 && (
                <View style={s.priceRow}>
                  <Text style={s.priceLabel}>
                    Скидка {promo?.discount_percent}%
                  </Text>
                  <Text style={[s.priceVal, s.priceDiscount]}>
                    −{ruFmt(promoDiscount)} ₽
                  </Text>
                </View>
              )}
              {giftUsed > 0 && (
                <View style={s.priceRow}>
                  <Text style={s.priceLabel}>Сертификат</Text>
                  <Text style={[s.priceVal, s.priceDiscount]}>
                    −{ruFmt(giftUsed)} ₽
                  </Text>
                </View>
              )}
              {isPrepayment && (
                <View style={s.priceRow}>
                  <Text style={s.priceLabel}>Остаток (в день аренды)</Text>
                  <Text style={s.priceVal}>{ruFmt(remainingAmt)} ₽</Text>
                </View>
              )}
            </>
          ) : (
            <View style={s.priceRow}>
              <Text style={s.priceLabel}>Выберите дату и время</Text>
              <Text style={s.priceVal}>—</Text>
            </View>
          )}

          <View style={s.summaryDivider} />

          {/* Total */}
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>
              {timeConfirmed
                ? isPrepayment
                  ? "1 оплата сейчас"
                  : "К оплате"
                : "Итого"}
            </Text>
            <Text style={s.totalVal}>
              {timeConfirmed ? `${ruFmt(payOnline)} ₽` : "—"}
            </Text>
          </View>

          {/* Pending payment notice */}
          {pendingPayment && (
            <View style={s.pendingBanner}>
              <Clock size={14} color="#C47A00" strokeWidth={2} />
              <Text style={s.pendingBannerTxt}>
                У вас есть незавершённая оплата — завершите или отмените её, чтобы создать новую бронь.
              </Text>
            </View>
          )}

          {/* Pay button */}
          <Pressable
            style={({ pressed }) => [
              s.payBtn,
              !timeConfirmed && s.payBtnSecondary,
              paymentMode === "contact" && s.payBtnContact,
              (paying || !!pendingPayment) && { opacity: 0.4 },
              pressed && { opacity: 0.85 },
            ]}
            onPress={handleAction}
            disabled={paying || !!pendingPayment}
          >
            {paying ? (
              <Spinner color="#fff" trackColor="rgba(255,255,255,0.3)" />
            ) : !timeConfirmed ? (
              <>
                <Clock size={18} color={COLORS.brandNavy} strokeWidth={2} />
                <Text style={[s.payBtnTxt, { color: COLORS.brandNavy }]}>
                  Выбрать дату и время
                </Text>
              </>
            ) : paymentMode === "contact" ? (
              <>
                <MessageCircle size={18} color="#fff" strokeWidth={2} />
                <Text style={s.payBtnTxt}>Связаться с менеджером</Text>
              </>
            ) : (
              <Text style={s.payBtnTxt}>
                {pricing ? `Оплатить ${ruFmt(payOnline)} ₽` : "Загрузка…"}
              </Text>
            )}
          </Pressable>

          <Text style={s.consentTxt}>
            Нажимая кнопку, вы соглашаетесь с условиями{" "}
            <Text
              style={s.consentLink}
              onPress={() => router.push("/booking/oferta" as any)}
              suppressHighlighting
            >
              Договора-оферты
            </Text>{" "}
            ООО «ВИАМОБИ ВОСТОК» (ИНН 7717283732).
          </Text>
        </View>
      </ScrollView>

      {/* ── Contact sheet ─────────────────────────────────────────────── */}
      <BottomSheetModal
        ref={contactSheetRef}
        enableDynamicSizing
        enablePanDownToClose
        backdropComponent={SheetBackdrop}
        backgroundStyle={{ backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
        handleComponent={() => (
          <View style={{ alignItems: "center", paddingTop: 12, paddingBottom: 4 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: "#DDD" }} />
          </View>
        )}
      >
        <BottomSheetView style={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: insets.bottom + 24 }}>
          <Text style={s.contactSheetTitle}>Связаться с нами</Text>
          <View style={{ gap: 10 }}>
            {([
              { label: "WhatsApp", Icon: MessageCircle, color: "#25D366", url: "https://wa.me/79810076500" },
              { label: "Telegram", Icon: Send,          color: "#229ED9", url: "https://t.me/rentboat_spb" },
              { label: "MAX",      Icon: MessageCircle, color: "#0077FF", url: "tel:+79810076500" },
              { label: "Позвонить",Icon: Phone,         color: "#333333", url: "tel:+78124253360" },
            ] as const).map((ch) => (
              <Pressable
                key={ch.label}
                style={({ pressed }) => [s.contactBtn, pressed && { opacity: 0.6 }]}
                onPress={() => Linking.openURL(ch.url)}
              >
                <ch.Icon size={20} color={ch.color} strokeWidth={1.8} />
                <Text style={s.contactBtnLabel}>{ch.label}</Text>
              </Pressable>
            ))}
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </KeyboardAvoidingView>
  );
}

const RED = "#E8392A";
const BG = COLORS.greyLight;
const DARK = "#1C1C1E";
const GRAY = "#8E8E93";
const SEP = "#E5E5EA";
const SEL_BDR = "#1C1C1E";

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  scroll: { flex: 1 },
  content: { paddingTop: 0 },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  errTxt: { fontSize: 15, color: COLORS.text3 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
    paddingBottom: 8,
    backgroundColor: BG,
  },
  headerBtn: {
    width: 44,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
    color: DARK,
  },

  secLabel: {
    fontSize: 13,
    color: GRAY,
    marginBottom: 8,
    paddingHorizontal: 16,
  },

  inputField: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: DARK,
  },

  payGrid: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  payCardWrap: {
    width: '50%',
  },
  payCard: {
    backgroundColor: COLORS.greyLight,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: SEP,
    padding: 14,
    gap: 6,
    minHeight: 96,
  },
  payCardOn: { borderColor: COLORS.brandNavy},
  payCardLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: DARK,
    lineHeight: 19,
  },
  payCardSub: { fontSize: 11, color: GRAY, lineHeight: 15 },
  yuImg: { width: 48, height: 24 },

  managerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 16,
    marginTop: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: SEP,
  },
  managerBtnTxt: { fontSize: 15, fontWeight: "500", color: DARK },

  contactSheetTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#000",
    textAlign: "center",
    marginBottom: 16,
  },
  contactBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#F2F2F2",
    borderRadius: 14,
    paddingVertical: 16,
  },
  contactBtnLabel: { fontSize: 16, fontWeight: "500", color: "#000" },

  codeSpacer: { height: 4 },
  codeContainer: { marginHorizontal: 16 },
  codeToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
  },
  codeToggleTxt: { fontSize: 15, color: GRAY },
  codeExpandedCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    marginBottom: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  codeInputRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  codeInput: {
    flex: 1,
    fontSize: 16,
    color: DARK,
    paddingVertical: 4,
    padding: 0,
  },
  codeOkTxt: { fontSize: 14, fontWeight: "700", color: COLORS.brandNavy },
  codeErrTxt: { fontSize: 12, color: RED, marginTop: 6 },
  codeOkNote: { fontSize: 12, color: "#2ECC71", marginTop: 6 },

  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    marginTop: 8,
    padding: 20,
    paddingBottom: 8,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  summaryThumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: COLORS.muted,
    flexShrink: 0,
  },
  summaryBoatInfo: { flex: 1, gap: 2 },
  summaryBoatName: {
    fontSize: 16,
    fontWeight: "700",
    color: DARK,
    lineHeight: 22,
  },
  summaryBoatMeta: { fontSize: 13, color: GRAY },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.greyLight,
  },
  editBtnTxt: { fontSize: 11, fontWeight: "700", color: COLORS.brandNavy },

  // Pier
  pierRow: { marginBottom: 12, gap: 2 },
  pierName: { fontSize: 15, color: DARK, fontWeight: "500" },
  pierAddr: { fontSize: 13, color: GRAY },

  // Tags
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  tag: {
    backgroundColor: BG,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagTxt: { fontSize: 14, color: DARK, fontWeight: "500" },

  summaryDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: SEP,
    marginVertical: 14,
  },

  // Price rows
  priceHeader: {
    fontSize: 16,
    fontWeight: "700",
    color: DARK,
    marginBottom: 10,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  priceLabel: { fontSize: 14, color: GRAY },
  priceVal: { fontSize: 14, color: DARK, fontWeight: "500" },
  priceDiscount: { color: RED },
  discountInfoBanner: {
    backgroundColor: "#FFF0F0",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#FFCDD2",
  },
  discountInfoTxt: {
    fontSize: 12,
    fontWeight: "600",
    color: RED,
  },

  // Total
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    paddingVertical: 4,
  },
  totalLabel: { fontSize: 18, fontWeight: "800", color: DARK },
  totalVal: { fontSize: 24, fontWeight: "800", color: DARK },

  // Pay button
  payBtn: {
    height: 58,
    backgroundColor: COLORS.brandNavy,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    flexDirection: "row",
    gap: 8,
  },
  payBtnSecondary: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.brandNavy,
  },
  payBtnContact: { backgroundColor: "#25D366" },
  payBtnTxt: { fontSize: 17, fontWeight: "700", color: COLORS.white },

  pendingBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#FFF8E7",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#F5C842",
    padding: 12,
    marginTop: 16,
  },
  pendingBannerTxt: {
    flex: 1,
    fontSize: 12,
    color: "#7A5000",
    lineHeight: 17,
  },

  consentTxt: {
    marginTop: 16,
    fontSize: 11,
    color: GRAY,
    lineHeight: 16,
    textAlign: "center",
  },
  consentLink: { color: COLORS.brandNavy, fontWeight: "600" },

});
