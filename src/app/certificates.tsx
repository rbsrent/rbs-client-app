import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { openAuthSessionAsync, WebBrowserResultType } from 'expo-web-browser';
import {
  CheckCircle,
  Copy,
  Gift,
  Mail,
  MessageSquare,
  Phone,
  RotateCcw,
  User,
} from 'lucide-react-native';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { COLORS } from '@/shared/colors';
import { PhoneInput } from '@/shared/components/PhoneInput';
import { ScreenHeader } from '@/shared/components/ScreenHeader';
import { publicSupabase } from '@/shared/supabase/publicClient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { digitsToE164, isValidDigits } from '@/shared/utils/phone';

// ─── Constants ────────────────────────────────────────────────────────────────

const NOMINALS = [5000, 10000, 15000, 20000, 30000, 50000];
const ruFmt = (n: number) => new Intl.NumberFormat('ru-RU').format(n) + ' ₽';
const uuid  = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });

type ScreenState = 'form' | 'paying' | 'success' | 'error';

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CertificatesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [nominal, setNominal]         = useState(10000);
  const [email, setEmail]             = useState('');
  const [name, setName]               = useState('');
  const [phoneDigits, setPhoneDigits] = useState('');
  const [recipient, setRecipient]     = useState('');
  const [greeting, setGreeting]       = useState('');

  const [screen, setScreen]     = useState<ScreenState>('form');
  const [certCode, setCertCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const pollRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const certIdRef = useRef<string | null>(null);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  const startPolling = (id: string, code: string) => {
    stopPolling();
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts++;
      const { data } = await publicSupabase
        .from('gift_certificates')
        .select('status')
        .eq('id', id)
        .single();
      const status = (data as any)?.status;
      if (status === 'active') {
        stopPolling(); setCertCode(code); setScreen('success');
      } else if (status === 'cancelled') {
        stopPolling(); setErrorMsg('Платёж отменён'); setScreen('error');
      } else if (attempts >= 30) {
        stopPolling(); setErrorMsg('Не удалось подтвердить оплату. Проверьте e-mail.'); setScreen('error');
      }
    }, 2000);
  };

  const handlePay = async () => {
    if (!isEmailValid) {
      Alert.alert('', 'Введите корректный e-mail — на него придёт сертификат');
      return;
    }
    setScreen('paying');
    try {
      const idempotencyKey = uuid();
      const { data, error } = await publicSupabase.functions.invoke(
        'create-gift-certificate-payment',
        {
          body: {
            nominal,
            purchaser_email:  email.trim().toLowerCase(),
            purchaser_name:   name.trim()      || null,
            purchaser_phone:  isValidDigits(phoneDigits) ? digitsToE164(phoneDigits) : null,
            recipient_name:   recipient.trim() || null,
            greeting_message: greeting.trim()  || null,
            idempotency_key:  idempotencyKey,
          },
        },
      );
      if (error) throw error;
      if (!data?.success || !data?.confirmation_url) {
        throw new Error(data?.error || 'Не удалось создать платёж');
      }

      certIdRef.current = data.gift_certificate_id as string;
      const code = data.code as string;

      const returnUrl = Linking.createURL('certificate/return');
      const result = await openAuthSessionAsync(
        data.confirmation_url as string,
        returnUrl,
        { showInRecents: true },
      );

      if (
        result.type === WebBrowserResultType.CANCEL ||
        result.type === WebBrowserResultType.DISMISS
      ) {
        setScreen('form');
        return;
      }
      startPolling(certIdRef.current!, code);
    } catch (e: any) {
      setErrorMsg(e?.message || 'Ошибка создания платежа');
      setScreen('error');
    }
  };

  const copyCode = () => {
    Alert.alert('Код сертификата', certCode);
  };

  // ── Paying ──────────────────────────────────────────────────────────────────
  if (screen === 'paying') {
    return (
      <View style={s.root}>
        <ScreenHeader title="Оплата" />
        <View style={s.centered}>
          <ActivityIndicator color={COLORS.brandNavy} size="large" />
          <Text style={s.centeredTitle}>Ожидаем подтверждение оплаты…</Text>
          <Text style={s.centeredHint}>Не закрывайте приложение</Text>
        </View>
      </View>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────────────
  if (screen === 'error') {
    return (
      <View style={s.root}>
        <ScreenHeader title="Ошибка" />
        <View style={s.centered}>
          <View style={s.errorIcon}>
            <RotateCcw size={28} color={COLORS.error} strokeWidth={1.8} />
          </View>
          <Text style={s.centeredTitle}>Что-то пошло не так</Text>
          <Text style={[s.centeredHint, { textAlign: 'center' }]}>{errorMsg}</Text>
          <Pressable
            style={({ pressed }) => [s.cta, { marginTop: 8 }, pressed && { opacity: 0.88 }]}
            onPress={() => setScreen('form')}
          >
            <Text style={s.ctaTxt}>Попробовать снова</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── Success ─────────────────────────────────────────────────────────────────
  if (screen === 'success') {
    return (
      <View style={s.root}>
        <ScreenHeader title="Сертификат куплен" />
        <ScrollView
          contentContainerStyle={s.successContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Check + title */}
          <Animated.View entering={FadeIn.duration(400)} style={s.successTop}>
            <View style={s.successCheck}>
              <CheckCircle size={36} color={COLORS.success} strokeWidth={1.8} />
            </View>
            <Text style={s.successTitle}>Оплата прошла!</Text>
            <Text style={s.successSub}>
              Сертификат отправлен на{' '}
              <Text style={{ fontWeight: '700', color: COLORS.brandNavy }}>{email}</Text>
            </Text>
          </Animated.View>

          {/* Code card */}
          <Animated.View entering={FadeInDown.delay(150).duration(350)} style={s.codeCard}>
            <Text style={s.secLabel}>Код сертификата</Text>
            <Pressable style={s.codeRow} onPress={copyCode} hitSlop={8}>
              <Text style={s.codeText}>{certCode}</Text>
              <Copy size={16} color={COLORS.text3} strokeWidth={2} />
            </Pressable>
            <View style={s.codeMeta}>
              <View style={s.metaPill}>
                <Text style={s.metaPillTxt}>{ruFmt(nominal)}</Text>
              </View>
              <View style={s.metaPill}>
                <Text style={s.metaPillTxt}>Действует 1 год</Text>
              </View>
            </View>
          </Animated.View>

          {/* Info */}
          <Animated.View entering={FadeInDown.delay(280).duration(350)} style={s.infoRow}>
            <Text style={s.infoTxt}>
              Используйте код при оформлении бронирования — в поле «Подарочный сертификат».
              Остаток сохраняется.
            </Text>
          </Animated.View>

          {/* Buttons */}
          <Animated.View entering={FadeInDown.delay(400).duration(350)} style={s.successBtns}>
            <Pressable
              style={({ pressed }) => [s.cta, pressed && { opacity: 0.88 }]}
              onPress={() => router.replace('/(tabs)' as any)}
            >
              <Text style={s.ctaTxt}>На главную</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [s.ctaOutline, pressed && { opacity: 0.88 }]}
              onPress={() => { setScreen('form'); setCertCode(''); }}
            >
              <Text style={s.ctaOutlineTxt}>Купить ещё один</Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  // ── Form ────────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScreenHeader title="Подарок впечатлений" />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Intro */}
        <View style={s.intro}>
          <Text style={s.introTitle}>Подарочный сертификат на прогулку</Text>
          <Text style={s.introDesc}>
            Подарите близким незабываемую прогулку по воде. После оплаты сертификат придёт на e-mail в красивом PDF — можно распечатать и вручить.
          </Text>
          <View style={s.introBullets}>
            <Text style={s.introBullet}>· Действует 1 год с даты покупки</Text>
            <Text style={s.introBullet}>· Можно оплатить любое бронирование частично или полностью</Text>
            <Text style={s.introBullet}>· Остаток сохраняется на коде до следующей оплаты</Text>
          </View>
        </View>

        {/* Nominal */}
        <View style={s.section}>
          <Text style={s.secLabel}>Номинал</Text>
          <View style={s.nominalGrid}>
            {NOMINALS.map((n) => {
              const on = n === nominal;
              return (
                <Pressable
                  key={n}
                  style={[s.nominalBtn, on && s.nominalBtnOn]}
                  onPress={() => setNominal(n)}
                >
                  <Text style={[s.nominalTxt, on && s.nominalTxtOn]}>{ruFmt(n)}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Purchaser */}
        <View style={s.section}>
          <Text style={s.secLabel}>Данные покупателя</Text>
          <View style={s.card}>
            <View style={s.field}>
              <Mail size={16} color={COLORS.text3} strokeWidth={1.8} />
              <TextInput
                style={s.input}
                placeholder="E-mail *"
                placeholderTextColor={COLORS.text3}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
              />
            </View>
            <View style={s.divider} />
            <View style={s.field}>
              <User size={16} color={COLORS.text3} strokeWidth={1.8} />
              <TextInput
                style={s.input}
                placeholder="Ваше имя"
                placeholderTextColor={COLORS.text3}
                value={name}
                onChangeText={setName}
                returnKeyType="next"
              />
            </View>
            <View style={s.divider} />
            <View style={s.field}>
              <Phone size={16} color={COLORS.text3} strokeWidth={1.8} />
              <PhoneInput
                style={s.input}
                digits={phoneDigits}
                onChangeDigits={setPhoneDigits}
                returnKeyType="next"
              />
            </View>
          </View>
        </View>

        {/* Recipient */}
        <View style={s.section}>
          <View style={s.secRow}>
            <Text style={s.secLabel}>Кому подарок</Text>
            <Text style={s.secOptional}>необязательно</Text>
          </View>
          <View style={s.card}>
            <View style={s.field}>
              <Gift size={16} color={COLORS.text3} strokeWidth={1.8} />
              <TextInput
                style={s.input}
                placeholder="Имя получателя"
                placeholderTextColor={COLORS.text3}
                value={recipient}
                onChangeText={setRecipient}
                returnKeyType="next"
              />
            </View>
            <View style={s.divider} />
            <View style={[s.field, s.fieldTop]}>
              <MessageSquare size={16} color={COLORS.text3} strokeWidth={1.8} style={{ marginTop: 3 }} />
              <View style={{ flex: 1 }}>
                <TextInput
                  style={[s.input, s.textarea]}
                  placeholder="Поздравление"
                  placeholderTextColor={COLORS.text3}
                  value={greeting}
                  onChangeText={(t) => setGreeting(t.slice(0, 180))}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
                <Text style={s.charCount}>{greeting.length}/180</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Legal note */}
        <Text style={s.legalTxt}>
          Нажимая «Оплатить», вы соглашаетесь с условиями использования сертификата.
          После оплаты сертификат придёт на указанный e-mail.
        </Text>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[s.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          style={({ pressed }) => [s.cta, s.ctaFull, !isEmailValid && s.ctaDim, pressed && { opacity: 0.88 }]}
          onPress={handlePay}
          disabled={!isEmailValid}
        >
          <Gift size={17} color="#fff" strokeWidth={2} />
          <Text style={s.ctaTxt}>Оплатить {ruFmt(nominal)}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: COLORS.backgroundAlt },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 140 },

  intro:        { marginHorizontal: 16, marginTop: 20, gap: 10 },
  introTitle:   { fontSize: 18, fontWeight: '800', color: COLORS.text1, lineHeight: 24 },
  introDesc:    { fontSize: 14, color: COLORS.text2, lineHeight: 21 },
  introBullets: { gap: 4 },
  introBullet:  { fontSize: 13, color: COLORS.text2, lineHeight: 20 },

  section: { marginHorizontal: 16, marginTop: 20 },

  secRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 10 },
  secLabel: {
    fontSize: 11, fontWeight: '700', color: COLORS.text3,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10,
  },
  secOptional: { fontSize: 11, color: COLORS.text3 },

  /* nominal picker */
  nominalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  nominalBtn:  {
    width: '30.5%', paddingVertical: 15,
    borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    alignItems: 'center', justifyContent: 'center',
  },
  nominalBtnOn:  { borderColor: COLORS.brandNavy, backgroundColor: COLORS.brandNavy },
  nominalTxt:    { fontSize: 13, fontWeight: '700', color: COLORS.text2 },
  nominalTxtOn:  { color: COLORS.white },

  /* form card */
  card:     { backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  field:    { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, minHeight: 50 },
  fieldTop: { alignItems: 'flex-start', paddingTop: 12 },
  input:    { flex: 1, fontSize: 14, color: COLORS.text1, paddingVertical: 14 },
  textarea: { paddingTop: 0, minHeight: 72, lineHeight: 20 },
  divider:  { height: StyleSheet.hairlineWidth, backgroundColor: COLORS.border, marginLeft: 40 },
  charCount:{ fontSize: 10, color: COLORS.text3, textAlign: 'right', marginTop: 4, marginBottom: 10 },

  /* detail lines */
  legalTxt:  { marginHorizontal: 16, marginTop: 16, fontSize: 11, color: COLORS.text3, lineHeight: 16, textAlign: 'center' },

  /* bottom bar */
  bottomBar: {
    paddingHorizontal: 16, paddingTop: 12,
    backgroundColor: COLORS.white,
    borderTopWidth: 1, borderTopColor: COLORS.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 8,
  },

  /* buttons */
  cta: {
    height: 54, backgroundColor: COLORS.brandNavy,
    borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 7,
  },
  ctaFull: { width: '100%' },
  ctaDim:  { opacity: 0.4 },
  ctaTxt:  { fontSize: 15, fontWeight: '700', color: '#fff' },
  ctaOutline: {
    height: 54, backgroundColor: COLORS.white,
    borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
  ctaOutlineTxt: { fontSize: 15, fontWeight: '600', color: COLORS.text1 },

  /* centered states */
  centered:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 32 },
  centeredTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text1, textAlign: 'center', marginTop: 4 },
  centeredHint:  { fontSize: 14, color: COLORS.text3, lineHeight: 20 },

  errorIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: COLORS.errorLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },

  /* success */
  successContent: { paddingHorizontal: 16, paddingTop: 28, paddingBottom: 48, gap: 14 },
  successTop:     { alignItems: 'center', gap: 10, marginBottom: 4 },
  successCheck:   {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: COLORS.successLight,
    alignItems: 'center', justifyContent: 'center',
  },
  successTitle:   { fontSize: 22, fontWeight: '800', color: COLORS.text1 },
  successSub:     { fontSize: 14, color: COLORS.text2, textAlign: 'center', lineHeight: 20 },

  codeCard:  {
    backgroundColor: COLORS.white, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.border,
    padding: 20, alignItems: 'center', gap: 12,
  },
  codeRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  codeText:  { fontSize: 28, fontWeight: '800', color: COLORS.brandNavy, letterSpacing: 4 },
  codeMeta:  { flexDirection: 'row', gap: 8 },
  metaPill:  {
    backgroundColor: COLORS.muted, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  metaPillTxt: { fontSize: 12, fontWeight: '600', color: COLORS.text2 },

  infoRow:  {
    backgroundColor: COLORS.white, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.border,
    padding: 14,
  },
  infoTxt:  { fontSize: 13, color: COLORS.text2, lineHeight: 19 },

  successBtns: { gap: 10 },
});
