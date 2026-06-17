import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { openAuthSessionAsync, WebBrowserResultType } from 'expo-web-browser';
import { ChevronRight, Ruler, Users } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '@/shared/colors';
import { ScreenHeader } from '@/shared/components/ScreenHeader';
import { digitsToE164, isValidDigits } from '@/shared/utils/phone';
import { publicSupabase, SUPABASE_URL } from '@/shared/supabase/publicClient';

import { TimeSlotSheet } from '../components/TimeSlotSheet';
import { PierMapSheet } from '../components/PierMapSheet';
import { StepProgress } from '../components/StepProgress';
import { BookingStep1 } from '../components/BookingStep1';
import { BookingStep2 } from '../components/BookingStep2';
import { BookingStep3 } from '../components/BookingStep3';
import { BookingStep4 } from '../components/BookingStep4';
import { Boat, Pier, PricingResult } from '../types';
import { buildDatetime, fmtHour, fmtShort, durLabel, ruFmt, uuid } from '../utils';

// ─── Local types (not shared) ─────────────────────────────────────────────────

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

// ─── Screen ───────────────────────────────────────────────────────────────────

export function BookingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    boatId,
    date: dateParam,
    startHour: hourParam,
    duration: durParam,
  } = useLocalSearchParams<{ boatId: string; date?: string; startHour?: string; duration?: string }>();

  const scrollRef = useRef<ScrollView>(null);

  const [step, setStep] = useState(1);

  const [boat, setBoat]               = useState<Boat | null>(null);
  const [loadingBoat, setLoadingBoat] = useState(true);

  const [date, setDate] = useState<Date>(() => {
    if (dateParam) { const d = new Date(dateParam); if (!isNaN(d.getTime())) return d; }
    return new Date();
  });
  const [startHour, setStartHour] = useState<number>(hourParam ? Number(hourParam) : -1);
  const [duration, setDuration]   = useState<number>(durParam  ? Number(durParam)  : 0);
  const [timeConfirmed, setTimeConfirmed] = useState(() => !!(hourParam && durParam));
  const [sheetOpen, setSheetOpen]       = useState(false);
  const [pierMapOpen, setPierMapOpen]   = useState(false);

  const [piers, setPiers]               = useState<Pier[]>([]);
  const [selectedPier, setSelectedPier] = useState<Pier | null>(null);
  const [promoInput, setPromoInput]     = useState('');
  const [promo, setPromo]               = useState<PromoResult | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError]     = useState('');
  const [pricing, setPricing]           = useState<PricingResult | null>(null);
  const [pricingLoading, setPricingLoading] = useState(false);

  const [clientName,        setClientName]        = useState('');
  const [clientPhoneDigits, setClientPhoneDigits] = useState('');
  const [clientEmail,       setClientEmail]       = useState('');

  const [isPrepayment, setIsPrepayment] = useState(false);
  const [giftInput, setGiftInput]       = useState('');
  const [gift, setGift]                 = useState<GiftCertResult | null>(null);
  const [giftLoading, setGiftLoading]   = useState(false);
  const [giftError, setGiftError]       = useState('');
  const [paying, setPaying]             = useState(false);

  const bookingIdRef   = useRef<string | null>(null);
  const pollRef        = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef    = useRef(AppState.currentState);
  const awaitingReturn = useRef(false);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        next === 'active' &&
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

  const startPolling = useCallback((bId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts++;
      const { data } = await publicSupabase
        .from('public_bookings')
        .select('booking_status')
        .eq('id', bId)
        .single();
      const status = (data as any)?.booking_status;
      if (status === 'confirmed' || status === 'paid') {
        clearInterval(pollRef.current!);
        setPaying(false);
        router.replace(`/bookings/${bId}` as any);
      } else if (status === 'cancelled') {
        clearInterval(pollRef.current!);
        setPaying(false);
        Alert.alert('Оплата не прошла', 'Попробуйте ещё раз.');
      } else if (attempts >= 30) {
        clearInterval(pollRef.current!);
        setPaying(false);
      }
    }, 2000);
  }, [router]);

  // Reset time selection when date changes
  const isFirstDateRender = useRef(true);
  useEffect(() => {
    if (isFirstDateRender.current) { isFirstDateRender.current = false; return; }
    setStartHour(-1);
    setDuration(0);
    setTimeConfirmed(false);
  }, [date]);

  useEffect(() => {
    if (!boatId) return;
    (async () => {
      const { data } = await publicSupabase
        .from('boats')
        .select('id, name, type, capacity, length_meters, price_per_hour, pier_id, boat_images(image_path, position), piers(id, name, address, latitude, longitude)')
        .eq('id', boatId)
        .single();
      if (data) {
        const d = data as any;
        const sorted = [...(d.boat_images ?? [])].sort((a: any, z: any) => a.position - z.position);
        const img = sorted[0]?.image_path ?? null;
        setBoat({
          id: d.id, name: d.name, type: d.type,
          capacity: d.capacity, length_meters: d.length_meters,
          price_per_hour: d.price_per_hour,
          cover_image_url: img ? `${SUPABASE_URL}/storage/v1/object/public/boat_images/${img}` : null,
        });
        const { data: assignments } = await publicSupabase
          .from('boat_pier_assignments')
          .select('pier_id, piers(id, name, address, latitude, longitude)')
          .eq('boat_id', boatId);

        let pierList: Pier[] = [];
        if (assignments && assignments.length > 0) {
          pierList = (assignments as any[]).map((a: any) => a.piers).filter(Boolean);
        }
        if (pierList.length === 0 && d.piers) {
          pierList = [d.piers];
        }
        setPiers(pierList);
        if (pierList.length > 0) setSelectedPier(pierList[0]);
      }
      setLoadingBoat(false);
    })();
  }, [boatId]);

  const fetchPricing = useCallback(async () => {
    if (!boatId) return;
    setPricingLoading(true);
    try {
      const startDt = buildDatetime(date, startHour);
      const endDt   = buildDatetime(date, startHour + duration);
      const { data, error } = await publicSupabase.functions.invoke('calculate-public-booking-pricing', {
        body: { boatId, startTime: startDt.toISOString(), endTime: endDt.toISOString() },
      });
      if (!error && data?.publicPrice) {
        setPricing({
          publicPrice:        data.publicPrice,
          prepaymentAmount:   data.prepaymentAmount  ?? Math.round(data.publicPrice * 0.2),
          remainingAmount:    data.remainingAmount   ?? data.publicPrice - Math.round(data.publicPrice * 0.2),
          durationHours:      data.durationHours     ?? duration,
          originalHourlyRate: data.originalHourlyRate,
          finalHourlyRate:    data.finalHourlyRate,
          appliedDiscount:    data.appliedDiscount ?? null,
          totalSavings:       data.totalSavings ?? 0,
        });
        if ((data.prepaymentAmount ?? 0) > 0) setIsPrepayment(true);
      } else {
        const base = (boat?.price_per_hour ?? 0) * duration;
        const dp   = Math.round(base * 0.2);
        setPricing({ publicPrice: base, prepaymentAmount: dp, remainingAmount: base - dp, durationHours: duration });
        if (dp > 0) setIsPrepayment(true);
      }
    } catch {
      const base = (boat?.price_per_hour ?? 0) * duration;
      const dp   = Math.round(base * 0.2);
      setPricing({ publicPrice: base, prepaymentAmount: dp, remainingAmount: base - dp, durationHours: duration });
    }
    setPricingLoading(false);
  }, [boatId, date, startHour, duration, boat]);

  const applyPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    setPromoError('');
    const { data } = await publicSupabase
      .from('promo_codes')
      .select('id, code, discount_percent')
      .ilike('code', promoInput.trim())
      .eq('is_active', true)
      .maybeSingle();
    if (!data) {
      setPromoError('Промокод не найден или недействителен');
      setPromo(null);
    } else {
      setPromo(data as any);
    }
    setPromoLoading(false);
  };

  const applyGift = async () => {
    if (!giftInput.trim()) return;
    setGiftLoading(true);
    setGiftError('');
    const { data } = await publicSupabase
      .from('gift_certificates')
      .select('id, code, balance')
      .ilike('code', giftInput.trim())
      .eq('is_active', true)
      .gt('balance', 0)
      .maybeSingle();
    if (!data) {
      setGiftError('Сертификат не найден или исчерпан');
      setGift(null);
    } else {
      setGift(data as any);
    }
    setGiftLoading(false);
  };

  const baseTotal       = pricing?.publicPrice ?? (boat?.price_per_hour ?? 0) * duration;
  const promoDiscount   = promo ? Math.round(baseTotal * promo.discount_percent / 100) : 0;
  const totalAfterPromo = baseTotal - promoDiscount;
  const prepaymentAmt   = pricing
    ? Math.max(0, pricing.prepaymentAmount - promoDiscount)
    : Math.round(totalAfterPromo * 0.2);
  const remainingAmt    = totalAfterPromo - prepaymentAmt;
  const payNow          = isPrepayment ? prepaymentAmt : totalAfterPromo;
  const giftUsed        = gift ? Math.min(gift.balance, payNow, totalAfterPromo) : 0;
  const payOnline       = Math.max(0, payNow - giftUsed);

  const goNext = async () => {
    if (step === 1) {
      if (!timeConfirmed) { Alert.alert('', 'Выберите время начала'); return; }
      await fetchPricing();
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      if (!clientName.trim())              { Alert.alert('', 'Введите имя'); return; }
      if (!isValidDigits(clientPhoneDigits)) { Alert.alert('', 'Введите корректный номер телефона'); return; }
      setStep(4);
    }
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const goBack = () => {
    if (step > 1) { setStep(step - 1); scrollRef.current?.scrollTo({ y: 0, animated: false }); }
    else router.back();
  };

  const handlePay = async () => {
    if (!boat || !selectedPier) return;
    const startDt = buildDatetime(date, startHour);
    const endDt   = buildDatetime(date, startHour + duration);

    setPaying(true);
    try {
      const { data, error } = await publicSupabase.functions.invoke('create-yookassa-payment', {
        body: {
          amount:          Math.round(payOnline * 100),
          description:     `Аренда катера ${boat.name}`,
          payment_type:    isPrepayment ? 'prepayment' : 'full_payment',
          idempotency_key: uuid(),
          booking_data: {
            boat_id:               boat.id,
            start_datetime:        startDt.toISOString(),
            end_datetime:          endDt.toISOString(),
            client_name:           clientName.trim(),
            client_phone:          digitsToE164(clientPhoneDigits),
            client_email:          clientEmail.trim() || null,
            total_public_price:    totalAfterPromo,
            prepayment_amount:     isPrepayment ? prepaymentAmt : 0,
            remaining_amount:      isPrepayment ? remainingAmt  : 0,
            online_payment_amount: payOnline,
            payment_method:        'online',
            payment_notes:         isPrepayment ? 'Предоплата' : 'Полная оплата',
            pier_id:               selectedPier.id,
            pier_name:             selectedPier.name,
            pier_address:          selectedPier.address ?? null,
            promo_code_id:         promo?.id ?? null,
            original_price:        baseTotal,
            discount_amount:       promoDiscount,
            gift_certificate_id:     gift?.id   ?? null,
            gift_certificate_amount: giftUsed,
          },
        },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error ?? 'Ошибка создания платежа');

      bookingIdRef.current   = data.public_booking_id as string;
      awaitingReturn.current = true;

      const returnUrl = Linking.createURL('booking/return');
      const result = await openAuthSessionAsync(data.confirmation_url as string, returnUrl, {
        showInRecents: true,
      });

      if (result.type === WebBrowserResultType.CANCEL || result.type === WebBrowserResultType.DISMISS) {
        setPaying(false);
      }
    } catch (e: any) {
      setPaying(false);
      Alert.alert('Ошибка', e?.message ?? 'Не удалось создать платёж. Попробуйте позже.');
    }
  };

  const dateLabel = `${fmtShort(date)}, ${fmtHour(startHour)} · ${durLabel(duration)}`;

  if (loadingBoat) {
    return (
      <View style={s.root}>
        <ScreenHeader title="Бронирование" onBack={goBack} />
        <View style={s.loader}><ActivityIndicator color={COLORS.brandNavy} size="large" /></View>
      </View>
    );
  }
  if (!boat) {
    return (
      <View style={s.root}>
        <ScreenHeader title="Бронирование" onBack={goBack} />
        <View style={s.loader}><Text style={s.errTxt}>Судно не найдено</Text></View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScreenHeader title="Бронирование" onBack={goBack} />
      <StepProgress step={step} />

      <ScrollView
        ref={scrollRef}
        style={s.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Boat card ── */}
        <View style={s.boatCard}>
          <View style={s.boatThumb}>
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
          <View style={s.boatInfo}>
            <Text style={s.boatName} numberOfLines={2}>{boat.name}</Text>
            <View style={s.boatMeta}>
              {boat.type ? <Text style={s.metaBadge}>{boat.type}</Text> : null}
              {boat.capacity ? (
                <View style={s.metaItem}>
                  <Users size={11} color={COLORS.text3} strokeWidth={2} />
                  <Text style={s.metaTxt}>{boat.capacity} чел.</Text>
                </View>
              ) : null}
              {boat.length_meters ? (
                <View style={s.metaItem}>
                  <Ruler size={11} color={COLORS.text3} strokeWidth={2} />
                  <Text style={s.metaTxt}>{boat.length_meters} м</Text>
                </View>
              ) : null}
            </View>
          </View>
          <View style={s.boatPriceBlock}>
            <Text style={s.boatPrice}>{ruFmt(boat.price_per_hour)} ₽</Text>
            <Text style={s.boatPriceSub}>за час</Text>
          </View>
        </View>

        {/* ════ STEP 1 ════ */}
        {step === 1 && (
          <BookingStep1
            date={date}
            onDateChange={setDate}
            timeConfirmed={timeConfirmed}
            startHour={startHour}
            duration={duration}
            onOpenSheet={() => setSheetOpen(true)}
            totalAfterPromo={totalAfterPromo}
            boat={boat}
          />
        )}

        {/* ════ STEP 2 ════ */}
        {step === 2 && (
          <BookingStep2
            date={date}
            startHour={startHour}
            duration={duration}
            dateLabel={dateLabel}
            piers={piers}
            selectedPier={selectedPier}
            onSelectPier={setSelectedPier}
            onOpenMap={() => setPierMapOpen(true)}
            promoInput={promoInput}
            onPromoInputChange={(t) => { setPromoInput(t); setPromo(null); setPromoError(''); }}
            promoLoading={promoLoading}
            promo={promo}
            promoError={promoError}
            onApplyPromo={applyPromo}
            pricingLoading={pricingLoading}
            pricing={pricing}
            baseTotal={baseTotal}
            promoDiscount={promoDiscount}
            totalAfterPromo={totalAfterPromo}
            prepaymentAmt={prepaymentAmt}
            remainingAmt={remainingAmt}
            boat={boat}
            onEditDate={() => setStep(1)}
          />
        )}

        {/* ════ STEP 3 ════ */}
        {step === 3 && (
          <BookingStep3
            date={date}
            startHour={startHour}
            duration={duration}
            selectedPier={selectedPier}
            totalAfterPromo={totalAfterPromo}
            clientName={clientName}
            onNameChange={setClientName}
            clientPhoneDigits={clientPhoneDigits}
            onPhoneChange={setClientPhoneDigits}
            clientEmail={clientEmail}
            onEmailChange={setClientEmail}
          />
        )}

        {/* ════ STEP 4 ════ */}
        {step === 4 && (
          <BookingStep4
            boat={boat}
            date={date}
            startHour={startHour}
            duration={duration}
            selectedPier={selectedPier}
            clientName={clientName}
            clientPhoneDigits={clientPhoneDigits}
            clientEmail={clientEmail}
            totalAfterPromo={totalAfterPromo}
            prepaymentAmt={prepaymentAmt}
            remainingAmt={remainingAmt}
            isPrepayment={isPrepayment}
            onSetPrepayment={setIsPrepayment}
            giftInput={giftInput}
            onGiftInputChange={(t) => { setGiftInput(t); setGift(null); setGiftError(''); }}
            giftLoading={giftLoading}
            gift={gift}
            giftError={giftError}
            giftUsed={giftUsed}
            onApplyGift={applyGift}
            payNow={payNow}
            payOnline={payOnline}
          />
        )}
      </ScrollView>

      {/* ── Bottom CTA ── */}
      <View style={[s.bottomBar, { paddingBottom: insets.bottom + 10 }]}>
        {step < 4 ? (
          <Pressable
            style={({ pressed }) => [s.ctaBtn, pricingLoading && { opacity: 0.6 }, pressed && { opacity: 0.88 }]}
            onPress={goNext}
            disabled={pricingLoading}
          >
            {pricingLoading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Text style={s.ctaTxt}>Далее</Text>
                <ChevronRight size={18} color={COLORS.white} strokeWidth={2.5} />
              </>
            )}
          </Pressable>
        ) : (
          <View style={s.payBar}>
            <View>
              <Text style={s.payLabel}>К оплате онлайн</Text>
              <Text style={s.payAmount}>{ruFmt(payOnline)} ₽</Text>
            </View>
            <Pressable
              style={({ pressed }) => [
                s.payBtn,
                paying && { opacity: 0.6 },
                pressed && { opacity: 0.86 },
              ]}
              onPress={handlePay}
              disabled={paying}
            >
              {paying ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={s.ctaTxt}>Оплатить</Text>
              )}
            </Pressable>
          </View>
        )}
      </View>

      <PierMapSheet
        visible={pierMapOpen}
        piers={piers}
        selectedPier={selectedPier}
        onSelect={(p) => { setSelectedPier(p); }}
        onClose={() => setPierMapOpen(false)}
      />

      <TimeSlotSheet
        visible={sheetOpen}
        date={date}
        boatId={boatId}
        onConfirm={(h, dur) => {
          setStartHour(h);
          setDuration(dur);
          setTimeConfirmed(true);
        }}
        onClose={() => setSheetOpen(false)}
      />
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: COLORS.backgroundAlt },
  scroll: { flex: 1 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errTxt: { fontSize: 15, color: COLORS.text3 },

  /* boat card */
  boatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 2,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  boatThumb: {
    width: 64,
    height: 64,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.muted,
  },
  boatInfo:  { flex: 1, gap: 6 },
  boatName:  { fontSize: 15, fontWeight: '700', color: COLORS.text1, lineHeight: 20 },
  boatMeta:  { flexDirection: 'row', gap: 8, flexWrap: 'wrap', alignItems: 'center' },
  metaBadge: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.brandCyan,
    backgroundColor: COLORS.brandCyan + '18',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  metaItem:  { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaTxt:   { fontSize: 11, color: COLORS.text3 },
  boatPriceBlock: { alignItems: 'flex-end' },
  boatPrice:      { fontSize: 16, fontWeight: '800', color: COLORS.brandNavy },
  boatPriceSub:   { fontSize: 11, color: COLORS.text3, marginTop: 1 },

  /* bottom bar */
  bottomBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  ctaBtn: {
    height: 54,
    backgroundColor: COLORS.brandNavy,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  ctaTxt:    { fontSize: 16, fontWeight: '700', color: COLORS.white },
  payBar:    { flexDirection: 'row', alignItems: 'center', gap: 16 },
  payLabel:  { fontSize: 11, color: COLORS.text3, marginBottom: 1 },
  payAmount: { fontSize: 22, fontWeight: '800', color: COLORS.brandNavy },
  payBtn: {
    flex: 1,
    height: 54,
    backgroundColor: COLORS.brandNavy,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
