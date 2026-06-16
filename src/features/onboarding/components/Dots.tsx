import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { COLORS } from '@/shared/colors';

export function Dots({ count, active }: { count: number; active: number }) {
  const anims = useRef(
    Array.from({ length: count }, () => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    anims.forEach((anim, i) => {
      Animated.spring(anim, {
        toValue: i === active ? 1 : 0,
        useNativeDriver: false,
        speed: 20,
        bounciness: 4,
      }).start();
    });
  }, [active]);

  return (
    <View style={styles.dotsRow}>
      {anims.map((anim, i) => {
        const width = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [8, 24],
        });
        const bg = anim.interpolate({
          inputRange: [0, 1],
          outputRange: ['#BBBBBB', COLORS.brandNavy],
        });
        return (
          <Animated.View key={i} style={[styles.dot, { width, backgroundColor: bg }]} />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 28,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#BBBBBB',
  },
});
