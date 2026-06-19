import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { openAuthSessionAsync, WebBrowserResultType } from 'expo-web-browser';
import {
  ArrowLeft, BookOpen, Calendar, ChevronRight,
  Clock, Gift, Mail, MapPin, MessageCircle,
  Phone, Ruler, Tag, User, Users, X,
} from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '@/shared/colors';
import { CalendarPicker, fmtDateFull } from '@/shared/components/CalendarPicker';
import { PhoneInput } from '@/shared/components/PhoneInput';
import { Spinner } from '@/shared/components/Spinner';
import { publicSupabase, SUPABASE_URL } from '@/shared/supabase/publicClient';
import { digitsToE164, isValidDigits } from '@/shared/utils/phone';

import { FormField, shared } from '../components/BookingRows';
import { PierMapSheet } from '../components/PierMapSheet';
import { TimeSlotSheet } from '../components/TimeSlotSheet';
import { Boat, Pier, PricingResult } from '../types';
import { buildDatetime, durLabel, fmtHour, ruFmt, uuid } from '../utils';

interface PromoResult    { id: string; code: string; discount_percent: number }
interface GiftCertResult { id: string; code: string; balance: number }

type PaymentMode = 'prepayment' | 'contact' | 'full';

const CONTACT_WA = 'whatsapp://send?phone=79810076500';
const CONTACT_TEL = 'tel:+79810076500';

