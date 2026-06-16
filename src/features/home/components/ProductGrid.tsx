import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Anchor,
  Gift,
  Map,
  MoreHorizontal,
  Sailboat,
  Ship,
} from 'lucide-react-native';
import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { COLORS } from '@/shared/colors';

interface Product {
  key: string;
  label: string;
  icon: React.ReactNode;
  gradient: [string, string];
  route: string;
  badge?: string;
}

const PRODUCTS: Product[] = [
  {
    key: 'boat',
    label: 'Катер',
    icon: <Anchor size={26} color={COLORS.white} strokeWidth={1.8} />,
    gradient: [COLORS.brandCyan, '#1AAFD0'],
    route: '/catalog?type=Катер',
  },
  {
    key: 'yacht',
    label: 'Яхта',
    icon: <Sailboat size={26} color={COLORS.white} strokeWidth={1.8} />,
    gradient: [COLORS.brandViolet, '#5B3EC6'],
    route: '/catalog?type=Яхта',
    badge: 'Хит',
  },
  {
    key: 'ship',
    label: 'Теплоход',
    icon: <Ship size={26} color={COLORS.white} strokeWidth={1.8} />,
    gradient: [COLORS.brandMagenta, '#C040A0'],
    route: '/cruises',
  },
  {
    key: 'routes',
    label: 'Маршруты',
    icon: <Map size={26} color={COLORS.white} strokeWidth={1.8} />,
    gradient: ['#25A077', '#1A7055'],
    route: '/routes',
  },
  {
    key: 'cert',
    label: 'Сертификат',
    icon: <Gift size={26} color={COLORS.white} strokeWidth={1.8} />,
    gradient: [COLORS.brandBlue, '#1570C0'],
    route: '/certificates',
  },
  {
    key: 'more',
    label: 'Ещё',
    icon: <MoreHorizontal size={26} color={COLORS.white} strokeWidth={1.8} />,
    gradient: ['#6B7A8D', '#4A5568'],
    route: '/catalog',
  },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function ProductItem({ product }: { product: Product }) {
  const router = useRouter();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[styles.item, animStyle]}
      onPressIn={() => { scale.value = withSpring(0.94, { damping: 15 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
      onPress={() => router.push(product.route as any)}
    >
      <LinearGradient
        colors={product.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.iconContainer}
      >
        {product.icon}
        {product.badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{product.badge}</Text>
          </View>
        ) : null}
      </LinearGradient>
      <Text style={styles.label} numberOfLines={1}>
        {product.label}
      </Text>
    </AnimatedPressable>
  );
}

export const ProductGrid = memo(function ProductGrid() {
  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {PRODUCTS.map((p) => (
          <ProductItem key={p.key} product={p} />
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  item: {
    width: '30%',
    alignItems: 'center',
    gap: 6,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    color: COLORS.text1,
    fontWeight: '500',
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.warning,
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '700',
  },
});
