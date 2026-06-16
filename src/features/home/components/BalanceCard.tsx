import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  ChevronRight,
  History,
  Plus,
  Waves,
} from 'lucide-react-native';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { COLORS } from '@/shared/colors';

export function BalanceCard({ session, smsUser }: { session: any; smsUser: any }) {
  const router = useRouter();
  const name = smsUser?.full_name?.split(' ')[0] ?? null;

  const actions = [
    { icon: <Plus size={16} color={COLORS.brandCyan} strokeWidth={2.5} />, label: 'Пополнить', onPress: () => {} },
    { icon: <Waves size={16} color={COLORS.brandCyan} strokeWidth={2.5} />, label: 'Забронировать', onPress: () => router.push('/catalog' as any) },
    { icon: <History size={16} color={COLORS.brandCyan} strokeWidth={2.5} />, label: 'История', onPress: () => router.push('/bookings' as any) },
  ];

  return (
    <View style={styles.balanceCard}>
      <LinearGradient
        colors={['#1A4A6B', '#0F3250', '#0A2240']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.balanceCardBg}>
        {[...Array(3)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.balanceDot,
              { opacity: 0.06 + i * 0.03, width: 80 + i * 40, height: 80 + i * 40, right: -20 - i * 20, top: -20 - i * 20 },
            ]}
          />
        ))}
      </View>

      <View style={styles.balanceTop}>
        <View>
          <Text style={styles.balanceGreeting}>
            {name ? `Привет, ${name} 👋` : 'RBS.RENT'}
          </Text>
          <Text style={styles.balanceLabel}>Аренда катеров и яхт</Text>
        </View>
        <Pressable
          style={styles.balanceHistoryBtn}
          onPress={() => session ? router.push('/bookings' as any) : router.push('/auth' as any)}
        >
          <Text style={styles.balanceHistoryText}>Мои брони</Text>
          <ChevronRight size={12} color={COLORS.brandCyan} strokeWidth={2.5} />
        </Pressable>
      </View>

      <View style={styles.balanceDivider} />

      <View style={styles.balanceActions}>
        {actions.map((a) => (
          <Pressable key={a.label} style={styles.balanceAction} onPress={a.onPress}>
            <View style={styles.balanceActionIcon}>
              {a.icon}
            </View>
            <Text style={styles.balanceActionLabel} numberOfLines={1}>{a.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  balanceCard: {
    borderRadius: 16,
    overflow: 'hidden',
    padding: 16,
    gap: 12,
  },
  balanceCardBg: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
  balanceDot: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: COLORS.white,
  },
  balanceTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  balanceGreeting: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  balanceLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    marginTop: 2,
  },
  balanceHistoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  balanceHistoryText: {
    fontSize: 11,
    color: COLORS.brandCyan,
    fontWeight: '600',
  },
  balanceDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  balanceActions: {
    flexDirection: 'row',
    gap: 0,
  },
  balanceAction: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  balanceActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceActionLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    textAlign: 'center',
  },
});
