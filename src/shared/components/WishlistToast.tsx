import { Image } from 'expo-image';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useWishlistToast } from '@/shared/context/WishlistToastContext';

const TAB_BAR_H = 60;
const TIMING_IN  = { duration: 300, easing: Easing.out(Easing.back(1.4)) };
const TIMING_OUT = { duration: 220, easing: Easing.in(Easing.ease) };

export function WishlistToast() {
  const { payload, dismiss } = useWishlistToast();
  const { bottom } = useSafeAreaInsets();

  const progress = useSharedValue(0);

  useEffect(() => {
    if (payload) {
      progress.value = withTiming(1, TIMING_IN);
    } else {
      progress.value = withTiming(0, TIMING_OUT);
    }
  }, [!!payload]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 40 }],
  }));

  const isEdit = payload?.type === 'saved';
  const label  = payload
    ? isEdit
      ? `Сохранено в ${payload.listName}`
      : `Удалено из ${payload.listName}`
    : '';

  return (
    <Animated.View
      style={[s.container, { bottom: TAB_BAR_H + bottom + 8 }, animStyle]}
      pointerEvents={payload ? 'auto' : 'none'}
    >
      <View style={s.row}>
        <View style={s.thumb}>
          {payload?.imageUrl ? (
            <Image
              source={{ uri: payload.imageUrl }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, s.thumbFallback]} />
          )}
        </View>

        <Text style={s.label} numberOfLines={2}>
          {label}
        </Text>

        {isEdit && payload?.onEdit ? (
          <Pressable
            hitSlop={8}
            onPress={() => {
              dismiss();
              payload.onEdit?.();
            }}
            style={({ pressed }) => [s.editBtn, pressed && { opacity: 0.6 }]}
          >
            <Text style={s.editTxt}>Изменить</Text>
          </Pressable>
        ) : null}
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 998,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 12,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
    overflow: 'hidden',
    flexShrink: 0,
    backgroundColor: '#E8E8E8',
  },
  thumbFallback: {
    backgroundColor: '#E0E0E0',
  },
  label: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#111',
    lineHeight: 19,
  },
  editBtn: {
    flexShrink: 0,
  },
  editTxt: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
    textDecorationLine: 'underline',
  },
});
