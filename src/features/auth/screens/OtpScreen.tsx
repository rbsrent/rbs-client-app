import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
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

import { useAuth } from '../hooks/useAuth';
import { Spinner } from '@/shared/components/Spinner';

interface Props {
  phone: string;
  onBack: () => void;
}

const TIMING = { duration: 280, easing: Easing.inOut(Easing.ease) };
const W = 400;

export function OtpScreen({ phone, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { verifyCode, sendCode, isLoading, error } = useAuth();
  const [code, setCode] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const inputRef = useRef<TextInput>(null);

  const progress = useSharedValue(0);
  const animStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.4, 1], [0, 0.6, 1]),
    transform: [{ translateX: interpolate(progress.value, [0, 1], [W * 0.18, 0]) }],
  }));

  useEffect(() => {
    progress.value = withTiming(1, TIMING);
    inputRef.current?.focus();
    const interval = setInterval(() => {
      setResendTimer((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (code.length === 4) handleVerify();
  }, [code]);

  const handleVerify = async () => {
    const res = await verifyCode(phone, code);
    if (res.success) {
      router.replace('/(tabs)' as any);
    } else {
      setCode('');
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    await sendCode(phone, 'sms');
    setResendTimer(60);
  };

  const displayPhone = `+7 ${phone.slice(1, 4)} ${phone.slice(4, 7)}-${phone.slice(7, 9)}-${phone.slice(9)}`;

  return (
    <Animated.View style={[s.flex, animStyle]}>
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Pressable onPress={onBack} hitSlop={10} style={s.backBtn}>
          <ArrowLeft size={22} color={COLORS.brandNavy} strokeWidth={2} />
        </Pressable>
      </View>

      <View style={s.body}>
        <View style={s.hero}>
          <Text style={s.title}>Введите код</Text>
          <Text style={s.subtitle}>
            Отправили 4-значный код на{'\n'}
            <Text style={s.phoneBold}>{displayPhone}</Text>
          </Text>
        </View>

        {/* OTP cell display */}
        <View style={s.otpRow}>
          {[0, 1, 2, 3].map((i) => (
            <Pressable key={i} style={[s.otpCell, code.length === i && s.otpCellActive]} onPress={() => inputRef.current?.focus()}>
              <Text style={s.otpChar}>{code[i] ?? ''}</Text>
              {code.length === i && <View style={s.cursor} />}
            </Pressable>
          ))}
        </View>

        {/* Hidden input */}
        <TextInput
          ref={inputRef}
          value={code}
          onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 4))}
          keyboardType="number-pad"
          maxLength={4}
          style={s.hiddenInput}
          caretHidden
        />

        {error ? <Text style={s.errorText}>{error}</Text> : null}
        {isLoading ? <Spinner style={{ marginTop: 4 }} /> : null}

        <Pressable onPress={handleResend} disabled={resendTimer > 0} style={s.resendBtn}>
          <Text style={[s.resend, resendTimer > 0 && s.resendDisabled]}>
            {resendTimer > 0
              ? `Отправить повторно (${resendTimer}с)`
              : 'Отправить повторно'}
          </Text>
        </Pressable>
      </View>
    </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
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
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    gap: 24,
  },
  hero: {
    gap: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.text1,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.text2,
    lineHeight: 21,
  },
  phoneBold: {
    fontWeight: '700',
    color: COLORS.text1,
  },
  otpRow: {
    flexDirection: 'row',
    gap: 12,
  },
  otpCell: {
    flex: 1,
    height: 64,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpCellActive: {
    borderColor: COLORS.brandNavy,
    backgroundColor: COLORS.white,
  },
  otpChar: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.brandNavy,
  },
  cursor: {
    position: 'absolute',
    bottom: 14,
    width: 2,
    height: 24,
    borderRadius: 1,
    backgroundColor: COLORS.brandNavy,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  errorText: {
    fontSize: 13,
    color: COLORS.error,
    backgroundColor: COLORS.errorLight,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    textAlign: 'center',
  },
  resendBtn: {
    alignSelf: 'center',
    paddingVertical: 4,
  },
  resend: {
    fontSize: 14,
    color: COLORS.brandNavy,
    fontWeight: '600',
    textAlign: 'center',
  },
  resendDisabled: {
    color: COLORS.text3,
    fontWeight: '400',
  },
});
