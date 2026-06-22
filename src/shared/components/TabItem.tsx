import { useEffect } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { COLORS } from "@/shared/colors";

const SPRING = { damping: 20, stiffness: 300, mass: 0.8 };

export interface VisualTab {
  key: string;
  label: string;
  Icon: React.ComponentType<{
    size: number;
    color: string;
    strokeWidth: number;
  }>;
}

export function TabItem({
  tab,
  active,
  onPress,
}: {
  tab: VisualTab;
  active: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(active ? 1 : 0.72);

  useEffect(() => {
    opacity.value = withSpring(active ? 1 : 0.72, SPRING);
  }, [active]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Pressable
      style={styles.tab}
      onPressIn={() => {
        scale.value = withSpring(0.85, { damping: 14, stiffness: 400 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, SPRING);
      }}
      onPress={onPress}
      hitSlop={6}
    >
      <Animated.View style={[styles.tabInner, animStyle]}>
        <tab.Icon
          size={22}
          color={active ? COLORS.brandBlue : COLORS.grey}
          strokeWidth={active ? 2.2 : 1.7}
        />
        <Text style={[styles.label, active && styles.labelActive]}>
          {tab.label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 4,
  },
  tabInner: { alignItems: "center", gap: 3 },
  label: {
    fontSize: 10,
    color: COLORS.grey,
    letterSpacing: 0.1,
    fontWeight: "400",
  },
  labelActive: {
    color: COLORS.brandBlue,
    fontWeight: "700",
  },
});
