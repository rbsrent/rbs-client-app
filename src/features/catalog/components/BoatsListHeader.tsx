import {
  ArrowUpDown,
  ChevronDown,
  LayoutList,
  Map,
  X,
} from "lucide-react-native";
import React, { useEffect, useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInLeft,
  FadeOut,
  FadeOutLeft,
  LinearTransition,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

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

const TIMING       = { duration: 280, easing: Easing.inOut(Easing.ease) };
const ENTER_CFG    = FadeInLeft.duration(280).easing(Easing.inOut(Easing.ease));
const EXIT_CFG     = FadeOutLeft.duration(280).easing(Easing.inOut(Easing.ease));
const LAY_CFG      = LinearTransition.duration(280).easing(Easing.inOut(Easing.ease));
const CHEV_IN_CFG  = FadeIn.duration(200);
const CHEV_OUT_CFG = FadeOut.duration(200);

const AnimPressable = Animated.createAnimatedComponent(Pressable);

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
  const anyActive =
    sortActive ||
    typeActive ||
    priceActive ||
    capActive ||
    amenActive ||
    durActive;

  const clearAll = () => {
    setFilters(DEFAULT);
    onSortChange("popular");
  };

  // ── Shared values per chip ──
  const sortP = useSharedValue(sortActive ? 1 : 0);
  const typeP = useSharedValue(typeActive ? 1 : 0);
  const priceP = useSharedValue(priceActive ? 1 : 0);
  const capP = useSharedValue(capActive ? 1 : 0);
  const amenP = useSharedValue(amenActive ? 1 : 0);
  const durP = useSharedValue(durActive ? 1 : 0);

  useEffect(() => {
    sortP.value = withTiming(sortActive ? 1 : 0, TIMING);
  }, [sortActive]);
  useEffect(() => {
    typeP.value = withTiming(typeActive ? 1 : 0, TIMING);
  }, [typeActive]);
  useEffect(() => {
    priceP.value = withTiming(priceActive ? 1 : 0, TIMING);
  }, [priceActive]);
  useEffect(() => {
    capP.value = withTiming(capActive ? 1 : 0, TIMING);
  }, [capActive]);
  useEffect(() => {
    amenP.value = withTiming(amenActive ? 1 : 0, TIMING);
  }, [amenActive]);
  useEffect(() => {
    durP.value = withTiming(durActive ? 1 : 0, TIMING);
  }, [durActive]);

  // Background color for each chip
  const sortBgS = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      sortP.value,
      [0, 1],
      [COLORS.greyLight2, COLORS.brandNavy],
    ),
  }));
  const typeBgS = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      typeP.value,
      [0, 1],
      [COLORS.greyLight2, COLORS.brandNavy],
    ),
  }));
  const priceBgS = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      priceP.value,
      [0, 1],
      [COLORS.greyLight2, COLORS.brandNavy],
    ),
  }));
  const capBgS = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      capP.value,
      [0, 1],
      [COLORS.greyLight2, COLORS.brandNavy],
    ),
  }));
  const amenBgS = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      amenP.value,
      [0, 1],
      [COLORS.greyLight2, COLORS.brandNavy],
    ),
  }));
  const durBgS = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      durP.value,
      [0, 1],
      [COLORS.greyLight2, COLORS.brandNavy],
    ),
  }));

  // Text color for each chip
  const sortTxtS = useAnimatedStyle(() => ({
    color: interpolateColor(
      sortP.value,
      [0, 1],
      [COLORS.brandNavy, COLORS.white],
    ),
  }));
  const typeTxtS = useAnimatedStyle(() => ({
    color: interpolateColor(
      typeP.value,
      [0, 1],
      [COLORS.brandNavy, COLORS.white],
    ),
  }));
  const priceTxtS = useAnimatedStyle(() => ({
    color: interpolateColor(
      priceP.value,
      [0, 1],
      [COLORS.brandNavy, COLORS.white],
    ),
  }));
  const capTxtS = useAnimatedStyle(() => ({
    color: interpolateColor(
      capP.value,
      [0, 1],
      [COLORS.brandNavy, COLORS.white],
    ),
  }));
  const amenTxtS = useAnimatedStyle(() => ({
    color: interpolateColor(
      amenP.value,
      [0, 1],
      [COLORS.brandNavy, COLORS.white],
    ),
  }));
  const durTxtS = useAnimatedStyle(() => ({
    color: interpolateColor(
      durP.value,
      [0, 1],
      [COLORS.brandNavy, COLORS.white],
    ),
  }));

  // ── Sorted filter chip order: active first, then inactive ──
  const sortedFilterKeys = useMemo(() => {
    const all = ['type', 'price', 'capacity', 'amenities', 'duration'] as const;
    const isActive = { type: typeActive, price: priceActive, capacity: capActive, amenities: amenActive, duration: durActive };
    return [
      ...all.filter((k) => isActive[k]),
      ...all.filter((k) => !isActive[k]),
    ];
  }, [typeActive, priceActive, capActive, amenActive, durActive]);

  // ── Labels ──
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
        {/* X button — slides in from left, slides out to left */}
        {anyActive && (
          <Animated.View
            entering={ENTER_CFG}
            exiting={EXIT_CFG}
            layout={LAY_CFG}
          >
            <Pressable style={s.fChipClear} onPress={clearAll} hitSlop={6}>
              <X size={12} color={COLORS.white} strokeWidth={2.5} />
            </Pressable>
          </Animated.View>
        )}

        {/* Sort chip — always fixed first (never reorders) */}
        <AnimPressable key="sort" style={[s.fChip, sortBgS]} onPress={cycleSortBy} layout={LAY_CFG}>
          <ArrowUpDown size={12} color={sortActive ? COLORS.white : COLORS.brandNavy} strokeWidth={2.5} />
          <Animated.Text style={[s.fChipTxt, sortTxtS]} layout={LAY_CFG}>
            {SORT_OPTS.find((o) => o.key === sortBy)?.label}
          </Animated.Text>
        </AnimPressable>

        {/* Filter chips — active ones float to front, layout animates position */}
        {sortedFilterKeys.map((k) => {
          switch (k) {
            case 'type':
              return (
                <AnimPressable key="type" style={[s.fChip, typeBgS]} onPress={() => onOpenFilter('type')} layout={LAY_CFG}>
                  <Animated.Text style={[s.fChipTxt, typeTxtS]} layout={LAY_CFG}>{typeLabel}</Animated.Text>
                  {!typeActive && (
                    <Animated.View entering={CHEV_IN_CFG} exiting={CHEV_OUT_CFG}>
                      <ChevronDown size={12} color={COLORS.brandNavy} strokeWidth={2.5} />
                    </Animated.View>
                  )}
                </AnimPressable>
              );
            case 'price':
              return (
                <AnimPressable key="price" style={[s.fChip, priceBgS]} onPress={() => onOpenFilter('price')} layout={LAY_CFG}>
                  <Animated.Text style={[s.fChipTxt, priceTxtS]} layout={LAY_CFG}>{priceLabel}</Animated.Text>
                  {!priceActive && (
                    <Animated.View entering={CHEV_IN_CFG} exiting={CHEV_OUT_CFG}>
                      <ChevronDown size={12} color={COLORS.brandNavy} strokeWidth={2.5} />
                    </Animated.View>
                  )}
                </AnimPressable>
              );
            case 'capacity':
              return (
                <AnimPressable key="capacity" style={[s.fChip, capBgS]} onPress={() => onOpenFilter('capacity')} layout={LAY_CFG}>
                  <Animated.Text style={[s.fChipTxt, capTxtS]} layout={LAY_CFG}>{capLabel}</Animated.Text>
                  {!capActive && (
                    <Animated.View entering={CHEV_IN_CFG} exiting={CHEV_OUT_CFG}>
                      <ChevronDown size={12} color={COLORS.brandNavy} strokeWidth={2.5} />
                    </Animated.View>
                  )}
                </AnimPressable>
              );
            case 'amenities':
              return (
                <AnimPressable key="amenities" style={[s.fChip, amenBgS]} onPress={() => onOpenFilter('amenities')} layout={LAY_CFG}>
                  <Animated.Text style={[s.fChipTxt, amenTxtS]} layout={LAY_CFG}>{amenLabel}</Animated.Text>
                  {!amenActive && (
                    <Animated.View entering={CHEV_IN_CFG} exiting={CHEV_OUT_CFG}>
                      <ChevronDown size={12} color={COLORS.brandNavy} strokeWidth={2.5} />
                    </Animated.View>
                  )}
                </AnimPressable>
              );
            case 'duration':
              return (
                <AnimPressable key="duration" style={[s.fChip, durBgS]} onPress={() => onOpenFilter('duration')} layout={LAY_CFG}>
                  <Animated.Text style={[s.fChipTxt, durTxtS]} layout={LAY_CFG}>{durLabel}</Animated.Text>
                  {!durActive && (
                    <Animated.View entering={CHEV_IN_CFG} exiting={CHEV_OUT_CFG}>
                      <ChevronDown size={12} color={COLORS.brandNavy} strokeWidth={2.5} />
                    </Animated.View>
                  )}
                </AnimPressable>
              );
          }
        })}
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
    paddingHorizontal: 16,
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
  },
  fChipTxt: { fontSize: 13, fontWeight: "500" },
  fChipClear: {
    width: 32,
    height: 32,
    borderRadius: 17,
    backgroundColor: COLORS.brandNavy,
    alignItems: "center",
    justifyContent: "center",
  },

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
