import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import React, { useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { COLORS } from "@/shared/colors";
import { SheetBackdrop } from "@/shared/components/SheetBackdrop";
import { Spinner } from "@/shared/components/Spinner";
import { TIME_OPTS } from "../constants";
import { fmtHour } from "../utils/filterUtils";

interface TimeSelectSheetProps {
  modalRef: React.MutableRefObject<BottomSheetModal | null>;
  selected: number;
  onSelect: (hour: number) => void;
  availableHours: Record<number, boolean> | null;
  loading?: boolean;
}

const COLS = 4;

export const TimeSelectSheet: React.FC<TimeSelectSheetProps> = ({
  modalRef,
  selected,
  onSelect,
  availableHours,
  loading = false,
}) => {
  const insets = useSafeAreaInsets();

  const handlePick = useCallback(
    (h: number) => {
      onSelect(h);
      modalRef.current?.dismiss();
    },
    [onSelect, modalRef],
  );

  return (
    <BottomSheetModal
      ref={modalRef}
      snapPoints={["55%"]}
      enablePanDownToClose
      backdropComponent={SheetBackdrop}
      backgroundStyle={s.sheetBg}
      handleComponent={() => (
        <View style={s.handleWrap}>
          <View style={s.handle} />
        </View>
      )}
    >
      <BottomSheetView style={[s.content, { paddingBottom: insets.bottom + 16 }]}>
        <Text style={s.title}>Время начала</Text>
        {loading ? (
          <View style={s.loaderBox}>
            <Spinner size={28} />
          </View>
        ) : (
          <View style={s.grid}>
            {TIME_OPTS.map((h) => {
              const on = selected === h;
              const off = availableHours !== null && availableHours[h] === false;
              return (
                <Pressable
                  key={h}
                  style={[s.cell, on && s.cellOn, off && s.cellOff]}
                  onPress={() => !off && handlePick(h)}
                  disabled={off}
                >
                  <Text style={[s.cellTxt, on && s.cellTxtOn, off && s.cellTxtOff]}>
                    {fmtHour(h)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </BottomSheetView>
    </BottomSheetModal>
  );
};

const s = StyleSheet.create({
  sheetBg: { backgroundColor: COLORS.white, borderRadius: 20 },
  handleWrap: { paddingTop: 12, paddingBottom: 2, alignItems: "center" },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.border },
  content: { paddingHorizontal: 20, paddingTop: 4 },
  title: { fontSize: 18, fontWeight: "500", color: COLORS.text1, marginBottom: 16 },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  loaderBox: { height: 46 * 6 + 10 * 5, alignItems: "center", justifyContent: "center" },
  cell: {
    width: `${100 / COLS - 3}%`,
    height: 46,
    borderRadius: 10,
    backgroundColor: COLORS.greyLight2,
    alignItems: "center",
    justifyContent: "center",
  },
  cellOn: { backgroundColor: COLORS.brandNavy },
  cellOff: { opacity: 0.35 },
  cellTxt: { fontSize: 14, fontWeight: "600", color: COLORS.brandNavy },
  cellTxtOn: { color: COLORS.white },
  cellTxtOff: { color: COLORS.text3 },
});
