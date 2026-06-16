import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronRight, Gift } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export function GiftCertCard() {
  const router = useRouter();
  return (
    <Pressable
      style={({ pressed }) => [styles.wrap, pressed && { opacity: 0.88 }]}
      onPress={() => router.push('/certificates' as any)}
    >
      <LinearGradient
        colors={['#1B2A41', '#2086C7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        <View style={styles.left}>
          <View style={styles.iconCircle}>
            <Gift size={24} color="#fff" strokeWidth={1.8} />
          </View>
          <View style={styles.textCol}>
            <Text style={styles.title}>Подарочный сертификат на прогулку</Text>
            <Text style={styles.sub}>Номиналы 5 000 – 50 000 ₽ · PDF на e-mail</Text>
          </View>
        </View>
        <View style={styles.btn}>
          <Text style={styles.btnText}>Купить</Text>
          <ChevronRight size={14} color="#1B2A41" strokeWidth={2.5} />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#1B2A41',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 6,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textCol: { flex: 1, gap: 3 },
  title: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
  },
  sub: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    lineHeight: 15,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexShrink: 0,
  },
  btnText: {
    color: '#1B2A41',
    fontSize: 12,
    fontWeight: '700',
  },
});
