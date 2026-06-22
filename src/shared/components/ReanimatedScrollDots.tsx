import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  SharedValue,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
} from 'react-native-reanimated';

import { COLORS } from '@/shared/colors';

interface DotProps {
  index:        number;
  scrollX:      SharedValue<number>;
  interval:     number;
  activeColor:  string;
  inactiveColor: string;
}

const Dot = memo(function Dot({ index, scrollX, interval, activeColor, inactiveColor }: DotProps) {
  const style = useAnimatedStyle(() => {
    const input = [(index - 1) * interval, index * interval, (index + 1) * interval];
    return {
      width: interpolate(scrollX.value, input, [8, 20, 8], Extrapolation.CLAMP),
      backgroundColor: interpolateColor(scrollX.value, input, [inactiveColor, activeColor, inactiveColor]),
    };
  });
  return <Animated.View style={[s.dot, style]} />;
});

interface Props {
  count:          number;
  scrollX:        SharedValue<number>;
  itemInterval:   number;
  activeColor?:   string;
  inactiveColor?: string;
}

export function ReanimatedScrollDots({
  count,
  scrollX,
  itemInterval,
  activeColor   = COLORS.brandNavy,
  inactiveColor = '#C0C0C0',
}: Props) {
  if (count <= 1) return null;
  return (
    <View style={s.row}>
      {Array.from({ length: count }).map((_, i) => (
        <Dot
          key={i}
          index={i}
          scrollX={scrollX}
          interval={itemInterval}
          activeColor={activeColor}
          inactiveColor={inactiveColor}
        />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { height: 8, borderRadius: 4 },
});
