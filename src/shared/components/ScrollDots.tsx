import { Animated, StyleSheet, View } from 'react-native';

import { COLORS } from '@/shared/colors';

interface Props {
  count: number;
  scrollX: Animated.Value;
  itemInterval: number;
  activeColor?: string;
  inactiveColor?: string;
}

export function ScrollDots({ count, scrollX, itemInterval, activeColor, inactiveColor }: Props) {
  const active   = activeColor   ?? COLORS.brandNavy;
  const inactive = inactiveColor ?? '#C0C0C0';

  if (count <= 1) return null;
  return (
    <View style={styles.row}>
      {Array.from({ length: count }).map((_, i) => {
        const inputRange = [(i - 1) * itemInterval, i * itemInterval, (i + 1) * itemInterval];
        const width = scrollX.interpolate({
          inputRange,
          outputRange: [8, 20, 8],
          extrapolate: 'clamp',
        });
        const bg = scrollX.interpolate({
          inputRange,
          outputRange: [inactive, active, inactive],
          extrapolate: 'clamp',
        });
        return (
          <Animated.View key={i} style={[styles.dot, { width, backgroundColor: bg }]} />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C0C0C0',
  },
});