function fmtDotDate(d: Date) {
  return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`;
}

// ─────────────────────────────────────────────────────────────────────────────

export function BookingScreen() {
  const insets = useSafeAreaInsets();
  const router  = useRouter();
  const {
    boatId,
    date:      dateParam,
    startHour: hourParam,
    duration:  durParam,
  } = useLocalSearchParams<{ boatId: string; date?: string; startHour?: string; duration?: string }>();

  const fromCatalog     = !!(dateParam && durParam && !hourParam);
  const autoOpenedSheet = useRef(false);

  // ── Core booking state ───────────────────────────────────────────────────
  const [boat,        setBoat]        = useState<Boat | null>(null);
  const [loadingBoat, setLoadingBoat] = useState(true);

  const [date,          setDate]          = useState<Date>(() => {
    if (dateParam) { const d = new Date(dateParam); if (!isNaN(d.getTime())) return d; }
    return new Date();
  });
  const [startHour,     setStartHour]     = useState<number>(hourParam ? Number(hourParam) : -1);
  const [duration,      setDuration]      = useState<number>(durParam  ? Number(durParam)  : 0);
  const [timeConfirmed, setTimeConfirmed] = useState(() => !!(hourParam && durParam));
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [sheetOpen,     setSheetOpen]     = useState(false);
  const [pierMapOpen,   setPierMapOpen]   = useState(false);

  const [piers,        setPiers]        = useState<Pier[]>([]);
  const [selectedPier, setSelectedPier] = useState<Pier | null>(null);

  const [promoInput,     setPromoInput]     = useState('');
  const [promo,          setPromo]          = useState<PromoResult | null>(null);
  const [promoLoading,   setPromoLoading]   = useState(false);
  const [promoError,     setPromoError]     = useState('');
  const [giftInput,      setGiftInput]      = useState('');
  const [gift,           setGift]           = useState<GiftCertResult | null>(null);
  const [giftLoading,    setGiftLoading]    = useState(false);
  const [giftError,      setGiftError]      = useState('');

  const [pricing,        setPricing]        = useState<PricingResult | null>(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [paymentMode,    setPaymentMode]    = useState<PaymentMode>('prepayment');

  const [clientName,        setClientName]        = useState('');
  const [clientPhoneDigits, setClientPhoneDigits] = useState('');
  const [clientEmail,       setClientEmail]       = useState('');
  const [paying,            setPaying]            = useState(false);

  const bookingIdRef   = useRef<string | null>(null);
  const pollRef        = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef    = useRef(AppState.currentState);
  const awaitingReturn = useRef(false);

  // ── AppState for payment return ──────────────────────────────────────────
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
      const { data } = await publicSupabase.from('public_bookings').select('booking_status').eq('id', bId).single();
      const status = (data as any)?.booking_status;
      if (status === 'confirmed' || status === 'paid') {
        clearInterval(pollRef.current!); setPaying(false);
        router.replace(`/bookings/${bId}` as any);
      } else if (status === 'cancelled') {
        clearInterval(pollRef.current!); setPaying(false);
        Alert.alert('Оплата не прошла', 'Попробуйте ещё раз.');
      } else if (attempts >= 30) {
        clearInterval(pollRef.current!); setPaying(false);
      }
    }, 2000);
  }, [router]);

  // ── Reset time on date change ────────────────────────────────────────────
  const isFirstDate = useRef(true);
  useEffect(() => {
    if (isFirstDate.current) { isFirstDate.current = false; return; }
    setStartHour(-1); setDuration(0); setTimeConfirmed(false); setPricing(null);
  }, [date]);

  // ── Load boat + piers ────────────────────────────────────────────────────
  useEffect(() => {
    if (!boatId) return;
    (async () => {
      const { data } = await publicSupabase
        .from('boats')
        .select('id, name, type, capacity, length_meters, price_per_hour, pier_id, boat_images(image_path, position), piers(id, name, address, latitude, longitude)')
        .eq('id', boatId).single();
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
        const { data: asgn } = await publicSupabase
          .from('boat_pier_assignments').select('pier_id, piers(id, name, address, latitude, longitude)').eq('boat_id', boatId);
        let pierList: Pier[] = asgn?.length ? (asgn as any[]).map((a: any) => a.piers).filter(Boolean) : [];
        if (!pierList.length && d.piers) pierList = [d.piers];
        setPiers(pierList);
        if (pierList.length) setSelectedPier(pierList[0]);
      }
      setLoadingBoat(false);
    })();
  }, [boatId]);

  // ── Auto-open time sheet (from catalog) ──────────────────────────────────
  useEffect(() => {
    if (fromCatalog && !loadingBoat && !autoOpenedSheet.current) {
      autoOpenedSheet.current = true;
      setSheetOpen(true);
    }
  }, [loadingBoat, fromCatalog]);

  // ── Pricing fetch ────────────────────────────────────────────────────────
  const fetchPricing = useCallback(async (h: number, dur: number) => {
    if (!boatId) return;
    setPricingLoading(true);
    try {
      const startDt = buildDatetime(date, h);
      const endDt   = buildDatetime(date, h + dur);
      const { data, error } = await publicSupabase.functions.invoke('calculate-public-booking-pricing', {
        body: { boatId, startTime: startDt.toISOString(), endTime: endDt.toISOString() },
      });
      if (!error && data?.publicPrice) {
        setPricing({
          publicPrice:        data.publicPrice,
          prepaymentAmount:   data.prepaymentAmount   ?? Math.round(data.publicPrice * 0.2),
          remainingAmount:    data.remainingAmount     ?? data.publicPrice - Math.round(data.publicPrice * 0.2),
          durationHours:      data.durationHours       ?? dur,
          originalHourlyRate: data.originalHourlyRate,
          finalHourlyRate:    data.finalHourlyRate,
          appliedDiscount:    data.appliedDiscount     ?? null,
          totalSavings:       data.totalSavings        ?? 0,
        });
        if ((data.prepaymentAmount ?? 0) > 0) setPaymentMode('prepayment');
        else setPaymentMode('full');
      } else {
        const base = (boat?.price_per_hour ?? 0) * dur;
        const dp   = Math.round(base * 0.2);
        setPricing({ publicPrice: base, prepaymentAmount: dp, remainingAmount: base - dp, durationHours: dur });
        setPaymentMode(dp > 0 ? 'prepayment' : 'full');
      }
    } catch {
      const base = (boat?.price_per_hour ?? 0) * dur;
      const dp   = Math.round(base * 0.2);
      setPricing({ publicPrice: base, prepaymentAmount: dp, remainingAmount: base - dp, durationHours: dur });
    }
    setPricingLoading(false);
  }, [boatId, date, boat]);

  const applyPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoLoading(true); setPromoError('');
    const { data } = await publicSupabase.from('promo_codes').select('id, code, discount_percent').ilike('code', promoInput.trim()).eq('is_active', true).maybeSingle();
    if (!data) { setPromoError('Промокод не найден или недействителен'); setPromo(null); }
    else         { setPromo(data as any); }
    setPromoLoading(false);
  };

  const applyGift = async () => {
    if (!giftInput.trim()) return;
    setGiftLoading(true); setGiftError('');
    const { data } = await publicSupabase.from('gift_certificates').select('id, code, balance').ilike('code', giftInput.trim()).eq('is_active', true).gt('balance', 0).maybeSingle();
    if (!data) { setGiftError('Сертификат не найден или исчерпан'); setGift(null); }
    else         { setGift(data as any); }
    setGiftLoading(false);
  };

  // ── Price math ───────────────────────────────────────────────────────────
  const baseTotal      = pricing?.publicPrice ?? (boat?.price_per_hour ?? 0) * duration;
  const promoDiscount  = promo ? Math.round(baseTotal * promo.discount_percent / 100) : 0;
  const totalAfterPromo = baseTotal - promoDiscount;
  const prepaymentAmt  = pricing ? Math.max(0, pricing.prepaymentAmount - promoDiscount) : Math.round(totalAfterPromo * 0.2);
  const remainingAmt   = totalAfterPromo - prepaymentAmt;
  const isPrepayment   = paymentMode === 'prepayment';
  const payNow         = isPrepayment ? prepaymentAmt : totalAfterPromo;
  const giftUsed       = gift ? Math.min(gift.balance, payNow, totalAfterPromo) : 0;
  const payOnline      = Math.max(0, payNow - giftUsed);

  // ── Pay / Contact ────────────────────────────────────────────────────────
  const handleAction = async () => {
    if (!boat) return;
    if (!timeConfirmed)              { Alert.alert('', 'Выберите время');                      return; }
    if (!clientName.trim())          { Alert.alert('', 'Введите имя');                         return; }
    if (!isValidDigits(clientPhoneDigits)) { Alert.alert('', 'Введите корректный номер'); return; }

    if (paymentMode === 'contact') {
      const msg = encodeURIComponent(`Здравствуйте! Хочу забронировать ${boat.name} на ${fmtDotDate(date)} в ${fmtHour(startHour)}`);
      Linking.openURL(`${CONTACT_WA}&text=${msg}`).catch(() => Linking.openURL(CONTACT_TEL));
      return;
    }

    if (!selectedPier) { Alert.alert('', 'Выберите место посадки'); return; }
    if (!pricing)      { Alert.alert('', 'Рассчитываем стоимость, подождите'); return; }

    const startDt = buildDatetime(date, startHour);
    const endDt   = buildDatetime(date, startHour + duration);
    setPaying(true);
    try {
      const { data, error } = await publicSupabase.functions.invoke('create-yookassa-payment', {
        body: {
          amount: Math.round(payOnline * 100),
          description: `Аренда катера ${boat.name}`,
          payment_type: isPrepayment ? 'prepayment' : 'full_payment',
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
            gift_certificate_id:   gift?.id    ?? null,
            gift_certificate_amount: giftUsed,
          },
        },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error ?? 'Ошибка создания платежа');
      bookingIdRef.current   = data.public_booking_id as string;
      awaitingReturn.current = true;
      const returnUrl = Linking.createURL('booking/return');
      const result = await openAuthSessionAsync(data.confirmation_url as string, returnUrl, { showInRecents: true });
      if (result.type === WebBrowserResultType.CANCEL || result.type === WebBrowserResultType.DISMISS) setPaying(false);
    } catch (e: any) {
      setPaying(false);
      Alert.alert('Ошибка', e?.message ?? 'Не удалось создать платёж. Попробуйте позже.');
    }
  };

  // ── Loading/error guards ─────────────────────────────────────────────────
  const navBar = (
    <View style={[s.navBar, { paddingTop: insets.top }]}>
      <Pressable style={s.navBtn} onPress={() => router.back()} hitSlop={8}>
        <ArrowLeft size={20} color={COLORS.text1} strokeWidth={2} />
      </Pressable>
      <Text style={s.navTitle}>Оформление брони</Text>
      <Pressable style={s.navBtn} onPress={() => router.back()} hitSlop={8}>
        <X size={18} color={COLORS.text1} strokeWidth={2.5} />
      </Pressable>
    </View>
  );

  if (loadingBoat) return <View style={s.root}>{navBar}<View style={s.loader}><Spinner /></View></View>;
  if (!boat)       return <View style={s.root}>{navBar}<View style={s.loader}><Text style={s.errTxt}>Судно не найдено</Text></View></View>;

  // ─────────────────────────────────────────────────────────────────────────
  // Bottom bar action label/button
  // ─────────────────────────────────────────────────────────────────────────
  const actionLabel  = paymentMode === 'contact' ? 'Связаться с нами' : `Оплатить ${ruFmt(payOnline)} ₽`;
  const actionActive = !paying;

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {navBar}

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 128 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ══ 1. Boat profile card ══════════════════════════════════════════ */}
        <View style={s.profileCard}>
          {/* Boat header */}
          <View style={s.profileHeader}>
            <View style={s.profileThumb}>
              {boat.cover_image_url ? (
                <Image source={{ uri: boat.cover_image_url }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" />
              ) : (
                <LinearGradient colors={[COLORS.brandNavy, COLORS.brandCyan]} style={StyleSheet.absoluteFill} />
              )}
            </View>
            <View style={s.profileInfo}>
              <Text style={s.profileName} numberOfLines={2}>{boat.name}</Text>
              <View style={s.profileMeta}>
                {boat.type     ? <Text style={s.profileMetaTxt}>{boat.type}</Text>    : null}
                {boat.capacity ? <Text style={s.profileMetaTxt}>· до {boat.capacity} чел.</Text> : null}
                {boat.length_meters ? <Text style={s.profileMetaTxt}>· {boat.length_meters} м</Text> : null}
              </View>
            </View>
          </View>

          <View style={s.profileDivider} />

          {/* Date row */}
          <Pressable style={s.profileRow} onPress={() => { setDatePickerOpen((o) => !o); }}>
            <View style={s.profileRowIcon}><Calendar size={15} color={COLORS.brandNavy} strokeWidth={2} /></View>
            <View style={s.profileRowBody}>
              <Text style={s.profileRowLabel}>Дата</Text>
              <Text style={s.profileRowValue}>{fmtDateFull(date)}</Text>
            </View>
            <Text style={s.profileEditTxt}>{datePickerOpen ? 'Закрыть' : 'Изменить'}</Text>
          </Pressable>

          {/* Time row */}
          <Pressable style={s.profileRow} onPress={() => setSheetOpen(true)}>
            <View style={s.profileRowIcon}><Clock size={15} color={COLORS.brandNavy} strokeWidth={2} /></View>
            <View style={s.profileRowBody}>
              <Text style={s.profileRowLabel}>Время и продолжительность</Text>
              {timeConfirmed
                ? <Text style={s.profileRowValue}>{fmtHour(startHour)} – {fmtHour(startHour + duration)} · {durLabel(duration)}</Text>
                : <Text style={s.profileRowPlaceholder}>Не выбрано</Text>}
            </View>
            <Text style={s.profileEditTxt}>Изменить</Text>
          </Pressable>

          {/* Pier row */}
          <Pressable style={[s.profileRow, s.profileRowLast]} onPress={() => setPierMapOpen(true)}>
            <View style={s.profileRowIcon}><MapPin size={15} color={COLORS.brandNavy} strokeWidth={2} /></View>
            <View style={s.profileRowBody}>
              <Text style={s.profileRowLabel}>Место посадки</Text>
              {selectedPier
                ? <Text style={s.profileRowValue} numberOfLines={2}>{selectedPier.name}</Text>
                : <Text style={s.profileRowPlaceholder}>Не выбрано</Text>}
            </View>
            <Text style={s.profileEditTxt}>Изменить</Text>
          </Pressable>
        </View>

        {/* Inline calendar (below profile card) */}
        {datePickerOpen && (
          <View style={s.calendarWrap}>
            <CalendarPicker
              selected={date}
              onSelect={(d) => { setDate(d); setDatePickerOpen(false); }}
              collapsible={false}
            />
          </View>
        )}

        <View style={s.divider} />

        {/* ══ 2. Contact form ══════════════════════════════════════════════ */}
        <Text style={s.secLabel}>Ваши данные</Text>
        <View style={shared.formCard}>
          <FormField icon={<User size={16} color={COLORS.text3} strokeWidth={1.8} />} label="Имя *" last={false}>
            <TextInput style={shared.input} placeholder="Ваше имя" placeholderTextColor={COLORS.text3}
              value={clientName} onChangeText={setClientName} autoCapitalize="words" returnKeyType="next" />
          </FormField>
          <FormField icon={<Phone size={16} color={COLORS.text3} strokeWidth={1.8} />} label="Телефон *" last={false}>
            <PhoneInput digits={clientPhoneDigits} onChangeDigits={setClientPhoneDigits} style={shared.input} returnKeyType="next" />
          </FormField>
          <FormField icon={<Mail size={16} color={COLORS.text3} strokeWidth={1.8} />} label="Email (необязательно)" last>
            <TextInput style={shared.input} placeholder="email@example.com" placeholderTextColor={COLORS.text3}
              value={clientEmail} onChangeText={setClientEmail} keyboardType="email-address" autoCapitalize="none" returnKeyType="done" />
          </FormField>
        </View>

        <View style={s.divider} />

        {/* ══ 3. Booking summary ═══════════════════════════════════════════ */}
        <Text style={s.secLabel}>Детали бронирования</Text>
        <View style={s.summaryCard}>
          <SummaryRow label="Катер"             value={boat.name} />
          <SummaryRow label="Дата"              value={fmtDotDate(date)} />
          <SummaryRow label="Время"             value={timeConfirmed ? `${fmtHour(startHour)} – ${fmtHour(startHour + duration)}` : '—'} />
          <SummaryRow label="Продолжительность" value={timeConfirmed ? durLabel(duration) : '—'} />
          {selectedPier && <SummaryRow label="Причал"  value={selectedPier.name} />}
          {selectedPier?.address && <SummaryRow label="Адрес"  value={selectedPier.address} />}
          <SummaryRow label="Имя"               value={clientName        || '—'} />
          <SummaryRow label="Телефон"           value={clientPhoneDigits ? digitsToE164(clientPhoneDigits) : '—'} />
          {clientEmail ? <SummaryRow label="Email" value={clientEmail} /> : null}
          {timeConfirmed && (
            <SummaryRow label="Общая стоимость" value={pricing ? `${ruFmt(totalAfterPromo)} ₽` : pricingLoading ? 'Рассчитываем…' : '—'} last />
          )}
        </View>

        <View style={s.divider} />

        {/* ══ 4. Promo + Gift ══════════════════════════════════════════════ */}
        <Text style={s.secLabel}>Промокод</Text>
        <View style={shared.codeRow}>
          <View style={shared.codeInput}>
            <Tag size={14} color={COLORS.text3} strokeWidth={1.8} />
            <TextInput style={shared.input} placeholder="Введите промокод" placeholderTextColor={COLORS.text3}
              value={promoInput} onChangeText={(t) => { setPromoInput(t.toUpperCase()); setPromo(null); setPromoError(''); }}
              autoCapitalize="characters" returnKeyType="done" onSubmitEditing={applyPromo} />
          </View>
          <Pressable style={[shared.applyBtn, promo && shared.applyBtnOk, (!promoInput.trim() || promoLoading) && shared.applyBtnDim]}
            onPress={applyPromo} disabled={!promoInput.trim() || promoLoading || !!promo}>
            {promoLoading ? <Spinner size={20} color="#fff" trackColor="rgba(255,255,255,0.25)" /> : <Text style={shared.applyTxt}>{promo ? '✓' : 'OK'}</Text>}
          </Pressable>
        </View>
        {promoError ? <Text style={shared.errNote}>{promoError}</Text> : null}
        {promo      ? <Text style={shared.okNote}>Скидка {promo.discount_percent}% применена</Text> : null}

        <Text style={[s.secLabel, { marginTop: 16 }]}>Подарочный сертификат</Text>
        <View style={shared.codeRow}>
          <View style={shared.codeInput}>
            <Gift size={14} color={COLORS.text3} strokeWidth={1.8} />
            <TextInput style={shared.input} placeholder="GIFT-XXXX-XXXX" placeholderTextColor={COLORS.text3}
              value={giftInput} onChangeText={(t) => { setGiftInput(t.toUpperCase()); setGift(null); setGiftError(''); }}
              autoCapitalize="characters" returnKeyType="done" onSubmitEditing={applyGift} />
          </View>
          <Pressable style={[shared.applyBtn, gift && shared.applyBtnOk, (!giftInput.trim() || giftLoading) && shared.applyBtnDim]}
            onPress={applyGift} disabled={!giftInput.trim() || giftLoading || !!gift}>
            {giftLoading ? <Spinner size={20} color="#fff" trackColor="rgba(255,255,255,0.25)" /> : <Text style={shared.applyTxt}>{gift ? '✓' : 'OK'}</Text>}
          </Pressable>
        </View>
        {giftError       ? <Text style={shared.errNote}>{giftError}</Text> : null}
        {gift && giftUsed > 0 && <Text style={shared.okNote}>Сертификат применён: −{ruFmt(giftUsed)} ₽</Text>}

        <View style={s.divider} />

        {/* ══ 5. Payment method ════════════════════════════════════════════ */}
        <Text style={s.secLabel}>Выберите способ оплаты</Text>

        {pricingLoading ? (
          <View style={s.pricingLoader}><Spinner size={20} /><Text style={s.hintTxt}>Рассчитываем стоимость…</Text></View>
        ) : pricing ? (
          <>
            <View style={s.payMethodCard}>
              {/* Prepayment */}
              {prepaymentAmt > 0 && (
                <>
                  <Pressable style={[s.payOption, paymentMode === 'prepayment' && s.payOptionOn]} onPress={() => setPaymentMode('prepayment')}>
                    <View style={[s.payRadio, paymentMode === 'prepayment' && s.payRadioOn]}>
                      {paymentMode === 'prepayment' && <View style={s.payRadioDot} />}
                    </View>
                    <View style={s.payOptionBody}>
                      <Text style={[s.payOptionTitle, paymentMode === 'prepayment' && s.payOptionTitleOn]}>
                        Внести оплату бронирования ({ruFmt(prepaymentAmt)} ₽)
                      </Text>
                      <Text style={s.payOptionSub}>Остаток {ruFmt(remainingAmt)} ₽ — исполнителю в день аренды</Text>
                    </View>
                  </Pressable>
                  <View style={s.payOptionDivider} />
                </>
              )}

              {/* Contact */}
              <Pressable style={[s.payOption, paymentMode === 'contact' && s.payOptionOn]} onPress={() => setPaymentMode('contact')}>
                <View style={[s.payRadio, paymentMode === 'contact' && s.payRadioOn]}>
                  {paymentMode === 'contact' && <View style={s.payRadioDot} />}
                </View>
                <View style={s.payOptionBody}>
                  <Text style={[s.payOptionTitle, paymentMode === 'contact' && s.payOptionTitleOn]}>Связаться с нами</Text>
                  <Text style={s.payOptionSub}>Менеджер свяжется для подтверждения и оплаты</Text>
                </View>
              </Pressable>
              <View style={s.payOptionDivider} />

              {/* Full */}
              <Pressable style={[s.payOption, paymentMode === 'full' && s.payOptionOn]} onPress={() => setPaymentMode('full')}>
                <View style={[s.payRadio, paymentMode === 'full' && s.payRadioOn]}>
                  {paymentMode === 'full' && <View style={s.payRadioDot} />}
                </View>
                <View style={s.payOptionBody}>
                  <Text style={[s.payOptionTitle, paymentMode === 'full' && s.payOptionTitleOn]}>Полная оплата</Text>
                  <Text style={s.payOptionSub}>Оплатить {ruFmt(totalAfterPromo)} ₽ сейчас онлайн</Text>
                </View>
              </Pressable>
            </View>

            {/* К оплате info */}
            <View style={s.payAmtRow}>
              {paymentMode === 'contact' ? (
                <Text style={s.payAmtHint}>Оплата по договорённости с менеджером</Text>
              ) : (
                <>
                  <Text style={s.payAmtLabel}>К оплате: <Text style={s.payAmtVal}>{ruFmt(payOnline)} ₽</Text></Text>
                  {!isPrepayment && <Text style={s.payAmtHint}>Никаких доплат не требуется</Text>}
                  {isPrepayment  && <Text style={s.payAmtHint}>Остаток {ruFmt(remainingAmt)} ₽ — оплачивается в день аренды</Text>}
                </>
              )}
            </View>
          </>
        ) : timeConfirmed ? null : (
          <View style={s.payPlaceholder}>
            <Text style={s.hintTxt}>Выберите дату и время, чтобы увидеть стоимость</Text>
          </View>
        )}

        <View style={s.divider} />

        {/* ══ 6. Payment security info ═════════════════════════════════════ */}
        <Text style={s.secLabel}>Способы оплаты</Text>
        <View style={s.securityCard}>
          <View style={s.securityRow}>
            <Text style={s.securityIcon}>🏦</Text>
            <Text style={s.securityTxt}>Банковская карта МИР</Text>
          </View>
          <View style={s.securityDivider} />
          <View style={s.securityRow}>
            <Text style={s.securityIcon}>🔒</Text>
            <Text style={s.securityTxt}>Безопасная обработка платежей через ЮKassa</Text>
          </View>
          <View style={s.securityDivider} />
          <View style={s.securityRow}>
            <Text style={s.securityIcon}>✅</Text>
            <Text style={s.securityTxt}>Мгновенное подтверждение бронирования</Text>
          </View>
        </View>

        <View style={s.divider} />

        {/* ══ 7. Conditions ════════════════════════════════════════════════ */}
        <Text style={s.secLabel}>Информация о бронировании</Text>
        <View style={s.rulesCard}>
          {[
            'Бронирование действительно только после успешной оплаты',
            'Возврат средств возможен не позднее чем за 24 часа до начала аренды',
            'При отмене менее чем за 24 часа возврат составляет 50%',
            'В случае форс-мажора полный возврат гарантирован',
          ].map((t, i) => (
            <View key={i} style={s.ruleRow}>
              <View style={s.ruleDot} />
              <Text style={s.ruleTxt}>{t}</Text>
            </View>
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [s.condLink, pressed && { opacity: 0.7 }]}
          onPress={() => router.push('/booking/conditions' as any)}
        >
          <BookOpen size={15} color={COLORS.brandNavy} strokeWidth={2} />
          <Text style={s.condLinkTxt}>Полные условия бронирования RBS</Text>
          <ChevronRight size={14} color={COLORS.brandNavy} strokeWidth={2} />
        </Pressable>

      </ScrollView>

      {/* ══ Bottom bar ═══════════════════════════════════════════════════════ */}
      <View style={[s.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        {!timeConfirmed ? (
          <Pressable style={s.ctaSecondary} onPress={() => setSheetOpen(true)}>
            <Clock size={16} color={COLORS.brandNavy} strokeWidth={2} />
            <Text style={s.ctaSecondaryTxt}>Выбрать дату и время</Text>
          </Pressable>
        ) : paymentMode === 'contact' ? (
          <Pressable
            style={({ pressed }) => [s.ctaContact, pressed && { opacity: 0.85 }]}
            onPress={handleAction}
          >
            <MessageCircle size={18} color={COLORS.white} strokeWidth={2} />
            <Text style={s.ctaBtnTxt}>Связаться с нами</Text>
          </Pressable>
        ) : (
          <Pressable
            style={({ pressed }) => [s.ctaBtn, (!pricing || paying) && { opacity: 0.6 }, pressed && { opacity: 0.85 }]}
            onPress={handleAction}
            disabled={!pricing || paying}
          >
            {paying
              ? <Spinner color="#fff" trackColor="rgba(255,255,255,0.25)" />
              : <Text style={s.ctaBtnTxt}>{pricing ? `Оплатить ${ruFmt(payOnline)} ₽` : 'Загрузка…'}</Text>}
          </Pressable>
        )}

        <Text style={s.consentTxt}>
          Нажимая кнопку, вы соглашаетесь с условиями{' '}
          <Text style={s.consentLink} onPress={() => router.push('/booking/oferta' as any)} suppressHighlighting>
            Договора-оферты
          </Text>{' '}
          ООО «ВИАМОБИ ВОСТОК» (ИНН 7717283732).
        </Text>
      </View>

      {/* ══ Sheets ═══════════════════════════════════════════════════════════ */}
      <PierMapSheet
        visible={pierMapOpen}
        piers={piers}
        selectedPier={selectedPier}
        onSelect={(p) => setSelectedPier(p)}
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
          fetchPricing(h, dur);
        }}
        onClose={() => setSheetOpen(false)}
      />
    </KeyboardAvoidingView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Inline summary row (local, no import needed)
// ─────────────────────────────────────────────────────────────────────────────

function SummaryRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[sr.row, last && { borderBottomWidth: 0 }]}>
      <Text style={sr.label}>{label}</Text>
      <Text style={sr.value} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const sr = StyleSheet.create({
  row:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border, gap: 12 },
  label: { fontSize: 13, color: COLORS.text3, flexShrink: 0 },
  value: { fontSize: 13, fontWeight: '600', color: COLORS.text1, flex: 1, textAlign: 'right' },
});

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#F5F5F7' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16, gap: 0 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errTxt: { fontSize: 15, color: COLORS.text3 },

  /* Nav */
  navBar:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, backgroundColor: COLORS.white, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border },
  navBtn:  { width: 44, height: 52, alignItems: 'center', justifyContent: 'center' },
  navTitle:{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '600', color: COLORS.text1 },

  /* Boat profile card */
  profileCard: { backgroundColor: COLORS.white, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  profileThumb: { width: 64, height: 64, borderRadius: 10, overflow: 'hidden', backgroundColor: COLORS.muted },
  profileInfo: { flex: 1, gap: 3 },
  profileName: { fontSize: 16, fontWeight: '700', color: COLORS.text1, lineHeight: 22 },
  profileMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  profileMetaTxt: { fontSize: 12, color: COLORS.text3 },

  profileDivider: { height: StyleSheet.hairlineWidth, backgroundColor: COLORS.border },
  profileRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.border,
  },
  profileRowLast: {},
  profileRowIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: COLORS.brandNavy + '12', alignItems: 'center', justifyContent: 'center' },
  profileRowBody: { flex: 1, gap: 1 },
  profileRowLabel:      { fontSize: 11, color: COLORS.text3, fontWeight: '500' },
  profileRowValue:      { fontSize: 14, fontWeight: '600', color: COLORS.text1 },
  profileRowPlaceholder:{ fontSize: 14, color: COLORS.text3 },
  profileEditTxt: { fontSize: 12, fontWeight: '600', color: COLORS.brandNavy },

  calendarWrap: { backgroundColor: COLORS.white, borderRadius: 12, marginTop: 8, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },

  divider: { height: StyleSheet.hairlineWidth, backgroundColor: COLORS.border, marginVertical: 20 },

  secLabel: { fontSize: 11, fontWeight: '700', color: COLORS.text3, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },

  /* Booking summary */
  summaryCard: { backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },

  /* Payment */
  pricingLoader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  hintTxt:       { fontSize: 13, color: COLORS.text3 },
  payPlaceholder:{ paddingVertical: 12 },

  payMethodCard: { backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  payOption:     { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14 },
  payOptionOn:   { backgroundColor: COLORS.brandNavy + '06' },
  payOptionDivider: { height: StyleSheet.hairlineWidth, backgroundColor: COLORS.border, marginHorizontal: 14 },
  payRadio:      { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  payRadioOn:    { borderColor: COLORS.brandNavy },
  payRadioDot:   { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.brandNavy },
  payOptionBody: { flex: 1, gap: 2 },
  payOptionTitle:    { fontSize: 14, fontWeight: '600', color: COLORS.text2, lineHeight: 20 },
  payOptionTitleOn:  { color: COLORS.text1 },
  payOptionSub:      { fontSize: 12, color: COLORS.text3, lineHeight: 17 },

  payAmtRow:  { marginTop: 10, paddingHorizontal: 2, gap: 2 },
  payAmtLabel:{ fontSize: 14, fontWeight: '500', color: COLORS.text2 },
  payAmtVal:  { fontSize: 14, fontWeight: '800', color: COLORS.text1 },
  payAmtHint: { fontSize: 12, color: COLORS.text3 },

  /* Security */
  securityCard:    { backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  securityRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  securityDivider: { height: StyleSheet.hairlineWidth, backgroundColor: COLORS.border, marginHorizontal: 14 },
  securityIcon:    { fontSize: 18, lineHeight: 22 },
  securityTxt:     { fontSize: 13, color: COLORS.text1, flex: 1 },

  /* Rules */
  rulesCard: { backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, padding: 14, gap: 10 },
  ruleRow:   { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  ruleDot:   { width: 5, height: 5, borderRadius: 2.5, backgroundColor: COLORS.brandNavy, marginTop: 7 },
  ruleTxt:   { fontSize: 13, color: COLORS.text2, lineHeight: 20, flex: 1 },

  condLink:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, paddingVertical: 4 },
  condLinkTxt: { flex: 1, fontSize: 13, fontWeight: '600', color: COLORS.brandNavy },

  /* Bottom */
  bottomBar:    { paddingHorizontal: 16, paddingTop: 12, backgroundColor: COLORS.white, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.border },
  ctaBtn:       { height: 54, backgroundColor: COLORS.brandNavy, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  ctaContact:   { height: 54, backgroundColor: '#2ECC71', borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  ctaSecondary: { height: 54, backgroundColor: COLORS.backgroundAlt, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, borderWidth: 1, borderColor: COLORS.border },
  ctaBtnTxt:       { fontSize: 16, fontWeight: '700', color: COLORS.white },
  ctaSecondaryTxt: { fontSize: 15, fontWeight: '600', color: COLORS.brandNavy },
  consentTxt:  { marginTop: 8, fontSize: 11, color: COLORS.text3, lineHeight: 16, textAlign: 'center' },
  consentLink: { color: COLORS.brandNavy, fontWeight: '600', textDecorationLine: 'underline' },
});
