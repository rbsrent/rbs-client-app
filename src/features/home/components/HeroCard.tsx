import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Anchor,
  CalendarCheck,
  ChevronRight,
  Map,
} from 'lucide-react-native';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { COLORS } from '@/shared/colors';

export function HeroCard({ session, smsUser }: { session: any; smsUser: any }) {
  const router = useRouter();
  const name = smsUser?.full_name?.split(' ')[0] ?? null;

  const actions = [
    {
      icon: <Anchor size={17} color={COLORS.brandCyan} strokeWidth={2.2} />,
      label: 'Забронировать',
      onPress: () => router.push('/services/boat' as any),
    },
    {
      icon: <CalendarCheck size={17} color={COLORS.brandCyan} strokeWidth={2.2} />,
      label: 'Мои брони',
      onPress: () => session
        ? router.push('/(tabs)/bookings' as any)
        : router.push('/auth' as any),
    },
    {
      icon: <Map size={17} color={COLORS.brandCyan} strokeWidth={2.2} />,
      label: 'Маршруты',
      onPress: () => router.push('/(tabs)/routes' as any),
    },
  ];

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={['#1A4A6B', '#0F3250', '#0A2240']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* decorative circles */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={[
              styles.decorCircle,
              {
                opacity: 0.05 + i * 0.025,
                width: 90 + i * 45,
                height: 90 + i * 45,
                right: -24 - i * 22,
                top: -24 - i * 22,
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.top}>
        <View>
          <Text style={styles.greeting}>
            {name ? `Привет, ${name} 👋` : 'RBS RENT'}
          </Text>
          <Text style={styles.sub}>Аренда катеров и яхт · СПб</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.bookingsBtn, pressed && { opacity: 0.7 }]}
          onPress={() => session
            ? router.push('/(tabs)/bookings' as any)
            : router.push('/auth' as any)}
        >
          <Text style={styles.bookingsBtnText}>Брони</Text>
          <ChevronRight size={12} color={COLORS.brandCyan} strokeWidth={2.5} />
        </Pressable>
      </View>

      <View style={styles.divider} />

      <View style={styles.actions}>
        {actions.map((a) => (
          <Pressable
            key={a.label}
            style={({ pressed }) => [styles.action, pressed && { opacity: 0.7 }]}
            onPress={a.onPress}
          >
            <View style={styles.actionIcon}>{a.icon}</View>
            <Text style={styles.actionLabel} numberOfLines={1}>{a.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    padding: 16,
    gap: 12,
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: COLORS.white,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  sub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 3,
  },
  bookingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  bookingsBtnText: {
    fontSize: 11,
    color: COLORS.brandCyan,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  actions: {
    flexDirection: 'row',
  },
  action: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    textAlign: 'center',
  },
});
