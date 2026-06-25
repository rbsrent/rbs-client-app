import { Image } from 'expo-image';
import { memo, useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
} from 'react-native-reanimated';

import { ROUTE_CARD_H, ROUTE_CARD_W } from './HomeRouteCard';

const ANGLES = [-8, 4, -2];

function Thumb({
  uri,
  angle,
  marginLeft,
  index,
  visible,
}: {
  uri: string;
  angle: number;
  marginLeft: number;
  index: number;
  visible: boolean;
}) {
  const opacity    = useSharedValue(0);
  const translateY = useSharedValue(18);

  useEffect(() => {
    if (!visible) return;
    const delay = index * 110;
    opacity.value    = withDelay(delay, withTiming(1, { duration: 240 }));
    translateY.value = withDelay(delay, withSpring(0, { damping: 14, stiffness: 120 }));
  }, [visible]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ rotate: `${angle}deg` }, { translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[s.thumb, { zIndex: 3 - index, marginLeft }, animStyle]}>
      <Image
        source={{ uri }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
    </Animated.View>
  );
}

export const RoutesSeeAllCard = memo(function RoutesSeeAllCard({
  previews,
  onPress,
  visible,
}: {
  previews: string[];
  onPress: () => void;
  visible: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [s.card, pressed && { opacity: 0.88 }]}
      onPress={onPress}
    >
      <View style={s.imgs}>
        {previews.slice(0, 3).map((uri, i) => (
          <Thumb
            key={i}
            uri={uri}
            angle={ANGLES[i] ?? 0}
            marginLeft={i === 0 ? 0 : -28}
            index={i}
            visible={visible}
          />
        ))}
      </View>
      <Text style={s.txt}>Показать все</Text>
    </Pressable>
  );
});

const s = StyleSheet.create({
  card: {
    width: ROUTE_CARD_W,
    height: ROUTE_CARD_H,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  imgs: { flexDirection: 'row', alignItems: 'center', height: 88 },
  thumb: {
    width: 72,
    height: 88,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#fff',
    overflow: 'hidden',
    backgroundColor: '#DDD',
  },
  txt: { fontSize: 13, fontWeight: '700', color: '#000' },
});
