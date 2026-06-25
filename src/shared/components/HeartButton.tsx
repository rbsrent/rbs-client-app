import { Heart } from "lucide-react-native";
import { useEffect } from "react";
import { Pressable, StyleSheet, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import * as Haptics from 'expo-haptics';

import { useWishlistToast } from "@/shared/context/WishlistToastContext";
import { BoatData, getGroup, getGroupsContaining, RECENT_GROUP_ID } from "@/shared/wishlist";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useWishlistPicker } from "./WishlistPickerContext";

const AnimPressable = Animated.createAnimatedComponent(Pressable);

export function HeartButton({
  boat,
  size = 22,
  style,
}: {
  boat: BoatData;
  size?: number;
  style?: ViewStyle;
}) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const { openPicker } = useWishlistPicker();
  const { show: showToast, dismiss: dismissToast } = useWishlistToast();
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
    dismissToast();
    scale.value = withSequence(
      withTiming(0.82, { duration: 90 }),
      withTiming(1, { duration: 90 }),
    );
    Haptics.impactAsync(
      saved ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium,
    );
    if (saved) {
      // resolve group name before removing
      let listName = 'Вишлист';
      try {
        const groupIds = await getGroupsContaining(boat.boat_id);
        const nonRecent = groupIds.filter((id) => id !== RECENT_GROUP_ID);
        if (nonRecent.length) {
          const g = await getGroup(nonRecent[0]);
          if (g) listName = g.name;
        }
      } catch {}
      await removeBoatFromAll(boat.boat_id);
      showToast({ type: 'deleted', listName, imageUrl: boat.cover_image_url });
    } else {
      openPicker(boat, () => refreshBoat(boat.boat_id));
    }
  };

  return (
    <AnimPressable style={[s.btn, anim, style]} onPress={handlePress} hitSlop={12}>
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
