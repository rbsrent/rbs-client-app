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

const SIZE = {
  default: { h: 8, inactive: 8,  active: 20, gap: 6 },
  small:   { h: 6, inactive: 6,  active: 12, gap: 4 },
};

interface DotProps {
  index:        number;
  scrollX:      SharedValue<number>;
  interval:     number;
  activeColor:  string;
  inactiveColor: string;
  cfg: typeof SIZE['default'];
}

const Dot = memo(function Dot({ index, scrollX, interval, activeColor, inactiveColor, cfg }: DotProps) {
  const style = useAnimatedStyle(() => {
    const input = [(index - 1) * interval, index * interval, (index + 1) * interval];
    return {
      width: interpolate(scrollX.value, input, [cfg.inactive, cfg.active, cfg.inactive], Extrapolation.CLAMP),
      backgroundColor: interpolateColor(scrollX.value, input, [inactiveColor, activeColor, inactiveColor]),
    };
  });
  return <Animated.View style={[{ height: cfg.h, borderRadius: cfg.h / 2 }, style]} />;
});

interface Props {
  count:          number;
  scrollX:        SharedValue<number>;
  itemInterval:   number;
  activeColor?:   string;
  inactiveColor?: string;
  size?:          keyof typeof SIZE;
}

export function ReanimatedScrollDots({
  count,
  scrollX,
  itemInterval,
  activeColor   = COLORS.brandNavy,
  inactiveColor = '#C0C0C0',
  size          = 'default',
}: Props) {
  const cfg = SIZE[size];
  if (count <= 1) return null;
  return (
    <View style={[s.row, { gap: cfg.gap }]}>
      {Array.from({ length: count }).map((_, i) => (
        <Dot
          key={i}
          index={i}
          scrollX={scrollX}
          interval={itemInterval}
          activeColor={activeColor}
          inactiveColor={inactiveColor}
          cfg={cfg}
        />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
});
