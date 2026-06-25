import { ArrowLeft } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
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

import { PhoneInput } from '@/shared/components/PhoneInput';
import { COLORS } from '@/shared/colors';
import { digitsToE164, isValidDigits, normalizePhone } from '@/shared/utils/phone';

import { useAuth } from '../hooks/useAuth';
import { Spinner } from '@/shared/components/Spinner';

const TIMING = { duration: 280, easing: Easing.inOut(Easing.ease) };
const W = 400;

interface Props {
  onBack: () => void;
  onCodeSent: (normalizedPhone: string) => void;
}

export function PhoneScreen({ onBack, onCodeSent }: Props) {
  const insets = useSafeAreaInsets();
  const { sendCode, isLoading, error } = useAuth();
  const [digits, setDigits] = useState('');
  const [channel, setChannel] = useState<'sms' | 'max'>('sms');
  const inputRef = useRef<TextInput>(null);

  const progress = useSharedValue(0);
  const animStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.4, 1], [0, 0.6, 1]),
    transform: [{ translateX: interpolate(progress.value, [0, 1], [W * 0.18, 0]) }],
  }));

  useEffect(() => {
    progress.value = withTiming(1, TIMING);
  }, []);

  const handleSend = async () => {
    if (!isValidDigits(digits)) return;
    const e164 = digitsToE164(digits);
    const res = await sendCode(e164, channel);
    if (res.success) onCodeSent(normalizePhone(e164).replace(/^8/, '7'));
  };

  return (
    <Animated.View style={[s.flex, animStyle]}>
    <KeyboardAvoidingView
      style={[s.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={s.header}>
        <Pressable onPress={onBack} hitSlop={10} style={s.backBtn}>
          <ArrowLeft size={22} color={COLORS.brandNavy} strokeWidth={2} />
        </Pressable>
      </View>

      <View style={s.body}>
        <View style={s.hero}>
          <Text style={s.title}>Войти по номеру</Text>
          <Text style={s.subtitle}>
            Введите номер телефона — отправим код подтверждения
          </Text>
        </View>

        <View style={s.segmentedControl}>
          {(['sms', 'max'] as const).map((ch) => (
            <Pressable
              key={ch}
              style={[s.segmentBtn, channel === ch && s.segmentBtnActive]}
              onPress={() => setChannel(ch)}
            >
              <Text style={[s.segmentText, channel === ch && s.segmentTextActive]}>
                {ch === 'sms' ? 'SMS' : 'MAX'}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={s.inputWrap} onPress={() => inputRef.current?.focus()}>
          <PhoneInput
            ref={inputRef}
            digits={digits}
            onChangeDigits={setDigits}
            style={s.input}
            returnKeyType="done"
            onSubmitEditing={handleSend}
          />
        </Pressable>

        {error ? <Text style={s.errorText}>{error}</Text> : null}

        <Pressable
          style={[
            s.sendBtn,
            (!isValidDigits(digits) || isLoading) && s.sendBtnDisabled,
          ]}
          onPress={handleSend}
          disabled={!isValidDigits(digits) || isLoading}
        >
          {isLoading ? (
            <Spinner color="#fff" trackColor="rgba(255,255,255,0.25)" />
          ) : (
            <Text style={s.sendBtnText}>Получить код</Text>
          )}
        </Pressable>

        <Text style={s.terms}>
          Продолжая, вы соглашаетесь с{' '}
          <Text style={s.termsLink}>условиями использования</Text>
        </Text>
      </View>
    </KeyboardAvoidingView>
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
    gap: 16,
  },
  hero: {
    gap: 8,
    marginBottom: 4,
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
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: COLORS.muted,
    borderRadius: 12,
    padding: 3,
    gap: 3,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
  },
  segmentBtnActive: {
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text3,
  },
  segmentTextActive: {
    color: COLORS.brandNavy,
    fontWeight: '700',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  input: {
    flex: 1,
    fontSize: 17,
    color: COLORS.text1,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 13,
    color: COLORS.error,
    backgroundColor: COLORS.errorLight,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sendBtn: {
    height: 54,
    borderRadius: 16,
    backgroundColor: COLORS.brandNavy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  sendBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  terms: {
    fontSize: 11,
    color: COLORS.text3,
    textAlign: 'center',
    lineHeight: 16,
  },
  termsLink: {
    color: COLORS.brandNavy,
    fontWeight: '600',
  },
});
