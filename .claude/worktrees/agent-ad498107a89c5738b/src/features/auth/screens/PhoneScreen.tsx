import { ArrowLeft, Phone } from 'lucide-react-native';
import { useRef, useState } from 'react';
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
import { isValidRuPhone, normalizePhone } from '@/shared/utils/phone';

import { useAuth } from '../hooks/useAuth';

interface Props {
  onBack: () => void;
  onCodeSent: (normalizedPhone: string) => void;
}

export function PhoneScreen({ onBack, onCodeSent }: Props) {
  const insets = useSafeAreaInsets();
  const { sendCode, isLoading, error } = useAuth();
  const [phone, setPhone] = useState('');
  const [channel, setChannel] = useState<'sms' | 'max'>('sms');
  const inputRef = useRef<TextInput>(null);

  const handleSend = async () => {
    if (!isValidRuPhone(phone)) return;
    const normalized = normalizePhone(phone).replace(/^8/, '7');
    const res = await sendCode(phone, channel);
    if (res.success) onCodeSent(normalized);
  };

  const formatPhone = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 11);
    if (digits.length === 0) return '';
    if (digits.length <= 1) return '+7';
    if (digits.length <= 4) return `+7 (${digits.slice(1)}`;
    if (digits.length <= 7) return `+7 (${digits.slice(1, 4)}) ${digits.slice(4)}`;
    if (digits.length <= 9) return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
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
          <Phone size={18} color={COLORS.text3} strokeWidth={1.8} />
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={formatPhone(phone)}
            onChangeText={(t) => setPhone(t.replace(/\D/g, ''))}
            placeholder="+7 (___) ___-__-__"
            placeholderTextColor={COLORS.text3}
            keyboardType="phone-pad"
            returnKeyType="done"
            onSubmitEditing={handleSend}
            maxLength={18}
          />
        </Pressable>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable
          style={[
            styles.sendBtn,
            (!isValidRuPhone(phone) || isLoading) && styles.sendBtnDisabled,
          ]}
          onPress={handleSend}
          disabled={!isValidRuPhone(phone) || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.sendBtnText}>Получить код</Text>
          )}
        </Pressable>

        <Text style={styles.terms}>
          Продолжая, вы соглашаетесь с{' '}
          <Text style={styles.termsLink}>условиями использования</Text>
        </Text>
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
  channelRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.muted,
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
    backgroundColor: COLORS.backgroundAlt,
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
