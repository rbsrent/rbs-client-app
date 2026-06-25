import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

export function FadeScreen({
  children,
  duration = 180,
}: {
  children: React.ReactNode;
  duration?: number;
}) {
  const opacity = useSharedValue(0);

  useFocusEffect(
    useCallback(() => {
      opacity.value = withTiming(1, { duration });
      return () => {
        opacity.value = 0;
      };
    }, [duration]),
  );

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={[StyleSheet.absoluteFill, style]}>{children}</Animated.View>;
}
