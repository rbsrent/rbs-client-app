import { COLORS } from "@/shared/colors";
import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

export const STEP_LABELS = [
  "Дата и время",
  "Место и цена",
  "Ваши данные",
  "Оплата",
];

export function StepProgress({ step }: { step: number }) {
  const fills = useRef(
    STEP_LABELS.map((_, i) => new Animated.Value(i + 1 <= step ? 1 : 0))
  ).current;

  useEffect(() => {
    Animated.parallel(
      fills.map((fill, i) =>
        Animated.timing(fill, {
          toValue: i + 1 <= step ? 1 : 0,
          duration: 520,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        })
      )
    ).start();
  }, [step]);

  return (
    <View style={p.bar}>
      {fills.map((fill, i) => (
        <View key={i} style={p.track}>
          <Animated.View
            style={[
              p.fill,
              {
                width: fill.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
        </View>
      ))}
    </View>
  );
}

const p = StyleSheet.create({
  bar: {
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: COLORS.white,
  },
  track: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    overflow: "hidden",
  },
  fill: {
    position: "absolute",
    left: 0, top: 0, bottom: 0,
    backgroundColor: COLORS.brandNavy,
    borderRadius: 2,
  },
});
