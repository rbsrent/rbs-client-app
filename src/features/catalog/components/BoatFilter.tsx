// features/catalog/components/BoatFilter.tsx

import { BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react-native";
import React, { useRef } from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { COLORS } from "@/shared/colors";
import { SheetBackdrop } from "@/shared/components/SheetBackdrop";
import {
  AMENITIES,
  CAPACITY_OPTS,
  DURATION_OPTS,
  PRICE_PRESETS,
  TIME_OPTS,
} from "../constants";
import { DEFAULT, Filters } from "../types";
import { dtSummary, durLabel, fmtHour } from "../utils/filterUtils";
import { CalendarPicker } from "./CalendarPicker";

const { width: SCREEN_W } = Dimensions.get("window");

interface BoatFilterProps {
  modalRef: React.MutableRefObject<BottomSheetModal | null>;
  draft: Filters;
  onDraftChange: (newDraft: Filters) => void;
  onApply: () => void;
  onResetAll: () => void;
  filteredCount: number;
}

export const BoatFilter: React.FC<BoatFilterProps> = ({
  modalRef,
  draft,
  onDraftChange,
  onApply,
  onResetAll,
  filteredCount,
}) => {
  const insets = useSafeAreaInsets();

  const slideAnim = useRef(new Animated.Value(0)).current;

  const goToDateTime = () =>
    Animated.spring(slideAnim, {
      toValue: -SCREEN_W,
      useNativeDriver: true,
      tension: 68,
      friction: 12,
    }).start();

  const goToMain = () =>
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 68,
      friction: 12,
    }).start();

  // Helper untuk preset harga
  const setPricePreset = (min: number | null, max: number | null) => {
    onDraftChange({ ...draft, priceMin: min, priceMax: max });
  };
  const matchesPreset = (min: number | null, max: number | null) =>
    draft.priceMin === min && draft.priceMax === max;

  // Fungsi untuk reset semua (draft ke default, lalu panggil onResetAll)
  const handleResetAll = () => {
    onDraftChange(DEFAULT); // reset draft ke default
    onResetAll(); // parent akan reset filters & search dan tutup sheet
  };

  return (
    <BottomSheetModal
      ref={modalRef}
      snapPoints={["75%", "95%"]}
      enablePanDownToClose
      backdropComponent={SheetBackdrop}
      backgroundStyle={s.sheetBg}
      handleComponent={() => (
        <View style={s.handleWrap}>
          <View style={s.handle} />
        </View>
      )}
      onDismiss={() => slideAnim.setValue(0)}
    >
      <BottomSheetScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ overflow: "hidden", width: SCREEN_W }}>
          <Animated.View
            style={{
              flexDirection: "row",
              width: SCREEN_W * 2,
              transform: [{ translateX: slideAnim }],
            }}
          >
            {/* Halaman Filter */}
            <View style={[s.panel, { paddingBottom: insets.bottom + 16 }]}>
              <View style={s.sheetHeader}>
                <Text style={s.sheetTitle}>Фильтры</Text>
                <Pressable onPress={() => onDraftChange(DEFAULT)} hitSlop={8}>
                  <Text style={s.sheetResetTxt}>Сбросить</Text>
                </Pressable>
              </View>

              <Text style={s.sheetSec}>Дата и время</Text>
              <Pressable style={s.dtRow} onPress={goToDateTime}>
                <View style={s.dtLeft}>
                  <View style={s.dtIconWrap}>
                    <Calendar
                      size={18}
                      color={COLORS.brandNavy}
                      strokeWidth={1.8}
                    />
                  </View>
                  <View>
                    <Text style={s.dtMain}>{dtSummary(draft.dateTime)}</Text>
                    <Text style={s.dtSub}>Нажмите для выбора</Text>
                  </View>
                </View>
                <ChevronRight size={18} color={COLORS.text3} strokeWidth={2} />
              </Pressable>

              <Text style={s.sheetSec}>Мин. вместимость (гостей)</Text>
              <View style={s.optRow}>
                {CAPACITY_OPTS.map((n) => {
                  const on = draft.capacityMin === (n ?? null);
                  return (
                    <Pressable
                      key={String(n)}
                      style={[s.optChip, on && s.optChipOn]}
                      onPress={() =>
                        onDraftChange({
                          ...draft,
                          capacityMin: n ?? null,
                        })
                      }
                    >
                      <Text style={[s.optTxt, on && s.optTxtOn]}>
                        {n === null ? "Любая" : n === 11 ? "11+" : String(n)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={s.sheetSec}>Цена за час (₽)</Text>
              <View style={s.priceRow}>
                <View style={s.priceInputWrap}>
                  <Text style={s.priceLabel}>от</Text>
                  <TextInput
                    style={s.priceInput}
                    placeholder="0"
                    placeholderTextColor={COLORS.text3}
                    keyboardType="numeric"
                    value={
                      draft.priceMin !== null ? String(draft.priceMin) : ""
                    }
                    onChangeText={(v) =>
                      onDraftChange({
                        ...draft,
                        priceMin: v ? Number(v) : null,
                      })
                    }
                  />
                </View>
                <View style={s.priceDash} />
                <View style={s.priceInputWrap}>
                  <Text style={s.priceLabel}>до</Text>
                  <TextInput
                    style={s.priceInput}
                    placeholder="∞"
                    placeholderTextColor={COLORS.text3}
                    keyboardType="numeric"
                    value={
                      draft.priceMax !== null ? String(draft.priceMax) : ""
                    }
                    onChangeText={(v) =>
                      onDraftChange({
                        ...draft,
                        priceMax: v ? Number(v) : null,
                      })
                    }
                  />
                </View>
              </View>
              <View style={[s.optRow, { marginBottom: 4 }]}>
                {PRICE_PRESETS.map((p) => {
                  const on = matchesPreset(p.min, p.max);
                  return (
                    <Pressable
                      key={p.label}
                      style={[s.optChip, on && s.optChipOn]}
                      onPress={() =>
                        on
                          ? setPricePreset(null, null)
                          : setPricePreset(p.min, p.max)
                      }
                    >
                      <Text style={[s.optTxt, on && s.optTxtOn]}>
                        {p.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={s.sheetSec}>Удобства</Text>
              {AMENITIES.map(({ key, label }) => (
                <View key={key} style={s.switchRow}>
                  <Text style={s.switchLabel}>{label}</Text>
                  <Switch
                    value={draft[key]}
                    onValueChange={(v) => onDraftChange({ ...draft, [key]: v })}
                    trackColor={{
                      false: COLORS.border,
                      true: COLORS.brandNavy + "70",
                    }}
                    thumbColor={draft[key] ? COLORS.brandNavy : "#f0f0f0"}
                  />
                </View>
              ))}

              <View style={s.sheetFooter}>
                <Pressable style={s.footerReset} onPress={handleResetAll}>
                  <Text style={s.footerResetTxt}>Сбросить</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    s.footerApply,
                    pressed && { opacity: 0.88 },
                  ]}
                  onPress={() => {
                    onApply(); // parent menerapkan draft ke filters
                    modalRef.current?.dismiss();
                  }}
                >
                  <Text style={s.footerApplyTxt}>
                    Показать суда
                    {filteredCount > 0 ? ` (${filteredCount})` : ""}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Halaman Pilih Tanggal & Waktu */}
            <View style={[s.panel, { paddingBottom: insets.bottom + 16 }]}>
              <View style={s.dtPageHeader}>
                <Pressable onPress={goToMain} style={s.dtBackBtn} hitSlop={10}>
                  <ChevronLeft
                    size={20}
                    color={COLORS.brandNavy}
                    strokeWidth={2}
                  />
                </Pressable>
                <Text style={s.sheetTitle}>Дата и время</Text>
                <View style={{ width: 36 }} />
              </View>

              <CalendarPicker
                selected={draft.dateTime.date}
                onSelect={(date) =>
                  onDraftChange({
                    ...draft,
                    dateTime: { ...draft.dateTime, date },
                  })
                }
              />

              <Text style={[s.sheetSec, { marginTop: 20 }]}>Время начала</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
                decelerationRate="fast"
              >
                {TIME_OPTS.map((h) => {
                  const on = draft.dateTime.startHour === h;
                  return (
                    <Pressable
                      key={h}
                      style={[s.optChip, on && s.optChipOn]}
                      onPress={() =>
                        onDraftChange({
                          ...draft,
                          dateTime: { ...draft.dateTime, startHour: h },
                        })
                      }
                    >
                      <Text style={[s.optTxt, on && s.optTxtOn]}>
                        {fmtHour(h)}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <Text style={[s.sheetSec, { marginTop: 20 }]}>
                Продолжительность
              </Text>
              <View style={s.optRow}>
                {DURATION_OPTS.map((h) => {
                  const on = draft.dateTime.durationHours === h;
                  return (
                    <Pressable
                      key={h}
                      style={[s.optChip, on && s.optChipOn]}
                      onPress={() =>
                        onDraftChange({
                          ...draft,
                          dateTime: { ...draft.dateTime, durationHours: h },
                        })
                      }
                    >
                      <Text style={[s.optTxt, on && s.optTxtOn]}>
                        {durLabel(h)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={s.hint}>
                <Text style={s.hintTxt}>
                  💡 Выберите дату и время для проверки доступности
                </Text>
              </View>

              <Pressable
                style={({ pressed }) => [
                  s.footerApply,
                  { marginTop: 20 },
                  pressed && { opacity: 0.88 },
                ]}
                onPress={goToMain}
              >
                <Text style={s.footerApplyTxt}>Готово</Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
};

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  filterBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBtnActive: { backgroundColor: COLORS.brandNavy },
  filterBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.brandCyan,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadgeTxt: { fontSize: 9, fontWeight: "800", color: COLORS.white },

  overlayWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
  },
  overlayInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingBottom: 10,
    backgroundColor: COLORS.white,
  },
  overlaySearchWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: COLORS.backgroundAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  overlaySearchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text1,
    padding: 0,
  },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.text1, padding: 0 },

  chipStrip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    alignItems: "center",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipOn: { backgroundColor: COLORS.brandNavy, borderColor: COLORS.brandNavy },
  chipTxt: { fontSize: 13, fontWeight: "500", color: COLORS.text2 },
  chipTxtOn: { color: COLORS.white, fontWeight: "600" },
  sep: {
    width: 1,
    height: 18,
    backgroundColor: COLORS.border,
    marginHorizontal: 2,
  },

  tagStrip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    alignItems: "center",
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: COLORS.brandNavy + "12",
    borderWidth: 1,
    borderColor: COLORS.brandNavy + "28",
  },
  tagTxt: { fontSize: 12, fontWeight: "600", color: COLORS.brandNavy },
  resetBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: COLORS.muted,
  },
  resetTxt: { fontSize: 12, fontWeight: "600", color: COLORS.text3 },

  barRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  counter: { fontSize: 13, fontWeight: "600", color: COLORS.text2 },
  toggle: {
    flexDirection: "row",
    gap: 2,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
  },
  tBtnOn: { backgroundColor: COLORS.brandNavy + "14" },
  tTxt: { fontSize: 12, color: COLORS.text3, fontWeight: "500" },
  tTxtOn: { color: COLORS.brandNavy, fontWeight: "600" },

  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { gap: 12, paddingHorizontal: 16 },
  empty: { paddingTop: 80, alignItems: "center", gap: 12 },
  emptyTxt: { fontSize: 15, color: COLORS.text3 },
  emptyBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.brandNavy,
  },
  emptyBtnTxt: { fontSize: 14, fontWeight: "700", color: COLORS.white },

  sheetBg: { backgroundColor: COLORS.white, borderRadius: 20 },
  handleWrap: { paddingTop: 12, paddingBottom: 2, alignItems: "center" },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
  },
  panel: { width: SCREEN_W, paddingHorizontal: 20, paddingTop: 6 },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  sheetTitle: { fontSize: 18, fontWeight: "800", color: COLORS.text1 },
  sheetResetTxt: { fontSize: 14, fontWeight: "600", color: COLORS.brandCyan },
  sheetSec: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.text3,
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: 10,
    marginTop: 18,
  },
  dtRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: COLORS.backgroundAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dtLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  dtIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.brandNavy + "12",
  },
  dtMain: { fontSize: 14, fontWeight: "600", color: COLORS.text1 },
  dtSub: { fontSize: 12, color: COLORS.text3, marginTop: 1 },
  dtPageHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  dtBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  optRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  optChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  optChipOn: {
    backgroundColor: COLORS.brandNavy,
    borderColor: COLORS.brandNavy,
  },
  optTxt: { fontSize: 13, fontWeight: "500", color: COLORS.text2 },
  optTxtOn: { color: COLORS.white, fontWeight: "600" },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  priceInputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: COLORS.backgroundAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  priceLabel: { fontSize: 13, color: COLORS.text3, fontWeight: "500" },
  priceInput: { flex: 1, fontSize: 14, color: COLORS.text1, padding: 0 },
  priceDash: {
    width: 12,
    height: 1.5,
    backgroundColor: COLORS.text3,
    borderRadius: 1,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  switchLabel: { fontSize: 15, color: COLORS.text1 },
  sheetFooter: { flexDirection: "row", gap: 12, marginTop: 24 },
  footerReset: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.backgroundAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  footerResetTxt: { fontSize: 15, fontWeight: "600", color: COLORS.text2 },
  footerApply: {
    flex: 2,
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.brandNavy,
  },
  footerApplyTxt: { fontSize: 15, fontWeight: "700", color: COLORS.white },
  hint: {
    marginTop: 20,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#FFF8E1",
    borderWidth: 1,
    borderColor: "#FFE082",
  },
  hintTxt: { fontSize: 13, color: "#795548", lineHeight: 18 },
});
