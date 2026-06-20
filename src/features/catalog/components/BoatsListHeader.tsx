// features/catalog/components/BoatsListHeader.tsx

import { ArrowUpDown, ChevronDown, LayoutList, Map } from "lucide-react-native";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { COLORS } from "@/shared/colors";
import { Spinner } from "@/shared/components/Spinner";
import { TYPE_CHIPS } from "../constants";
import { DEFAULT, Filters } from "../types";
import { ruFmt } from "../utils/filterUtils";
import { DateStrip } from "./DateStrip";
import { FilterSection } from "./FilterMiniSheet";

export type SortBy = "popular" | "price_asc" | "price_desc";

const SORT_OPTS: { key: SortBy; label: string }[] = [
  { key: "popular", label: "По популярности" },
  { key: "price_asc", label: "Цена ↑" },
  { key: "price_desc", label: "Цена ↓" },
];

interface Props {
  filters: Filters;
  setFilters: (f: Filters | ((prev: Filters) => Filters)) => void;
  onDateSelect: (date: Date | null) => void;
  onOpenFilter: (section: FilterSection) => void;
  viewMode: "list" | "map";
  setView: (mode: "list" | "map") => void;
  filteredCount: number;
  total: number;
  availLoading: boolean;
  sortBy: SortBy;
  onSortChange: (s: SortBy) => void;
}

export const BoatsListHeader: React.FC<Props> = ({
  filters,
  setFilters,
  onDateSelect,
  onOpenFilter,
  viewMode,
  setView,
  filteredCount,
  total,
  availLoading,
  sortBy,
  onSortChange,
}) => {
  const cycleSortBy = () => {
    const idx = SORT_OPTS.findIndex((o) => o.key === sortBy);
    onSortChange(SORT_OPTS[(idx + 1) % SORT_OPTS.length].key);
  };

  const sortActive = sortBy !== "popular";
  const typeActive = filters.typeId !== "all";
  const priceActive = filters.priceMin !== null || filters.priceMax !== null;
  const capActive = filters.capacityMin !== null;
  const amenActive = filters.hasTarp || filters.hasToilet || filters.hasHeating;
  const durActive =
    filters.dateTime.durationHours !== DEFAULT.dateTime.durationHours;

  const typeLabel = typeActive
    ? (TYPE_CHIPS.find((c) => c.id === filters.typeId)?.label ?? "Тип")
    : "Тип";

  const priceLabel = priceActive
    ? filters.priceMin !== null && filters.priceMax !== null
      ? `${ruFmt(filters.priceMin)}–${ruFmt(filters.priceMax)} ₽`
      : filters.priceMax !== null
        ? `до ${ruFmt(filters.priceMax)} ₽`
        : `от ${ruFmt(filters.priceMin!)} ₽`
    : "Цена";

  const capLabel = capActive ? `от ${filters.capacityMin} чел.` : "Вместимость";

  const amenLabel = amenActive
    ? [
        filters.hasTarp && "Тент",
        filters.hasToilet && "Туалет",
        filters.hasHeating && "Отопл.",
      ]
        .filter(Boolean)
        .join(" · ")
    : "Удобства";

  const durH = filters.dateTime.durationHours;
  const durLabel = durActive
    ? durH === 1
      ? "1 час"
      : durH < 5
        ? `${durH} часа`
        : `${durH} часов`
    : "Продолжительность";

  return (
    <View>
      <DateStrip selected={filters.dateTime.date} onSelect={onDateSelect} />

      {/* ── Gorbilet-style filter chips ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filterStrip}
      >
        {/* Sort */}
        <Pressable
          style={[s.fChip, sortActive && s.fChipOn]}
          onPress={cycleSortBy}
        >
          <ArrowUpDown
            size={12}
            color={sortActive ? COLORS.white : COLORS.brandNavy}
            strokeWidth={2.5}
          />
          <Text style={[s.fChipTxt, sortActive && s.fChipTxtOn]}>
            {SORT_OPTS.find((o) => o.key === sortBy)?.label}
          </Text>
        </Pressable>

        {/* Type */}
        <Pressable
          style={[s.fChip, typeActive && s.fChipOn]}
          onPress={() => onOpenFilter("type")}
        >
          <Text style={[s.fChipTxt, typeActive && s.fChipTxtOn]}>
            {typeLabel}
          </Text>
          {!typeActive && (
            <ChevronDown size={12} color={COLORS.brandNavy} strokeWidth={2.5} />
          )}
        </Pressable>

        {/* Price */}
        <Pressable
          style={[s.fChip, priceActive && s.fChipOn]}
          onPress={() => onOpenFilter("price")}
        >
          <Text style={[s.fChipTxt, priceActive && s.fChipTxtOn]}>
            {priceLabel}
          </Text>
          {!priceActive && (
            <ChevronDown size={12} color={COLORS.brandNavy} strokeWidth={2.5} />
          )}
        </Pressable>

        {/* Capacity */}
        <Pressable
          style={[s.fChip, capActive && s.fChipOn]}
          onPress={() => onOpenFilter("capacity")}
        >
          <Text style={[s.fChipTxt, capActive && s.fChipTxtOn]}>
            {capLabel}
          </Text>
          {!capActive && (
            <ChevronDown size={12} color={COLORS.brandNavy} strokeWidth={2.5} />
          )}
        </Pressable>

        {/* Amenities */}
        <Pressable
          style={[s.fChip, amenActive && s.fChipOn]}
          onPress={() => onOpenFilter("amenities")}
        >
          <Text style={[s.fChipTxt, amenActive && s.fChipTxtOn]}>
            {amenLabel}
          </Text>
          {!amenActive && (
            <ChevronDown size={12} color={COLORS.brandNavy} strokeWidth={2.5} />
          )}
        </Pressable>

        {/* Duration */}
        <Pressable
          style={[s.fChip, durActive && s.fChipOn]}
          onPress={() => onOpenFilter("duration")}
        >
          <Text style={[s.fChipTxt, durActive && s.fChipTxtOn]}>
            {durLabel}
          </Text>
          {!durActive && (
            <ChevronDown size={12} color={COLORS.brandNavy} strokeWidth={2.5} />
          )}
        </Pressable>
      </ScrollView>

      {/* ── Counter + view toggle ── */}
      <View style={s.barRow}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={s.counter}>{ruFmt(filteredCount)} судов</Text>
          {availLoading && <Spinner size={20} />}
        </View>
        <View style={s.toggle}>
          {(["list", "map"] as const).map((m) => (
            <Pressable
              key={m}
              style={[s.tBtn, viewMode === m && s.tBtnOn]}
              onPress={() => setView(m)}
            >
              {m === "list" ? (
                <LayoutList
                  size={14}
                  color={viewMode === m ? COLORS.brandNavy : COLORS.text3}
                  strokeWidth={2}
                />
              ) : (
                <Map
                  size={14}
                  color={viewMode === m ? COLORS.brandNavy : COLORS.text3}
                  strokeWidth={2}
                />
              )}
              <Text style={[s.tTxt, viewMode === m && s.tTxtOn]}>
                {m === "list" ? "Список" : "Карта"}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  filterStrip: {
    paddingVertical: 8,
    gap: 8,
    alignItems: "center",
  },
  fChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.greyLight2,
  },
  fChipOn: { backgroundColor: COLORS.brandNavy, borderColor: COLORS.brandNavy },
  fChipTxt: { fontSize: 13, fontWeight: "500", color: COLORS.brandNavy },
  fChipTxtOn: { color: COLORS.white, fontWeight: "600" },

  // ── Counter + toggle ──
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
});
