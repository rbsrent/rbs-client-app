import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import { openAuthSessionAsync, WebBrowserResultType } from "expo-web-browser";
import {
  ArrowLeft,
  Clock,
  CreditCard,
  Edit2,
  MessageCircle,
  Percent,
  Plus,
  Tag,
  X,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  AppState,
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
} from "react-native";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { COLORS } from "@/shared/colors";
import { fmtDateFull } from "@/shared/components/CalendarPicker";
import { PhoneInput } from "@/shared/components/PhoneInput";
import { Spinner } from "@/shared/components/Spinner";
import { publicSupabase, SUPABASE_URL } from "@/shared/supabase/publicClient";
import {
  digitsToE164,
  isValidDigits,
  parsePhoneDigits,
} from "@/shared/utils/phone";
import { useAuthStore } from "@/store/useAuthStore";

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

type PaymentMode = "prepayment" | "contact" | "full";

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

  const bookingIdRef = useRef<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef(AppState.currentState);
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
        startPolling(bookingIdRef.current);
      }
      appStateRef.current = next;
    });
    return () => {
      sub.remove();
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const startPolling = useCallback(
    (bId: string) => {
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
        if (status === "confirmed" || status === "paid") {
          clearInterval(pollRef.current!);
          setPaying(false);
          router.replace(`/bookings/${bId}` as any);
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
    [router],
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
          if ((data.prepaymentAmount ?? 0) > 0) setPaymentMode("prepayment");
          else setPaymentMode("full");
        } else {
          const base = (boat?.price_per_hour ?? 0) * dur;
          const dp = Math.round(base * 0.2);
          setPricing({
            publicPrice: base,
            prepaymentAmount: dp,
            remainingAmount: base - dp,
            durationHours: dur,
          });
          setPaymentMode(dp > 0 ? "prepayment" : "full");
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
    router.push(
      `/booking/edit-trip?boatId=${boatId}&date=${dateISO}&startHour=${startHour}&duration=${duration}&pierId=${selectedPier?.id ?? ""}&minDuration=${minDur}` as any,
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
    baseTotal, promoDiscount, totalAfterPromo,
    prepaymentAmt, remainingAmt, isPrepayment, payNow, giftUsed, payOnline,
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
    const giftUsed = gift
      ? Math.min(gift.balance, payNow, totalAfterPromo)
      : 0;
    const payOnline = Math.max(0, payNow - giftUsed);
    return {
      baseTotal, promoDiscount, totalAfterPromo,
      prepaymentAmt, remainingAmt, isPrepayment, payNow, giftUsed, payOnline,
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
            booking_data: {
              boat_id: boat.id,
              start_datetime: startDt.toISOString(),
              end_datetime: endDt.toISOString(),
              client_name: clientName.trim(),
              client_phone: digitsToE164(clientPhoneDigits),
              client_email: clientEmail.trim() || null,
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
      bookingIdRef.current = data.public_booking_id as string;
      awaitingReturn.current = true;
      const returnUrl = Linking.createURL("booking/return");
      const result = await openAuthSessionAsync(
        data.confirmation_url as string,
        returnUrl,
        { showInRecents: true },
      );
      if (
        result.type === WebBrowserResultType.CANCEL ||
        result.type === WebBrowserResultType.DISMISS
      )
        setPaying(false);
    } catch (e: any) {
      setPaying(false);
      Alert.alert(
        "Ошибка",
        e?.message ?? "Не удалось создать платёж. Попробуйте позже.",
      );
    }
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
        <View style={s.loader}><Spinner /></View>
      </View>
    );
  if (!boat)
    return (
      <View style={s.root}>
        {header}
        <View style={s.loader}><Text style={s.errTxt}>Судно не найдено</Text></View>
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
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]}
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
        <Text style={[s.secLabel, { marginTop: 24 }]}>Способ оплаты</Text>
        <View style={s.payGrid}>
          {prepaymentAmt > 0 && (
            <Pressable
              style={[s.payCard, paymentMode === "prepayment" && s.payCardOn]}
              onPress={() => setPaymentMode("prepayment")}
            >
              <Percent size={26} color={COLORS.text1} strokeWidth={1.8} />
              <Text style={s.payCardLabel}>Предоплата</Text>
              <Text style={s.payCardSub}>{ruFmt(prepaymentAmt)} ₽</Text>
            </Pressable>
          )}
          <Pressable
            style={[s.payCard, paymentMode === "full" && s.payCardOn]}
            onPress={() => setPaymentMode("full")}
          >
            <CreditCard size={26} color={COLORS.text1} strokeWidth={1.8} />
            <Text style={s.payCardLabel}>{"Полная\nоплата"}</Text>
          </Pressable>
          <Pressable
            style={[s.payCard, paymentMode === "contact" && s.payCardOn]}
            onPress={() => setPaymentMode("contact")}
          >
            <MessageCircle size={26} color={COLORS.text1} strokeWidth={1.8} />
            <Text style={s.payCardLabel}>Менеджер</Text>
          </Pressable>
        </View>

        {/* ══ 3. Promo / Gift (unified) ════════════════════════════════════ */}
        <View style={s.codeSpacer} />
        {!codeExpanded ? (
          <Pressable
            style={s.codeToggleRow}
            onPress={() => {
              LayoutAnimation.configureNext({
                duration: 260,
                create:  { type: "easeInEaseOut", property: "opacity" },
                update:  { type: "easeInEaseOut" },
                delete:  { type: "easeInEaseOut", property: "opacity" },
              });
              setCodeExpanded(true);
            }}
            hitSlop={8}
          >
            <Plus size={16} color={COLORS.text3} strokeWidth={2} />
            <Text style={s.codeToggleTxt}>Промокод или код сертификата</Text>
          </Pressable>
        ) : (
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
                autoFocus
              />
              {codeLoading ? (
                <Spinner size={16} color={COLORS.text3} />
              ) : (promo || gift) ? (
                <Pressable onPress={() => { setPromo(null); setGift(null); setCodeInput(""); setCodeError(""); }} hitSlop={8}>
                  <X size={16} color={COLORS.text3} strokeWidth={2} />
                </Pressable>
              ) : codeInput.trim() ? (
                <Pressable onPress={applyCode} hitSlop={8}>
                  <Text style={s.codeOkTxt}>OK</Text>
                </Pressable>
              ) : (
                <Pressable onPress={() => {
                  LayoutAnimation.configureNext({
                    duration: 240,
                    create:  { type: "easeInEaseOut", property: "opacity" },
                    update:  { type: "easeInEaseOut" },
                    delete:  { type: "easeInEaseOut", property: "opacity" },
                  });
                  setCodeExpanded(false);
                  setCodeInput(""); setCodeError("");
                  setPromo(null); setGift(null);
                }} hitSlop={8}>
                  <X size={16} color={COLORS.text3} strokeWidth={2} />
                </Pressable>
              )}
            </View>
            {codeError ? <Text style={s.codeErrTxt}>{codeError}</Text> : null}
            {promo && <Text style={s.codeOkNote}>Скидка {promo.discount_percent}% применена ✓</Text>}
            {gift && giftUsed > 0 && <Text style={s.codeOkNote}>Сертификат: −{ruFmt(giftUsed)} ₽ ✓</Text>}
          </View>
        )}

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
              <Text style={s.summaryBoatName} numberOfLines={2}>{boat.name}</Text>
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
              {selectedPier.address && <Text style={s.pierAddr}>{selectedPier.address}</Text>}
            </View>
          )}

          {/* Tags */}
          <View style={s.tagsRow}>
            {boat.capacity ? <View style={s.tag}><Text style={s.tagTxt}>до {boat.capacity} чел.</Text></View> : null}
            <View style={s.tag}><Text style={s.tagTxt}>{fmtDateFull(date)}</Text></View>
            {timeConfirmed && (
              <View style={s.tag}>
                <Text style={s.tagTxt}>{fmtHour(startHour)} – {fmtHour(startHour + duration)}</Text>
              </View>
            )}
          </View>

          <View style={s.summaryDivider} />

          {/* Price rows */}
          <Text style={s.priceHeader}>Стоимость</Text>
          {timeConfirmed ? (
            <>
              <View style={s.priceRow}>
                <Text style={s.priceLabel}>{durLabel(duration)}</Text>
                <Text style={s.priceVal}>
                  {pricingLoading ? "…" : `${ruFmt(baseTotal)} ₽`}
                </Text>
              </View>
              {promoDiscount > 0 && (
                <View style={s.priceRow}>
                  <Text style={s.priceLabel}>Скидка {promo?.discount_percent}%</Text>
                  <Text style={[s.priceVal, s.priceDiscount]}>−{ruFmt(promoDiscount)} ₽</Text>
                </View>
              )}
              {giftUsed > 0 && (
                <View style={s.priceRow}>
                  <Text style={s.priceLabel}>Сертификат</Text>
                  <Text style={[s.priceVal, s.priceDiscount]}>−{ruFmt(giftUsed)} ₽</Text>
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
                ? isPrepayment ? "1 оплата сейчас" : "К оплате"
                : "Итого"}
            </Text>
            <Text style={s.totalVal}>
              {timeConfirmed ? `${ruFmt(payOnline)} ₽` : "—"}
            </Text>
          </View>

          {/* Pay button */}
          <Pressable
            style={({ pressed }) => [
              s.payBtn,
              !timeConfirmed && s.payBtnSecondary,
              paymentMode === "contact" && s.payBtnContact,
              paying && { opacity: 0.7 },
              pressed && { opacity: 0.85 },
            ]}
            onPress={handleAction}
            disabled={paying}
          >
            {paying ? (
              <Spinner color="#fff" trackColor="rgba(255,255,255,0.3)" />
            ) : !timeConfirmed ? (
              <>
                <Clock size={18} color={COLORS.brandNavy} strokeWidth={2} />
                <Text style={[s.payBtnTxt, { color: COLORS.brandNavy }]}>Выбрать дату и время</Text>
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
    </KeyboardAvoidingView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

const RED     = "#E8392A";
const BG      = COLORS.greyLight;
const DARK    = "#1C1C1E";
const GRAY    = "#8E8E93";
const SEP     = "#E5E5EA";
const SEL_BDR = "#1C1C1E";

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: BG },
  scroll: { flex: 1 },
  content: { paddingTop: 0 },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  errTxt: { fontSize: 15, color: COLORS.text3 },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
    paddingBottom: 8,
    backgroundColor: BG,
  },
  headerBtn: { width: 44, height: 48, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 17, fontWeight: "700", color: DARK },

  // ── Section label ─────────────────────────────────────────────────────────
  secLabel: {
    fontSize: 13,
    color: GRAY,
    marginBottom: 8,
    paddingHorizontal: 16,
  },

  // ── Separate input fields ─────────────────────────────────────────────────
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

  // ── Payment cards grid ────────────────────────────────────────────────────
  payGrid: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  payCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: SEP,
    padding: 14,
    gap: 6,
    minHeight: 96,
  },
  payCardOn: { borderColor: SEL_BDR, borderWidth: 2 },
  payCardLabel: { fontSize: 14, fontWeight: "600", color: DARK, lineHeight: 19 },
  payCardSub:   { fontSize: 12, color: GRAY },

  // ── Promo / Gift ──────────────────────────────────────────────────────────
  codeSpacer: { height: 4 },
  codeToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 16,
    paddingVertical: 14,
  },
  codeToggleTxt: { fontSize: 15, color: GRAY },
  codeExpandedCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  codeInputRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  codeInput:    { flex: 1, fontSize: 16, color: DARK, paddingVertical: 4, padding: 0 },
  codeOkTxt:    { fontSize: 14, fontWeight: "700", color: COLORS.brandNavy },
  codeErrTxt:   { fontSize: 12, color: RED, marginTop: 6 },
  codeOkNote:   { fontSize: 12, color: "#2ECC71", marginTop: 6 },

  // ── White summary card ────────────────────────────────────────────────────
  summaryCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
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
  summaryBoatName: { fontSize: 16, fontWeight: "700", color: DARK, lineHeight: 22 },
  summaryBoatMeta: { fontSize: 13, color: GRAY },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.brandNavy + "30",
    backgroundColor: COLORS.brandNavy + "08",
  },
  editBtnTxt: { fontSize: 11, fontWeight: "700", color: COLORS.brandNavy },

  // Pier
  pierRow:  { marginBottom: 12, gap: 2 },
  pierName: { fontSize: 15, color: DARK, fontWeight: "500" },
  pierAddr: { fontSize: 13, color: GRAY },

  // Tags
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  tag:     { backgroundColor: BG, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  tagTxt:  { fontSize: 14, color: DARK, fontWeight: "500" },

  summaryDivider: { height: StyleSheet.hairlineWidth, backgroundColor: SEP, marginVertical: 14 },

  // Price rows
  priceHeader: { fontSize: 16, fontWeight: "700", color: DARK, marginBottom: 10 },
  priceRow:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 4 },
  priceLabel:  { fontSize: 14, color: GRAY },
  priceVal:    { fontSize: 14, color: DARK, fontWeight: "500" },
  priceDiscount: { color: RED },

  // Total
  totalRow:  { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", paddingVertical: 4 },
  totalLabel: { fontSize: 18, fontWeight: "800", color: DARK },
  totalVal:   { fontSize: 24, fontWeight: "800", color: DARK },

  // Pay button
  payBtn: {
    height: 58,
    backgroundColor: RED,
    borderRadius: 29,
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
  payBtnTxt:     { fontSize: 17, fontWeight: "700", color: COLORS.white },

  consentTxt:  { marginTop: 16, fontSize: 11, color: GRAY, lineHeight: 16, textAlign: "center" },
  consentLink: { color: COLORS.brandNavy, fontWeight: "600" },
});
