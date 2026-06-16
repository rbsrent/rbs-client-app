import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '@/shared/colors';

import { useAuth } from '../hooks/useAuth';

interface Props {
  phone: string;
  onBack: () => void;
}

export function OtpScreen({ phone, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { verifyCode, sendCode, isLoading, error } = useAuth();
  const [code, setCode] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
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
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={10} style={styles.backBtn}>
          <ArrowLeft size={22} color={COLORS.brandNavy} strokeWidth={2} />
        </Pressable>
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>Введите код</Text>
        <Text style={styles.subtitle}>
          Отправили 4-значный код на{'\n'}
          <Text style={styles.phoneBold}>{displayPhone}</Text>
        </Text>

        <TextInput
          ref={inputRef}
          style={styles.codeInput}
          value={code}
          onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 4))}
          keyboardType="number-pad"
          maxLength={4}
          textAlign="center"
          placeholder="_ _ _ _"
          placeholderTextColor={COLORS.text3}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {isLoading ? <ActivityIndicator color={COLORS.brandNavy} style={{ marginTop: 8 }} /> : null}

        <Pressable onPress={handleResend} disabled={resendTimer > 0}>
          <Text style={[styles.resend, resendTimer > 0 && styles.resendDisabled]}>
            {resendTimer > 0
              ? `Отправить повторно (${resendTimer}с)`
              : 'Отправить повторно'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: COLORS.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text1,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.text2,
    lineHeight: 20,
    marginTop: -8,
  },
  phoneBold: {
    fontWeight: '700',
    color: COLORS.text1,
  },
  codeInput: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.brandNavy,
    letterSpacing: 16,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.brandNavy,
    paddingVertical: 10,
    marginTop: 8,
  },
  errorText: {
    fontSize: 13,
    color: COLORS.error,
    textAlign: 'center',
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
