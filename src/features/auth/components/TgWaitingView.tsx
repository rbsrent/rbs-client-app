import { Send } from 'lucide-react-native';
import {
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { COLORS } from '@/shared/colors';
import { Spinner } from '@/shared/components/Spinner';

export function TgWaitingView({
  secondsLeft,
  formatTime,
  deepLink,
  webLink,
  onCheckManually,
  onCancel,
}: {
  secondsLeft: number;
  formatTime: (s: number) => string;
  deepLink: string;
  webLink: string;
  onCheckManually: () => void;
  onCancel: () => void;
}) {
  return (
    <View style={s.body}>
      <View style={s.top}>
        <View style={s.iconWrap}>
          <Send size={30} color="#229ED9" strokeWidth={1.8} />
        </View>
        <Text style={s.title}>Откройте Telegram</Text>
        <Text style={s.subtitle}>
          Нажмите <Text style={s.bold}>Start</Text> в боте и поделитесь номером телефона
        </Text>

        <View style={s.timerPill}>
          <Spinner size={16} color={COLORS.text3} />
          <Text style={s.timerText}>
            Ожидаем подтверждение…{' '}
            <Text style={s.timerMono}>{formatTime(secondsLeft)}</Text>
          </Text>
        </View>
      </View>

      <View style={s.spacer} />

      <View style={s.actions}>
        <Pressable
          style={({ pressed }) => [s.tgBtn, pressed && { opacity: 0.85 }]}
          onPress={() => Linking.openURL(deepLink).catch(() => Linking.openURL(webLink))}
        >
          <Send size={18} color={COLORS.white} strokeWidth={2} />
          <Text style={s.tgBtnText}>Открыть Telegram ещё раз</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [s.outlineBtn, pressed && { opacity: 0.7 }]}
          onPress={onCheckManually}
        >
          <Text style={s.outlineBtnText}>Я подтвердил вход</Text>
        </Pressable>

        <Pressable onPress={onCancel} style={s.cancelBtn}>
          <Text style={s.cancelText}>Отменить</Text>
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
    backgroundColor: '#E8F4FC',
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
  bold: {
    fontWeight: '700',
    color: COLORS.text1,
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.muted,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    alignSelf: 'flex-start',
  },
  timerText: {
    fontSize: 13,
    color: COLORS.text2,
  },
  timerMono: {
    fontWeight: '700',
    color: COLORS.text1,
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
  outlineBtn: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text1,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: 14,
    color: COLORS.text3,
  },
});
