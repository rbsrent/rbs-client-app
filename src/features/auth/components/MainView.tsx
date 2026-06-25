import { Phone, Send } from 'lucide-react-native';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { COLORS } from '@/shared/colors';
import { Spinner } from '@/shared/components/Spinner';

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
    <View style={s.body}>
      <View style={s.top}>
        <View style={s.iconWrap}>
          <Send size={30} color={COLORS.white} strokeWidth={1.8} />
        </View>
        <Text style={s.title}>Войти в RBS</Text>
        <Text style={s.subtitle}>
          Быстрый вход без пароля — через Telegram или по номеру телефона
        </Text>
        {error ? <Text style={s.errorText}>{error}</Text> : null}
      </View>

      <View style={s.spacer} />

      <View style={s.actions}>
        <Pressable
          style={({ pressed }) => [s.tgBtn, pressed && { opacity: 0.85 }, isLoading && { opacity: 0.5 }]}
          onPress={onTelegram}
          disabled={isLoading}
        >
          {isLoading ? (
            <Spinner color="#fff" trackColor="rgba(255,255,255,0.25)" />
          ) : (
            <>
              <Send size={18} color={COLORS.white} strokeWidth={2} />
              <Text style={s.tgBtnText}>Войти через Telegram</Text>
            </>
          )}
        </Pressable>

        <View style={s.dividerRow}>
          <View style={s.divider} />
          <Text style={s.dividerText}>или</Text>
          <View style={s.divider} />
        </View>

        <Pressable
          style={({ pressed }) => [s.phoneBtn, pressed && { opacity: 0.7 }]}
          onPress={onPhone}
          disabled={isLoading}
        >
          <Phone size={18} color={COLORS.brandNavy} strokeWidth={2} />
          <View>
            <Text style={s.phoneBtnText}>Войти по номеру телефона</Text>
            <Text style={s.phoneBtnSub}>Код по SMS или MAX</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 72,
    paddingBottom: 32,
  },
  top: {
    gap: 12,
  },
  spacer: { flex: 1 },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: COLORS.brandNavy,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
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
  errorText: {
    fontSize: 13,
    color: COLORS.error,
    backgroundColor: COLORS.errorLight,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  actions: {
    gap: 12,
  },
  tgBtn: {
    height: 54,
    borderRadius: 16,
    backgroundColor: '#229ED9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  tgBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 2,
  },
  divider: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    fontSize: 12,
    color: COLORS.text3,
    fontWeight: '500',
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
