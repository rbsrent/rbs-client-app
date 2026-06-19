import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '@/shared/colors';
import { authSupabase } from '@/shared/supabase/authClient';

import { MainView } from '../components/MainView';
import { TgWaitingView } from '../components/TgWaitingView';
import { useAuth } from '../hooks/useAuth';
import { OtpScreen } from './OtpScreen';
import { PhoneScreen } from './PhoneScreen';
import { Spinner } from '@/shared/components/Spinner';

type ScreenView = 'main' | 'phone' | 'otp' | 'tg-waiting' | 'tg-verifying';

export function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { createTelegramToken, verifyTelegramToken, isLoading, error, setError } = useAuth();

  const [view, setView] = useState<ScreenView>('main');
  const [phone, setPhone] = useState('');

  // Telegram state
  const [tgToken, setTgToken] = useState('');
  const [tgDeepLink, setTgDeepLink] = useState('');
  const [tgWebLink, setTgWebLink] = useState('');
  const [tgExpiresAt, setTgExpiresAt] = useState('');
  const [tgSecondsLeft, setTgSecondsLeft] = useState(0);

  const channelRef = useRef<ReturnType<typeof authSupabase.channel> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const verifiedRef = useRef(false);

  const cleanupTg = useCallback(() => {
    if (channelRef.current) {
      authSupabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => () => cleanupTg(), [cleanupTg]);

  // Countdown timer
  useEffect(() => {
    if (view !== 'tg-waiting' || !tgExpiresAt) return;
    const tick = () => {
      const left = Math.max(0, Math.floor((new Date(tgExpiresAt).getTime() - Date.now()) / 1000));
      setTgSecondsLeft(left);
      if (left === 0) {
        cleanupTg();
        setView('main');
        setError('Срок ссылки истёк. Попробуйте ещё раз.');
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [view, tgExpiresAt]);

  const checkAndVerify = useCallback(async (token: string) => {
    if (verifiedRef.current) return;
    const { data: row } = await authSupabase
      .from('telegram_login_tokens')
      .select('status')
      .eq('token', token)
      .maybeSingle();
    if (row?.status === 'confirmed') {
      await doVerify(token);
    }
  }, []);

  const doVerify = async (token: string) => {
    if (verifiedRef.current) return;
    verifiedRef.current = true;
    cleanupTg();
    setView('tg-verifying');
    const res = await verifyTelegramToken(token);
    if (!res.success) {
      verifiedRef.current = false;
      setView('tg-waiting');
    }
    // on success AuthRedirect handles navigation
  };

  const startTelegram = async () => {
    verifiedRef.current = false;
    const res = await createTelegramToken();
    if (!res.success) return;

    setTgToken(res.token);
    setTgDeepLink(res.deepLink);
    setTgWebLink(res.webLink);
    setTgExpiresAt(res.expiresAt);
    setView('tg-waiting');

    // Open Telegram
    Linking.openURL(res.deepLink).catch(() => Linking.openURL(res.webLink));

    // Realtime subscription
    const channel = authSupabase
      .channel(`tg-login-${res.token}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'telegram_login_tokens',
          filter: `token=eq.${res.token}`,
        },
        (payload) => {
          const row = payload.new as { status: string };
          if (row.status === 'confirmed') doVerify(res.token);
        },
      )
      .subscribe();
    channelRef.current = channel;

    // Polling fallback every 3s
    pollRef.current = setInterval(() => checkAndVerify(res.token), 3000);
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  // ── OTP screen ──
  if (view === 'otp') {
    return (
      <OtpScreen
        phone={phone}
        onBack={() => setView('phone')}
      />
    );
  }

  // ── Phone input screen ──
  if (view === 'phone') {
    return (
      <PhoneScreen
        onBack={() => setView('main')}
        onCodeSent={(normalizedPhone) => {
          setPhone(normalizedPhone);
          setView('otp');
        }}
      />
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.root, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
            <X size={20} color={COLORS.text1} strokeWidth={2} />
          </Pressable>
        </View>

        {/* Main or Waiting */}
        {view === 'tg-verifying' ? (
          <View style={styles.centerBox}>
            <Spinner />
            <Text style={styles.verifyingText}>Завершаем вход...</Text>
          </View>
        ) : view === 'tg-waiting' ? (
          <TgWaitingView
            secondsLeft={tgSecondsLeft}
            formatTime={formatTime}
            deepLink={tgDeepLink}
            webLink={tgWebLink}
            onCheckManually={() => checkAndVerify(tgToken)}
            onCancel={() => {
              cleanupTg();
              verifiedRef.current = false;
              setView('main');
            }}
          />
        ) : (
          <MainView
            isLoading={isLoading}
            error={error}
            onTelegram={startTelegram}
            onPhone={() => { setError(null); setView('phone'); }}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  root: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  verifyingText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text2,
  },
});
