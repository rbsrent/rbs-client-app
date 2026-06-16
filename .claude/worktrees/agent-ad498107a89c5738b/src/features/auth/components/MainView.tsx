import { Phone, Send } from 'lucide-react-native';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { COLORS } from '@/shared/colors';

export function MainView({
  isLoading,
  error,
  onTelegram,
  onPhone,
}: {
  isLoading: boolean;
  error: string | null;
  onTelegram: () => void;
  onPhone: () => void;
}) {
  return (
    <View style={styles.body}>

      {/* Icon */}
      {/* <View style={styles.iconWrap}>
        <Send size={36} color={COLORS.brandNavy} strokeWidth={1.5} />
      </View> */}

      <Text style={styles.title}>Войти</Text>
      <Text style={styles.subtitle}>
        Быстрый вход без пароля — через Telegram или по номеру телефона
      </Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Telegram primary */}
      <Pressable
        style={({ pressed }) => [styles.tgBtn, pressed && { opacity: 0.85 }, isLoading && { opacity: 0.5 }]}
        onPress={onTelegram}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <>
            <Send size={18} color={COLORS.white} strokeWidth={2} />
            <Text style={styles.tgBtnText}>Войти через Telegram</Text>
          </>
        )}
      </Pressable>

      {/* Phone secondary */}
      <Pressable
        style={({ pressed }) => [styles.phoneBtn, pressed && { opacity: 0.7 }]}
        onPress={onPhone}
        disabled={isLoading}
      >
        <Phone size={18} color={COLORS.brandNavy} strokeWidth={2} />
        <View>
          <Text style={styles.phoneBtnText}>Войти по номеру телефона</Text>
          <Text style={styles.phoneBtnSub}>Код по SMS или MAX</Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    gap: 16,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
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
  errorText: {
    fontSize: 12,
    color: COLORS.error,
  },
  tgBtn: {
    height: 52,
    borderRadius: 16,
    backgroundColor: '#229ED9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 4,
  },
  tgBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  phoneBtn: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    gap: 12,
  },
  phoneBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text1,
  },
  phoneBtnSub: {
    fontSize: 11,
    color: COLORS.text3,
    marginTop: 1,
  },
});
