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
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '@/shared/colors';
import { authSupabase } from '@/shared/supabase/authClient';

import { Spinner } from '@/shared/components/Spinner';
import { MainView } from '../components/MainView';
import { TgWaitingView } from '../components/TgWaitingView';
import { useAuth } from '../hooks/useAuth';
import { OtpScreen } from './OtpScreen';
import { PhoneScreen } from './PhoneScreen';

type ScreenView = 'main' | 'phone' | 'otp' | 'tg-waiting' | 'tg-verifying';

const TIMING = { duration: 280, easing: Easing.inOut(Easing.ease) };
const W = 400; // slide distance in px

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

  // ── Transition ──────────────────────────────────────────────────────────────
  // progress: 0 = previous view, 1 = current view
  const progress = useSharedValue(1);
  const dirRef = useRef<1 | -1>(1); // 1 = forward, -1 = back

  const [displayView, setDisplayView] = useState<ScreenView>('main');

  const navigate = (next: ScreenView, dir: 1 | -1 = 1) => {
    dirRef.current = dir;
    progress.value = 0;
    setDisplayView(next);
    setView(next);
    progress.value = withTiming(1, TIMING);
  };

  const animStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.4, 1], [0, 0.6, 1]),
    transform: [
      {
        translateX: interpolate(
          progress.value,
          [0, 1],
          [dirRef.current * W * 0.18, 0],
        ),
      },
    ],
  }));

  // ── Cleanup ─────────────────────────────────────────────────────────────────
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

  // ── Countdown ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (view !== 'tg-waiting' || !tgExpiresAt) return;
    const tick = () => {
      const left = Math.max(0, Math.floor((new Date(tgExpiresAt).getTime() - Date.now()) / 1000));
      setTgSecondsLeft(left);
      if (left === 0) {
        cleanupTg();
        navigate('main', -1);
        setError('Срок ссылки истёк. Попробуйте ещё раз.');
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [view, tgExpiresAt]);

  // ── Telegram ─────────────────────────────────────────────────────────────────
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
    navigate('tg-verifying', 1);
    const res = await verifyTelegramToken(token);
    if (!res.success) {
      verifiedRef.current = false;
      navigate('tg-waiting', -1);
    }
  };

  const startTelegram = async () => {
    verifiedRef.current = false;
    const res = await createTelegramToken();
    if (!res.success) return;

    setTgToken(res.token);
    setTgDeepLink(res.deepLink);
    setTgWebLink(res.webLink);
    setTgExpiresAt(res.expiresAt);
    navigate('tg-waiting', 1);

    Linking.openURL(res.deepLink).catch(() => Linking.openURL(res.webLink));

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

    pollRef.current = setInterval(() => checkAndVerify(res.token), 3000);
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  // ── OTP screen ──────────────────────────────────────────────────────────────
  if (view === 'otp') {
    return (
      <OtpScreen
        phone={phone}
        onBack={() => navigate('phone', -1)}
      />
    );
  }

  // ── Phone screen ─────────────────────────────────────────────────────────────
  if (view === 'phone') {
    return (
      <PhoneScreen
        onBack={() => navigate('main', -1)}
        onCodeSent={(normalizedPhone) => {
          setPhone(normalizedPhone);
          navigate('otp', 1);
        }}
      />
    );
  }

  // ── Main / Telegram views ────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={s.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[s.root, { paddingTop: insets.top }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={[s.closeBtn, { top: insets.top + 12 }]}
        >
          <X size={18} color={COLORS.text2} strokeWidth={2} />
        </Pressable>

        <Animated.View style={[s.flex, animStyle]}>
          {displayView === 'tg-verifying' ? (
            <View style={s.centerBox}>
              <Spinner />
              <Text style={s.verifyingText}>Завершаем вход…</Text>
            </View>
          ) : displayView === 'tg-waiting' ? (
            <TgWaitingView
              secondsLeft={tgSecondsLeft}
              formatTime={formatTime}
              deepLink={tgDeepLink}
              webLink={tgWebLink}
              onCheckManually={() => checkAndVerify(tgToken)}
              onCancel={() => {
                cleanupTg();
                verifiedRef.current = false;
                navigate('main', -1);
              }}
            />
          ) : (
            <MainView
              isLoading={isLoading}
              error={error}
              onTelegram={startTelegram}
              onPhone={() => { setError(null); navigate('phone', 1); }}
              bottomInset={insets.bottom}
            />
          )}
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  root: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 16,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.muted,
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
