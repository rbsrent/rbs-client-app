import { ArrowLeft } from 'lucide-react-native';
import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PhoneInput } from '@/shared/components/PhoneInput';
import { COLORS } from '@/shared/colors';
import { digitsToE164, isValidDigits, normalizePhone } from '@/shared/utils/phone';

import { useAuth } from '../hooks/useAuth';
import { Spinner } from '@/shared/components/Spinner';

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

  const handleSend = async () => {
    if (!isValidDigits(digits)) return;
    const e164 = digitsToE164(digits);
    const res = await sendCode(e164, channel);
    if (res.success) onCodeSent(normalizePhone(e164).replace(/^8/, '7'));
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={10} style={styles.backBtn}>
          <ArrowLeft size={22} color={COLORS.brandNavy} strokeWidth={2} />
        </Pressable>
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>Войти по номеру</Text>
        <Text style={styles.subtitle}>
          Введите номер телефона — отправим код подтверждения
        </Text>

        <View style={styles.channelRow}>
          {(['sms', 'max'] as const).map((ch) => (
            <Pressable
              key={ch}
              style={[styles.channelBtn, channel === ch && styles.channelBtnActive]}
              onPress={() => setChannel(ch)}
            >
              <Text style={[styles.channelText, channel === ch && styles.channelTextActive]}>
                {ch === 'sms' ? 'SMS' : 'MAX'}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.inputWrap} onPress={() => inputRef.current?.focus()}>
          <PhoneInput
            ref={inputRef}
            digits={digits}
            onChangeDigits={setDigits}
            style={styles.input}
            returnKeyType="done"
            onSubmitEditing={handleSend}
          />
        </Pressable>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable
          style={[
            styles.sendBtn,
            (!isValidDigits(digits) || isLoading) && styles.sendBtnDisabled,
          ]}
          onPress={handleSend}
          disabled={!isValidDigits(digits) || isLoading}
        >
          {isLoading ? (
            <Spinner color="#fff" trackColor="rgba(255,255,255,0.25)" />
          ) : (
            <Text style={styles.sendBtnText}>Получить код</Text>
          )}
        </Pressable>

        <Text style={styles.terms}>
          Продолжая, вы соглашаетесь с{' '}
          <Text style={styles.termsLink}>условиями использования</Text>
        </Text>
      </View>
    </KeyboardAvoidingView>
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
  channelRow: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    gap: 3,
  },
  channelBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
  },
  channelBtnActive: {
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  channelText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text3,
  },
  channelTextActive: {
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
  },
  input: {
    flex: 1,
    fontSize: 17,
    color: COLORS.text1,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: -8,
  },
  sendBtn: {
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.brandNavy,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
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
    lineHeight: 15,
  },
  termsLink: {
    color: COLORS.brandNavy,
    fontWeight: '600',
  },
});
