import { useRouter } from 'expo-router';
import {
  Anchor,
  Gift,
  Map,
  MoreHorizontal,
  Sailboat,
  Ship,
  User,
  Zap,
} from 'lucide-react-native';
import React from 'react';
import {
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { COLORS } from '@/shared/colors';

const { width: W } = Dimensions.get('window');
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ServiceItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  bg: string;
  route: string;
  badge?: string;
}

const SERVICES: ServiceItem[] = [
  {
    key: 'boat',
    label: 'Катер',
    icon: <Anchor size={22} color="#1A5C72" strokeWidth={2} />,
    bg: '#D0F2FB',
    route: '/services/boat',
  },
  {
    key: 'yacht',
    label: 'Яхта',
    icon: <Sailboat size={22} color="#4B2CA0" strokeWidth={2} />,
    bg: '#E8E3FF',
    route: '/services/yacht',
    badge: 'Хит',
  },
  {
    key: 'ship',
    label: 'Теплоход',
    icon: <Ship size={22} color="#8B1A60" strokeWidth={2} />,
    bg: '#FAE3F5',
    route: '/services/cruise',
    badge: 'Скоро',
  },
  {
    key: 'routes',
    label: 'Маршруты',
    icon: <Map size={22} color="#155A38" strokeWidth={2} />,
    bg: '#D4F5E7',
    route: '/(tabs)/routes',
  },
  {
    key: 'cert',
    label: 'Сертификат',
    icon: <Gift size={22} color="#0F4D8A" strokeWidth={2} />,
    bg: '#D6EAFF',
    route: '/certificates',
  },
  {
    key: 'promo',
    label: 'Акции',
    icon: <Zap size={22} color="#7A4500" strokeWidth={2} />,
    bg: '#FFF0D6',
    route: '/services/boat',
  },
  {
    key: 'profile',
    label: 'Профиль',
    icon: <User size={22} color="#1A4A6B" strokeWidth={2} />,
    bg: '#DAEEFA',
    route: '/profile',
  },
  {
    key: 'more',
    label: 'Брони',
    icon: <MoreHorizontal size={22} color="#4A4A4A" strokeWidth={2} />,
    bg: '#EDEDED',
    route: '/(tabs)/bookings',
  },
];

function ServiceGridItem({ item }: { item: ServiceItem }) {
  const router = useRouter();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      style={[styles.serviceItem, animStyle]}
      onPressIn={() => { scale.value = withSpring(0.92, { damping: 18 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 18 }); }}
      onPress={() => router.push(item.route as any)}
    >
      <View style={[styles.serviceIconBox, { backgroundColor: item.bg }]}>
        {item.icon}
        {item.badge ? (
          <View style={styles.serviceBadge}>
            <Text style={styles.serviceBadgeText}>{item.badge}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.serviceLabel} numberOfLines={1}>{item.label}</Text>
    </AnimatedPressable>
  );
}

export function ServiceGrid() {
  return (
    <View style={styles.serviceGrid}>
      <View style={styles.serviceRow}>
        {SERVICES.slice(0, 4).map((s) => <ServiceGridItem key={s.key} item={s} />)}
      </View>
      <View style={styles.serviceRow}>
        {SERVICES.slice(4, 8).map((s) => <ServiceGridItem key={s.key} item={s} />)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  serviceGrid: {
    gap: 14,
  },
  serviceRow: {
    flexDirection: 'row',
    gap: 8,
  },
  serviceItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  serviceIconBox: {
    width: 62,
    height: 62,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF4500',
    borderRadius: 5,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  serviceBadgeText: {
    color: COLORS.white,
    fontSize: 8,
    fontWeight: '800',
  },
  serviceLabel: {
    fontSize: 11,
    color: '#4A4A4A',
    fontWeight: '400',
    textAlign: 'center',
  },
});
