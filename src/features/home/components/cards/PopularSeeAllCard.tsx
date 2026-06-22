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

import { CARD_W, IMG_H } from './PopularBoatCard';

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

export const PopularSeeAllCard = memo(function PopularSeeAllCard({
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
    width: CARD_W,
    height: IMG_H + 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  imgs: { flexDirection: 'row', alignItems: 'center', height: 72 },
  thumb: {
    width: 64,
    height: 72,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#fff',
    overflow: 'hidden',
    backgroundColor: '#DDD',
  },
  txt: { fontSize: 13, fontWeight: '700', color: '#000' },
});
