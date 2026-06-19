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
    <View style={styles.body}>
      <View style={[styles.iconWrap, { backgroundColor: '#E8F4FC' }]}>
        <Send size={36} color="#229ED9" strokeWidth={1.5} />
      </View>

      <Text style={styles.title}>Откройте Telegram</Text>
      <Text style={styles.subtitle}>
        Нажмите <Text style={{ fontWeight: '700', color: COLORS.text1 }}>Start</Text> в боте и поделитесь номером телефона
      </Text>

      <View style={styles.timerRow}>
        <Spinner size={20} color={COLORS.text3} />
        <Text style={styles.timerText}>
          Ожидаем подтверждение... <Text style={styles.timerMono}>{formatTime(secondsLeft)}</Text>
        </Text>
      </View>

      <Pressable
        style={({ pressed }) => [styles.tgBtn, pressed && { opacity: 0.85 }]}
        onPress={() => Linking.openURL(deepLink).catch(() => Linking.openURL(webLink))}
      >
        <Send size={18} color={COLORS.white} strokeWidth={2} />
        <Text style={styles.tgBtnText}>Открыть Telegram ещё раз</Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.phoneBtn, pressed && { opacity: 0.7 }]}
        onPress={onCheckManually}
      >
        <Text style={[styles.phoneBtnText, { textAlign: 'center', flex: 1 }]}>Я подтвердил вход</Text>
      </Pressable>

      <Pressable onPress={onCancel} style={styles.cancelBtn}>
        <Text style={styles.cancelText}>Отменить</Text>
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
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timerText: {
    fontSize: 13,
    color: COLORS.text2,
  },
  timerMono: {
    fontWeight: '700',
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
