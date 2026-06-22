import { Anchor } from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import { COLORS } from "../colors";

const SIZE_DEFAULT = 40;
const SIZE_ACTIVE  = 54;

export function FlamePin({ active = false }: { active?: boolean }) {
  const size = active ? SIZE_ACTIVE : SIZE_DEFAULT;
  const color = active ? '#FF3B30' : COLORS.brandNavy;

  return (
    <View style={pin.outer}>
      <View style={[
        pin.body,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
      ]}>
        <Anchor size={active ? 22 : 17} color="#fff" strokeWidth={2} />
      </View>
      <View style={[
        pin.tail,
        { borderTopColor: color },
        active
          ? { borderLeftWidth: 12, borderRightWidth: 12, borderTopWidth: 18, marginTop: -6 }
          : { borderLeftWidth: 8,  borderRightWidth: 8,  borderTopWidth: 12, marginTop: -4 },
      ]} />
    </View>
  );
}

const pin = StyleSheet.create({
  outer: { alignItems: 'center' },

  body: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 6,
  },

  tail: {
    width: 0,
    height: 0,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});
