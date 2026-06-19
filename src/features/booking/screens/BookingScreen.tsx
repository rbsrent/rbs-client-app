import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { openAuthSessionAsync, WebBrowserResultType } from 'expo-web-browser';
import { Ruler, Users, X } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  AppState,
  Dimensions,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '@/shared/colors';
import { publicSupabase, SUPABASE_URL } from '@/shared/supabase/publicClient';
import { digitsToE164, isValidDigits } from '@/shared/utils/phone';

import { BookingStep1 } from '../components/BookingStep1';
import { BookingStep2 } from '../components/BookingStep2';
import { BookingStep3 } from '../components/BookingStep3';
import { BookingStep4 } from '../components/BookingStep4';
import { PierMapSheet } from '../components/PierMapSheet';
import { STEP_LABELS, StepProgress } from '../components/StepProgress';
import { TimeSlotSheet } from '../components/TimeSlotSheet';
import { Boat, Pier, PricingResult } from '../types';
import { buildDatetime, durLabel, fmtHour, fmtShort, ruFmt, uuid } from '../utils';
import { Spinner } from '@/shared/components/Spinner';

const SCREEN_W = Dimensions.get('window').width;
const SPRING   = { useNativeDriver: true, tension: 280, friction: 32 } as const;

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

export function BookingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    boatId,
    date: dateParam,
    startHour: hourParam,
    duration: durParam,
  } = useLocalSearchParams<{ boatId: string; date?: string; startHour?: string; duration?: string }>();

  const scrollRef = useRef<any>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const enterX       = useRef(new Animated.Value(0)).current;
  const exitX        = useRef(new Animated.Value(0)).current;
  const enterOpacity = useRef(new Animated.Value(1)).current;

  const [visibleStep, setVisibleStep] = useState(1);
  const [ghostStep, setGhostStep]     = useState<number | null>(null);

  // Stable refs for PanResponder closures (created once)
  const stepRef        = useRef(1);
  const visibleStepRef = useRef(1);
  const isSwipingRef   = useRef(false);
  const isAnimatingRef = useRef(false);

  const COLLAPSE_AT = 72;
  const headerTitleOpacity = scrollY.interpolate({ inputRange: [COLLAPSE_AT * 0.5, COLLAPSE_AT], outputRange: [0, 1], extrapolate: 'clamp' });
  const contentTitleOpacity = scrollY.interpolate({ inputRange: [0, COLLAPSE_AT * 0.5], outputRange: [1, 0], extrapolate: 'clamp' });

  const [step, setStep] = useState(1);
  // Keep refs in sync so PanResponder (created once) always sees fresh values
  stepRef.current        = step;
  visibleStepRef.current = visibleStep;

  const [boat, setBoat] = useState<Boat | null>(null);
  const [loadingBoat, setLoadingBoat] = useState(true);

  const [date, setDate] = useState<Date>(() => {
    if (dateParam) { const d = new Date(dateParam); if (!isNaN(d.getTime())) return d; }
    return new Date();
  });
  const [startHour, setStartHour] = useState<number>(hourParam ? Number(hourParam) : -1);
  const [duration, setDuration] = useState<number>(durParam ? Number(durParam) : 0);
  const [timeConfirmed, setTimeConfirmed] = useState(() => !!(hourParam && durParam));
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pierMapOpen, setPierMapOpen] = useState(false);

  const [piers, setPiers] = useState<Pier[]>([]);
  const [selectedPier, setSelectedPier] = useState<Pier | null>(null);
  const [promoInput, setPromoInput] = useState('');
  const [promo, setPromo] = useState<PromoResult | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [pricing, setPricing] = useState<PricingResult | null>(null);
  const [pricingLoading, setPricingLoading] = useState(false);

  const [clientName, setClientName] = useState('');
  const [clientPhoneDigits, setClientPhoneDigits] = useState('');
  const [clientEmail, setClientEmail] = useState('');

  const [isPrepayment, setIsPrepayment] = useState(false);
  const [giftInput, setGiftInput] = useState('');
  const [gift, setGift] = useState<GiftCertResult | null>(null);
  const [giftLoading, setGiftLoading] = useState(false);
  const [giftError, setGiftError] = useState('');
  const [paying, setPaying] = useState(false);

  const bookingIdRef = useRef<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef(AppState.currentState);
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
      const endDt = buildDatetime(date, startHour + duration);
      const { data, error } = await publicSupabase.functions.invoke('calculate-public-booking-pricing', {
        body: { boatId, startTime: startDt.toISOString(), endTime: endDt.toISOString() },
      });
      if (!error && data?.publicPrice) {
        setPricing({
          publicPrice: data.publicPrice,
          prepaymentAmount: data.prepaymentAmount ?? Math.round(data.publicPrice * 0.2),
          remainingAmount: data.remainingAmount ?? data.publicPrice - Math.round(data.publicPrice * 0.2),
          durationHours: data.durationHours ?? duration,
          originalHourlyRate: data.originalHourlyRate,
          finalHourlyRate: data.finalHourlyRate,
          appliedDiscount: data.appliedDiscount ?? null,
          totalSavings: data.totalSavings ?? 0,
        });
        if ((data.prepaymentAmount ?? 0) > 0) setIsPrepayment(true);
      } else {
        const base = (boat?.price_per_hour ?? 0) * duration;
        const dp = Math.round(base * 0.2);
        setPricing({ publicPrice: base, prepaymentAmount: dp, remainingAmount: base - dp, durationHours: duration });
        if (dp > 0) setIsPrepayment(true);
      }
    } catch {
      const base = (boat?.price_per_hour ?? 0) * duration;
      const dp = Math.round(base * 0.2);
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

  const baseTotal = pricing?.publicPrice ?? (boat?.price_per_hour ?? 0) * duration;
  const promoDiscount = promo ? Math.round(baseTotal * promo.discount_percent / 100) : 0;
  const totalAfterPromo = baseTotal - promoDiscount;
  const prepaymentAmt = pricing
    ? Math.max(0, pricing.prepaymentAmount - promoDiscount)
    : Math.round(totalAfterPromo * 0.2);
  const remainingAmt = totalAfterPromo - prepaymentAmt;
  const payNow = isPrepayment ? prepaymentAmt : totalAfterPromo;
  const giftUsed = gift ? Math.min(gift.balance, payNow, totalAfterPromo) : 0;
  const payOnline = Math.max(0, payNow - giftUsed);

  const transitionStep = useCallback((nextStep: number, dir: 1 | -1) => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    setGhostStep(visibleStep);
    enterX.setValue(dir * SCREEN_W);
    exitX.setValue(0);
    setVisibleStep(nextStep);
    setStep(nextStep);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    Animated.parallel([
      Animated.spring(enterX, { ...SPRING, toValue: 0 }),
      Animated.spring(exitX,  { ...SPRING, toValue: -dir * SCREEN_W }),
    ]).start(() => {
      setGhostStep(null);
      isAnimatingRef.current = false;
    });
  }, [visibleStep, enterX, exitX]);

  const goNext = async () => {
    if (step === 1) {
      if (!timeConfirmed) { Alert.alert('', 'Выберите время начала'); return; }
      await fetchPricing();
      transitionStep(2, 1);
    } else if (step === 2) {
      transitionStep(3, 1);
    } else if (step === 3) {
      if (!clientName.trim()) { Alert.alert('', 'Введите имя'); return; }
      if (!isValidDigits(clientPhoneDigits)) { Alert.alert('', 'Введите корректный номер телефона'); return; }
      transitionStep(4, 1);
    }
  };

  const goBack = () => {
    if (step > 1) {
      transitionStep(step - 1, -1);
    } else {
      router.back();
    }
  };

  const swipePan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        stepRef.current > 1 && !isAnimatingRef.current &&
        g.dx > 10 && Math.abs(g.dy) < 20 && g.dx > Math.abs(g.dy),

      onPanResponderGrant: () => {
        if (stepRef.current <= 1 || isAnimatingRef.current) return;
        isSwipingRef.current = true;
        isAnimatingRef.current = true;
        setGhostStep(visibleStepRef.current - 1);
        exitX.setValue(-SCREEN_W);
      },

      onPanResponderMove: (_, g) => {
        if (!isSwipingRef.current) return;
        const dx = Math.max(0, g.dx);
        enterX.setValue(dx);
        exitX.setValue(-SCREEN_W + dx);
      },

      onPanResponderRelease: (_, g) => {
        if (!isSwipingRef.current) return;
        isSwipingRef.current = false;
        const complete = g.dx > SCREEN_W * 0.35 || g.vx > 0.5;
        if (complete) {
          Animated.parallel([
            Animated.spring(enterX, { ...SPRING, toValue: SCREEN_W }),
            Animated.spring(exitX,  { ...SPRING, toValue: 0 }),
          ]).start(() => {
            const prev = visibleStepRef.current - 1;
            // Hide enter slot while swapping: ghost (prev) stays visible at center
            // so user never sees blank. Reveal enter + drop ghost together next frame.
            enterOpacity.setValue(0);
            enterX.setValue(0);
            setVisibleStep(prev);
            setStep(prev);
            isAnimatingRef.current = false;
            requestAnimationFrame(() => {
              enterOpacity.setValue(1);
              setGhostStep(null);
            });
          });
        } else {
          Animated.parallel([
            Animated.spring(enterX, { ...SPRING, toValue: 0 }),
            Animated.spring(exitX,  { ...SPRING, toValue: -SCREEN_W }),
          ]).start(() => {
            setGhostStep(null);
            isAnimatingRef.current = false;
          });
        }
      },

      onPanResponderTerminate: () => {
        if (!isSwipingRef.current) return;
        isSwipingRef.current = false;
        isAnimatingRef.current = false;
        enterOpacity.setValue(0);
        enterX.setValue(0);
        exitX.setValue(-SCREEN_W);
        requestAnimationFrame(() => {
          enterOpacity.setValue(1);
          setGhostStep(null);
        });
      },
    })
  ).current;

  const handlePay = async () => {
    if (!boat || !selectedPier) return;
    const startDt = buildDatetime(date, startHour);
    const endDt = buildDatetime(date, startHour + duration);

    setPaying(true);
    try {
      const { data, error } = await publicSupabase.functions.invoke('create-yookassa-payment', {
        body: {
          amount: Math.round(payOnline * 100),
          description: `Аренда катера ${boat.name}`,
          payment_type: isPrepayment ? 'prepayment' : 'full_payment',
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
            payment_method: 'online',
            payment_notes: isPrepayment ? 'Предоплата' : 'Полная оплата',
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
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error ?? 'Ошибка создания платежа');

      bookingIdRef.current = data.public_booking_id as string;
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
  const stepTitle = STEP_LABELS[step - 1] ?? 'Бронирование';

  const onOpenSheet      = useCallback(() => setSheetOpen(true), []);
  const onOpenMap        = useCallback(() => setPierMapOpen(true), []);
  const onPromoChange    = useCallback((t: string) => { setPromoInput(t); setPromo(null); setPromoError(''); }, []);
  const onGiftChange     = useCallback((t: string) => { setGiftInput(t); setGift(null); setGiftError(''); }, []);
  const onEditDate       = useCallback(() => transitionStep(1, -1), [transitionStep]);

  const renderStep = (n: number) => {
    switch (n) {
      case 1: return (
        <BookingStep1
          date={date} onDateChange={setDate} timeConfirmed={timeConfirmed}
          startHour={startHour} duration={duration}
          onOpenSheet={onOpenSheet}
          totalAfterPromo={totalAfterPromo} boat={boat!}
        />
      );
      case 2: return (
        <BookingStep2
          date={date} startHour={startHour} duration={duration} dateLabel={dateLabel}
          piers={piers} selectedPier={selectedPier} onSelectPier={setSelectedPier}
          onOpenMap={onOpenMap}
          promoInput={promoInput} onPromoInputChange={onPromoChange}
          promoLoading={promoLoading} promo={promo} promoError={promoError} onApplyPromo={applyPromo}
          pricingLoading={pricingLoading} pricing={pricing}
          baseTotal={baseTotal} promoDiscount={promoDiscount} totalAfterPromo={totalAfterPromo}
          prepaymentAmt={prepaymentAmt} remainingAmt={remainingAmt}
          boat={boat!} onEditDate={onEditDate}
        />
      );
      case 3: return (
        <BookingStep3
          date={date} startHour={startHour} duration={duration}
          selectedPier={selectedPier} totalAfterPromo={totalAfterPromo}
          clientName={clientName} onNameChange={setClientName}
          clientPhoneDigits={clientPhoneDigits} onPhoneChange={setClientPhoneDigits}
          clientEmail={clientEmail} onEmailChange={setClientEmail}
        />
      );
      case 4: return (
        <BookingStep4
          boat={boat!} date={date} startHour={startHour} duration={duration}
          selectedPier={selectedPier} clientName={clientName}
          clientPhoneDigits={clientPhoneDigits} clientEmail={clientEmail}
          totalAfterPromo={totalAfterPromo} prepaymentAmt={prepaymentAmt} remainingAmt={remainingAmt}
          isPrepayment={isPrepayment} onSetPrepayment={setIsPrepayment}
          giftInput={giftInput}
          onGiftInputChange={onGiftChange}
          giftLoading={giftLoading} gift={gift} giftError={giftError}
          giftUsed={giftUsed} onApplyGift={applyGift}
          payNow={payNow} payOnline={payOnline}
        />
      );
      default: return null;
    }
  };

  if (loadingBoat) {
    return (
      <View style={s.root}>
        <View style={[s.navBar, { paddingTop: insets.top }]}>
          <View style={s.navContent}>
            <View style={{ width: 32 }} />
            <View style={{ flex: 1 }} />
            <Pressable style={s.closeBtn} onPress={goBack} hitSlop={12}>
              <X size={18} color={COLORS.text1} strokeWidth={2.5} />
            </Pressable>
          </View>
        </View>
        <View style={s.loader}>
          <Spinner />
        </View>
      </View>
    );
  }
  if (!boat) {
    return (
      <View style={s.root}>
        <View style={[s.navBar, { paddingTop: insets.top }]}>
          <View style={s.navContent}>
            <View style={{ width: 32 }} />
            <View style={{ flex: 1 }} />
            <Pressable style={s.closeBtn} onPress={goBack} hitSlop={12}>
              <X size={18} color={COLORS.text1} strokeWidth={2.5} />
            </Pressable>
          </View>
        </View>
        <View style={s.loader}><Text style={s.errTxt}>Судно не найдено</Text></View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      enabled={step === 3}
    >
      {/* ── Fixed header ── */}
      <View style={[s.navBar, { paddingTop: insets.top }]}>
        <View style={s.navContent}>
          <View style={{ width: 32 }} />
          <Animated.Text style={[s.navTitle, { opacity: headerTitleOpacity }]} numberOfLines={1}>
            {stepTitle}
          </Animated.Text>
          <Pressable style={s.closeBtn} onPress={() => router.back()} hitSlop={12}>
            <X size={18} color={COLORS.text1} strokeWidth={2.5} />
          </Pressable>
        </View>
      </View>

      {/* ── Step progress bars ── */}
      <StepProgress step={step} />

      <View style={{ flex: 1 }} {...swipePan.panHandlers}>
      <Animated.ScrollView
        ref={scrollRef as any}
        style={s.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        directionalLockEnabled
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
      >
        {/* ── Large title (fades out on scroll) ── */}
        <Animated.Text style={[s.pageTitle, { opacity: contentTitleOpacity }]}>
          {stepTitle}
        </Animated.Text>

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
              {boat.capacity ? (
                <View style={s.metaItem}>
                  <Users size={12} color={COLORS.text3} strokeWidth={2} />
                  <Text style={s.metaTxt}>до {boat.capacity} чел.</Text>
                </View>
              ) : null}
              {boat.length_meters ? (
                <View style={s.metaItem}>
                  <Ruler size={12} color={COLORS.text3} strokeWidth={2} />
                  <Text style={s.metaTxt}>{boat.length_meters} м</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {/* ════ STEPS ════ */}
        <View style={{ overflow: 'hidden' }}>
          {ghostStep !== null && (
            <Animated.View
              pointerEvents="none"
              style={[StyleSheet.absoluteFill, { transform: [{ translateX: exitX }] }]}
            >
              {renderStep(ghostStep)}
            </Animated.View>
          )}
          <Animated.View style={{ transform: [{ translateX: enterX }], opacity: enterOpacity }}>
            {renderStep(visibleStep)}
          </Animated.View>
        </View>
      </Animated.ScrollView>

      {/* ── Bottom CTA ── */}
      <View style={[s.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        {step < 4 ? (
          <Pressable
            style={({ pressed }) => [s.ctaBtn, pricingLoading && { opacity: 0.6 }, pressed && { opacity: 0.85 }]}
            onPress={goNext}
            disabled={pricingLoading}
          >
            {pricingLoading
              ? <Spinner color="#fff" trackColor="rgba(255,255,255,0.25)" />
              : <Text style={s.ctaTxt}>Далее</Text>}
          </Pressable>
        ) : (
          <>
            <View style={s.payBar}>
              <View>
                <Text style={s.payLabel}>К оплате</Text>
                <Text style={s.payAmount}>{ruFmt(payOnline)} ₽</Text>
              </View>
              <Pressable
                style={({ pressed }) => [s.payBtn, paying && { opacity: 0.6 }, pressed && { opacity: 0.85 }]}
                onPress={handlePay}
                disabled={paying}
              >
                {paying
                  ? <Spinner color="#fff" trackColor="rgba(255,255,255,0.25)" />
                  : <Text style={s.ctaTxt}>Оплатить</Text>}
              </Pressable>
            </View>
            <Text style={s.consentTxt}>
              Совершая предоплату, вы выражаете полное и безоговорочное согласие (акцепт) с условиями{' '}
              <Text style={s.consentLink} onPress={() => router.push('/booking/oferta' as any)} suppressHighlighting>
                Договора-оферты
              </Text>{' '}
              ООО «ВИАМОБИ ВОСТОК» (ИНН 7717283732). Договор считается заключённым с момента поступления оплаты.
            </Text>
          </>
        )}
      </View>
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
          // scroll to confirmed time row after sheet dismiss animation (~300ms)
          setTimeout(() => scrollRef.current?.scrollTo({ y: 340, animated: true }), 350);
        }}
        onClose={() => setSheetOpen(false)}
      />
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.white },
  scroll: { flex: 1 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errTxt: { fontSize: 15, color: COLORS.text3 },

  /* nav bar */
  navBar: {
    backgroundColor: COLORS.white,
    // borderBottomWidth: StyleSheet.hairlineWidth,
    // borderBottomColor: COLORS.border,
  },
  navContent: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: 16,
  },
  navTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text1,
  },
  closeBtn: {
    // width: 32, height: 32,
    borderRadius: 16,
    // backgroundColor: COLORS.muted,
    alignItems: 'center', justifyContent: 'center',
  },

  /* large page title in scroll */
  pageTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.text1,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
  },

  /* boat card */
  boatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginHorizontal: 20,
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  boatThumb: {
    width: 72,
    height: 72,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.muted,
  },
  boatInfo: { flex: 1, gap: 5 },
  boatName: { fontSize: 15, fontWeight: '600', color: COLORS.text1, lineHeight: 21 },
  boatMeta: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', alignItems: 'center' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaTxt: { fontSize: 12, color: COLORS.text3 },

  /* bottom bar */
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 14,
    backgroundColor: COLORS.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  ctaBtn: {
    height: 54,
    backgroundColor: '#222',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaTxt: { fontSize: 16, fontWeight: '700', color: COLORS.white },
  payBar: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  payLabel: { fontSize: 12, color: COLORS.text3, marginBottom: 2 },
  payAmount: { fontSize: 20, fontWeight: '800', color: COLORS.text1 },
  payBtn: {
    flex: 1,
    height: 54,
    backgroundColor: '#222',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  consentTxt: {
    marginTop: 10,
    fontSize: 11,
    color: COLORS.text3,
    lineHeight: 16,
    textAlign: 'center',
  },
  consentLink: {
    color: COLORS.brandNavy,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
