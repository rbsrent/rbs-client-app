import { CheckCircle2, XCircle } from "lucide-react-native";
import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Boat } from "@/features/catalog/hooks/useBoatDetail";
import { COLORS } from "@/shared/colors";

type AmenityKey = 'has_tarp' | 'has_toilet' | 'has_heating' | 'has_covered_saloon' | 'has_bluetooth';

const AMENITIES: { key: AmenityKey; label: string }[] = [
  { key: "has_tarp",           label: "Тент / навес" },
  { key: "has_toilet",         label: "Туалет на борту" },
  { key: "has_heating",        label: "Отопление" },
  { key: "has_covered_saloon", label: "Крытый салон" },
  { key: "has_bluetooth",      label: "Bluetooth" },
];

interface Props {
  boat: Boat;
}

function AmenityRow({ label, active }: { label: string; active: boolean }) {
  return (
    <View style={s.row}>
      {active ? (
        <CheckCircle2 size={20} color={COLORS.brandNavy} strokeWidth={2} />
      ) : (
        <XCircle size={20} color="#CCCCCC" strokeWidth={2} />
      )}
      <Text style={[s.label, !active && s.labelInactive]}>{label}</Text>
    </View>
  );
}

function BoatDetailAmenities({ boat }: Props) {
  return (
    <View style={s.block}>
      <Text style={s.title}>Удобства</Text>
      <View style={s.list}>
        {AMENITIES.map((a) => (
          <AmenityRow key={a.key} label={a.label} active={!!boat[a.key]} />
        ))}
      </View>
    </View>
  );
}

export default memo(BoatDetailAmenities);

const s = StyleSheet.create({
  block: { paddingHorizontal: 24, paddingVertical: 20, gap: 14 },
  title: { fontSize: 18, fontWeight: "500", color: "#000" },
  list: { gap: 4 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  label: { fontSize: 14, color: "#222" },
  labelInactive: { color: "#AAAAAA" },
});
