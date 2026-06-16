import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, Gift } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '@/shared/colors';

export default function CertificatesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <ArrowLeft size={22} color={COLORS.text1} strokeWidth={2} />
        </Pressable>
        <Text style={styles.title}>Подарочные сертификаты</Text>
        <View style={{ width: 22 }} />
      </View>
      <View style={styles.content}>
        <LinearGradient
          colors={[COLORS.brandViolet, COLORS.brandMagenta]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <Gift size={40} color={COLORS.white} strokeWidth={1.5} />
          <Text style={styles.heroTitle}>Подари незабываемое</Text>
          <Text style={styles.heroSub}>Сертификат на аренду катера или яхты</Text>
        </LinearGradient>
        <Text style={styles.placeholder}>Функция покупки сертификатов — в разработке</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundAlt },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: COLORS.text1 },
  content: { padding: 16, gap: 16 },
  heroCard: {
    borderRadius: 20,
    padding: 24,
    gap: 8,
    alignItems: 'center',
    minHeight: 160,
    justifyContent: 'center',
  },
  heroTitle: { fontSize: 20, fontWeight: '800', color: COLORS.white, textAlign: 'center' },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },
  placeholder: { fontSize: 14, color: COLORS.text3, textAlign: 'center' },
});
