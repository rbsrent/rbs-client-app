import { Heart } from "lucide-react-native";
import { useEffect } from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { BoatData } from "@/shared/wishlist";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useWishlistPicker } from "./WishlistPickerContext";

const AnimPressable = Animated.createAnimatedComponent(Pressable);

export function HeartButton({
  boat,
  size = 22,
}: {
  boat: BoatData;
  size?: number;
}) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const { openPicker } = useWishlistPicker();
  const saved = useWishlistStore((s) => s.saved[boat.boat_id] ?? false);
  const checkBoat = useWishlistStore((s) => s.checkBoat);
  const removeBoatFromAll = useWishlistStore((s) => s.removeBoatFromAll);
  const refreshBoat = useWishlistStore((s) => s.refreshBoat);

  useEffect(() => {
    if (useWishlistStore.getState().saved[boat.boat_id] === undefined) {
      checkBoat(boat.boat_id);
    }
  }, [boat.boat_id]);

  const handlePress = async () => {
    scale.value = withSequence(
      withTiming(0.82, { duration: 90 }),
      withTiming(1, { duration: 90 }),
    );
    if (saved) {
      await removeBoatFromAll(boat.boat_id);
    } else {
      openPicker(boat, () => refreshBoat(boat.boat_id));
    }
  };

  return (
    <AnimPressable style={[s.btn, anim]} onPress={handlePress} hitSlop={12}>
      <Heart
        size={size}
        color={saved ? "#E63946" : "rgba(255,255,255,0.9)"}
        fill={saved ? "#E63946" : "transparent"}
        strokeWidth={2}
      />
    </AnimPressable>
  );
}

const s = StyleSheet.create({
  btn: {
    width: 28,
    height: 28,
    borderRadius: 17,
    backgroundColor: "rgba(0,0,0,0.28)",
    alignItems: "center",
    justifyContent: "center",
  },
});
