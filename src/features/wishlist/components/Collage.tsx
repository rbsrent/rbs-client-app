import { Image } from "expo-image";
import {
  StyleSheet,
  View
} from "react-native";

const CELL_GAP = 3;
const CELL_RADIUS = 9;

export function Collage({ urls, size }: { urls: string[]; size: number }) {
  const cell = (size - CELL_GAP) / 2;
  const cells = Array.from({ length: 4 }, (_, i) => urls[i] ?? null);
  const radii = [
    { borderTopLeftRadius: CELL_RADIUS },
    { borderTopRightRadius: CELL_RADIUS },
    { borderBottomLeftRadius: CELL_RADIUS },
    { borderBottomRightRadius: CELL_RADIUS },
  ];
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 14,
        overflow: "hidden",
        backgroundColor: "#fff",
        flexDirection: "row",
        flexWrap: "wrap",
        gap: CELL_GAP,
      }}
    >
      {cells.map((url, i) => (
        <View
          key={i}
          style={[
            {
              width: cell,
              height: cell,
              backgroundColor: "#D8D8D8",
              overflow: "hidden",
            },
            radii[i],
          ]}
        >
          {url ? (
            <Image
              source={{ uri: url }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          ) : null}
        </View>
      ))}
    </View>
  );
}