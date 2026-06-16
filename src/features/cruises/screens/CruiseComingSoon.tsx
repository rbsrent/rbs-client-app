import { useRouter } from 'expo-router';
import { Clock, Ship } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/shared/colors';
import { ScreenHeader } from '@/shared/components/ScreenHeader';

export function CruiseComingSoon() {
  const router = useRouter();

  return (
    <View style={styles.root}>
      <ScreenHeader title="Теплоходы" />

      <View style={styles.body}>
        <View style={styles.iconWrap}>
          <Ship size={56} color={COLORS.brandNavy} strokeWidth={1.4} />
        </View>

        <Text style={styles.title}>Билеты на теплоходы</Text>
        <Text style={styles.sub}>
          Экскурсионные прогулки по рекам и каналам Санкт-Петербурга.{'\n'}
          Скоро — следите за обновлениями.
        </Text>

        <View style={styles.badge}>
          <Clock size={13} color={COLORS.brandCyan} strokeWidth={2} />
          <Text style={styles.badgeText}>Скоро доступно</Text>
        </View>

        <Text style={styles.hint}>
          Пока вы можете арендовать катер или яхту под себя.
        </Text>

        <Pressable
          style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]}
          onPress={() => router.push('/services/boat' as any)}
        >
          <Text style={styles.btnText}>Смотреть катера</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.white },

  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 14,
  },
  iconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text1,
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  sub: {
    fontSize: 14,
    color: COLORS.text2,
    textAlign: 'center',
    lineHeight: 21,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.brandCyan + '18',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.brandCyan,
  },
  hint: {
    fontSize: 13,
    color: COLORS.text3,
    textAlign: 'center',
    marginTop: 4,
  },
  btn: {
    marginTop: 8,
    height: 50,
    paddingHorizontal: 32,
    backgroundColor: COLORS.brandNavy,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
});
