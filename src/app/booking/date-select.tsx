import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Check, ChevronRight, Clock } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
} from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { computeSlotSelection } from "@/features/booking/utils";
import { DURATION_OPTS } from "@/features/catalog/constants";
import { buildBoatH1 } from "@/features/catalog/hooks/useBoatDetail";
import { COLORS } from "@/shared/colors";
import { CalendarPicker } from "@/shared/components/CalendarPicker";
import { Spinner } from "@/shared/components/Spinner";
import { publicSupabase } from "@/shared/supabase/publicClient";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const EXPAND_CONFIG = {
  duration: 320,
  create: { type: LayoutAnimation.Types.spring, property: LayoutAnimation.Properties.scaleXY, springDamping: 0.85 },
  update: { type: LayoutAnimation.Types.spring, springDamping: 0.85 },
  delete: { type: LayoutAnimation.Types.easeOut, property: LayoutAnimation.Properties.opacity },
};
const COLLAPSE_CONFIG = {
  duration: 240,
  create: { type: LayoutAnimation.Types.easeOut, property: LayoutAnimation.Properties.opacity },
  update: { type: LayoutAnimation.Types.easeInEaseOut },
  delete: { type: LayoutAnimation.Types.easeOut, property: LayoutAnimation.Properties.opacity },
};

const MONTHS_S = [
  "янв",
  "фев",
  "мар",
  "апр",
  "май",
  "июн",
  "июл",
  "авг",
  "сен",
  "окт",
  "ноя",
  "дек",
];
const DAYS_S = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];

function fmtDateShort(d: Date) {
  return `${d.getDate()} ${MONTHS_S[d.getMonth()]}, ${DAYS_S[d.getDay()]}`;
}
function fmtHour(h: number) {
  return `${String(h % 24).padStart(2, "0")}:00`;
}
function fmtTimeLabel(h: number) {
  return h >= 24 ? `${fmtHour(h)} +1` : fmtHour(h);
}
function durLabel(h: number) {
  return h === 1 ? "1 час" : h < 5 ? `${h} часа` : `${h} часов`;
}

const COLS = 4;
const EXTRA_HOURS = 6; // allow booking up to 06:00 next day
const TOTAL_HOURS = 24 + EXTRA_HOURS;

export default function DateSelectScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    boatId,
    date: dateParam,
    time: timeParam,
    duration: durationParam,
    boatName: boatNameParam,
    pierName: pierNameParam,
    pierAddress: pierAddressParam,
  } = useLocalSearchParams<{
    boatId: string;
    date?: string;
    time?: string;
    duration?: string;
    boatName?: string;
    pierName?: string;
    pierAddress?: string;
  }>();

  const [date, setDate] = useState<Date>(() => {
    if (dateParam) {
      const d = new Date(dateParam);
      if (!isNaN(d.getTime())) {
        d.setHours(0, 0, 0, 0);
        return d;
      }
    }
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const [minDuration, setMinDuration] = useState(1);
  const [selectedDuration, setSelectedDuration] = useState(
    durationParam ? parseInt(durationParam, 10) : 2,
  );
  const [busyHours, setBusyHours] = useState<Set<number>>(new Set());
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedHours, setSelectedHours] = useState<number[]>([]);
  const [boatName, setBoatName] = useState<string | null>(
    boatNameParam ?? null,
  );
  const [pierName, setPierName] = useState<string | null>(
    pierNameParam ?? null,
  );
  const [pierAddress, setPierAddress] = useState<string | null>(
    pierAddressParam ?? null,
  );

  // Section stays open — time already chosen on the catalog screen shows up
  // pre-highlighted in the grid/duration chips instead of being tucked away
  // behind a summary pill. Collapse is still available (tap to re-pick).
  const [timeOpen, setTimeOpen] = useState(true);
  const prefillRef = useRef(
    timeParam
      ? {
          hour: parseInt(timeParam, 10),
          duration: durationParam ? parseInt(durationParam, 10) : 2,
        }
      : null,
  );

  // Fetch boat name + pier (silent background update; params already pre-fill UI)
  useEffect(() => {
    if (!boatId) return;
    void (async () => {
      try {
        const { data } = await publicSupabase
          .from("boats")
          .select("name, seo_h1, seo_name_ru, type, piers(name, address)")
          .eq("id", boatId)
          .single();
        if (data) {
          setBoatName(buildBoatH1(data as any));
          const pier = (data as any).piers;
          if (pier) {
            setPierName(pier.name ?? null);
            setPierAddress(pier.address ?? null);
            return;
          }
        }
        // fallback: boat_pier_assignments (many-to-many)
        const { data: asgn } = await publicSupabase
          .from("boat_pier_assignments")
          .select("piers(name, address)")
          .eq("boat_id", boatId)
          .limit(1)
          .single();
        const p = (asgn as any)?.piers;
        if (p) {
          setPierName(p.name ?? null);
          setPierAddress(p.address ?? null);
        }
      } catch {}
    })();
  }, [boatId]);

  // Fetch min_duration_hours separately (column may not exist yet)
  useEffect(() => {
    if (!boatId) return;
    void (async () => {
      try {
        const { data, error } = await publicSupabase
          .from("boats")
          .select("min_duration_hours")
          .eq("id", boatId)
          .single();
        if (!error && data?.min_duration_hours) {
          setMinDuration(data.min_duration_hours);
          setSelectedDuration((d) => Math.max(d, data.min_duration_hours));
        }
      } catch {}
    })();
  }, [boatId]);

  // Fetch busy slots whenever date changes
  useEffect(() => {
    if (!boatId) return;
    let cancelled = false;
    setSlotsLoading(true);
    setBusyHours(new Set());
    setSelectedHours([]);

    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const rangeEnd = new Date(dayStart.getTime() + TOTAL_HOURS * 3600_000);

    void (async () => {
      try {
        const { data } = await publicSupabase.rpc("get_boat_busy_slots", {
          p_boat_id: boatId,
          p_start_datetime: dayStart.toISOString(),
          p_end_datetime: rangeEnd.toISOString(),
        });
        if (cancelled) return;
        const busy = new Set<number>();
        const dayStartMs = dayStart.getTime();
        (data ?? []).forEach(
          (slot: { start_datetime: string; end_datetime: string }) => {
            const sMs = new Date(slot.start_datetime).getTime();
            const eMs = new Date(slot.end_datetime).getTime();
            const startH = Math.floor((sMs - dayStartMs) / 3_600_000);
            const endH = Math.floor((eMs - dayStartMs) / 3_600_000);
            for (let h = Math.max(0, startH); h < Math.min(TOTAL_HOURS, endH); h++)
              busy.add(h);
          },
        );
        setBusyHours(busy);

        // Try to honor the date+time already chosen on the catalog screen.
        if (prefillRef.current) {
          const { hour, duration } = prefillRef.current;
          prefillRef.current = null;
          const now = new Date();
          const isToday = date.toDateString() === now.toDateString();
          const range = Array.from({ length: duration }, (_, i) => hour + i);
          const clear = range.every(
            (h) => !busy.has(h) && !(h < 24 && isToday && h <= now.getHours()),
          );
          if (clear) {
            setSelectedHours(range);
            setSelectedDuration(duration);
          } else {
            expandTime();
          }
        }
      } catch {
      } finally {
        if (!cancelled) setSlotsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [date, boatId]);

  const unavailable = useCallback(
    (hour: number): boolean => {
      if (busyHours.has(hour)) return true;
      if (hour < 24) {
        const now = new Date();
        if (date.toDateString() === now.toDateString() && hour <= now.getHours())
          return true;
      }
      return false;
    },
    [busyHours, date],
  );

  const handleSlot = useCallback(
    (hour: number) => {
      if (unavailable(hour)) return;
      setSelectedHours((prev) =>
        computeSlotSelection(prev, hour, selectedDuration, unavailable),
      );
    },
    [unavailable, selectedDuration],
  );

  const handleDurationSelect = useCallback(
    (h: number) => {
      const eff = Math.max(h, minDuration);
      setSelectedDuration(eff);
      setSelectedHours((prev) => {
        if (prev.length === 0) return prev;
        const range = Array.from({ length: eff }, (_, i) => prev[0] + i);
        return range.some(unavailable) ? prev : range;
      });
    },
    [minDuration, unavailable],
  );

  const startH = selectedHours[0];
  const endH = startH != null ? startH + selectedHours.length : null;
  const canNext = selectedHours.length >= minDuration;

  const handleNext = useCallback(() => {
    if (!canNext) return;
    const dateISO = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    router.push(
      `/booking/${boatId}?date=${dateISO}&startHour=${startH}&duration=${selectedHours.length}` as any,
    );
  }, [canNext, date, boatId, startH, selectedHours.length, router]);

  const slotWidth = useMemo(() => {
    const { width } = require("react-native").Dimensions.get("window");
    return Math.floor((width - 32 - (COLS - 1) * 8) / COLS);
  }, []);

  // ── Button animation (same timing as CalendarPicker expand/collapse) ──
  const btnProgress = useSharedValue(0);
  useEffect(() => {
    if (canNext) {
      btnProgress.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) });
    } else {
      btnProgress.value = withTiming(0, { duration: 220, easing: Easing.in(Easing.cubic) });
    }
  }, [canNext]);

  const btnStyle = useAnimatedStyle(() => ({
    opacity: btnProgress.value,
    transform: [{ translateY: (1 - btnProgress.value) * 16 }],
    pointerEvents: btnProgress.value > 0 ? "auto" : "none",
  }));

  // ── Time section expand/collapse — same pattern as CalendarPicker ──
  const timeFade = useSharedValue(timeOpen ? 1 : 0);
  const timePillStyle = useAnimatedStyle(() => ({
    opacity: interpolate(timeFade.value, [0, 0.5], [1, 0], "clamp"),
    transform: [{ translateY: interpolate(timeFade.value, [0, 0.4], [0, -6], "clamp") }],
  }));
  const timeBodyStyle = useAnimatedStyle(() => ({
    opacity: interpolate(timeFade.value, [0.2, 1], [0, 1], "clamp"),
    transform: [{ translateY: interpolate(timeFade.value, [0, 1], [10, 0], "clamp") }],
  }));

  const expandTime = () => {
    LayoutAnimation.configureNext(EXPAND_CONFIG);
    timeFade.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) });
    setTimeOpen(true);
  };
  const collapseTime = () => {
    LayoutAnimation.configureNext(COLLAPSE_CONFIG);
    timeFade.value = withTiming(0, { duration: 220, easing: Easing.in(Easing.cubic) });
    setTimeOpen(false);
  };

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={8}>
          <ArrowLeft size={22} color={COLORS.text1} strokeWidth={2} />
        </Pressable>
        <Text style={s.headerTitle}>Дата и время</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* ── Boat + Pier sub-header ── */}
      {(boatName || pierName) && (
        <View style={s.boatHeader}>
          {boatName && <Text style={s.boatTitle}>{boatName}</Text>}
          {pierName && <Text style={s.pierNameTxt}>{pierName}</Text>}
          {pierAddress && (
            <Text style={s.pierAddrTxt}>Санкт-Петербург, {pierAddress}</Text>
          )}
        </View>
      )}

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[
          s.scrollContent,
          { paddingBottom: 120 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Calendar */}
        <View style={s.section}>
          <CalendarPicker
            selected={date}
            onSelect={(d) => setDate(d)}
            collapsible
            initialOpen={!dateParam}
          />
        </View>

        <View style={s.divider} />

        {/* Time slots — collapsible, same transition as the calendar above */}
        <View style={s.section}>
          {!timeOpen ? (
            <Animated.View style={timePillStyle}>
              <Pressable style={s.collapsed} onPress={expandTime}>
                <Text style={s.collapsedLabel}>Выбранное время</Text>
                <View style={s.collapsedRow}>
                  <Text style={s.collapsedDate}>
                    {startH != null
                      ? `${fmtHour(startH)} – ${fmtTimeLabel(endH!)} · ${durLabel(selectedHours.length)}`
                      : "Выберите время"}
                  </Text>
                  <ChevronRight size={15} color={COLORS.brandNavy} strokeWidth={2} />
                </View>
              </Pressable>
            </Animated.View>
          ) : (
            <Animated.View style={timeBodyStyle}>
              <View style={s.slotHeader}>
                <Clock size={15} color={COLORS.text2} strokeWidth={2} />
                <Text style={s.slotTitle}>Время</Text>
                <Text style={s.slotDate}>{fmtDateShort(date)}</Text>
              </View>

              {/* Продолжительность */}
              <View style={s.durOptRow}>
                {DURATION_OPTS.map((h) => {
                  const on = selectedDuration === h;
                  const disabled = h < minDuration;
                  return (
                    <Pressable
                      key={h}
                      style={[s.durOptChip, on && s.durOptChipOn, disabled && s.durOptChipOff]}
                      onPress={() => !disabled && handleDurationSelect(h)}
                      disabled={disabled}
                    >
                      <Text
                        style={[
                          s.durOptTxt,
                          on && s.durOptTxtOn,
                          disabled && s.durOptTxtOff,
                        ]}
                      >
                        {durLabel(h)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Legend */}
              <View style={s.legend}>
                <View style={s.legendItem}>
                  <View
                    style={[s.legendDot, { backgroundColor: COLORS.brandNavy }]}
                  />
                  <Text style={s.legendTxt}>Выбрано</Text>
                </View>
                <View style={s.legendItem}>
                  <View
                    style={[
                      s.legendDot,
                      {
                        backgroundColor: COLORS.greyLight,
                      },
                    ]}
                  />
                  <Text style={s.legendTxt}>Свободно</Text>
                </View>
                <View style={s.legendItem}>
                  <View style={[s.legendDot, { backgroundColor: "#F3E8E8" }]} />
                  <Text style={s.legendTxt}>Занято</Text>
                </View>
              </View>

              {slotsLoading ? (
                <View style={s.loader}>
                  <Spinner />
                  <Text style={s.loaderTxt}>Загружаем слоты…</Text>
                </View>
              ) : (
                <View style={s.grid}>
                  {Array.from({ length: TOTAL_HOURS }, (_, hour) => {
                    const busy = busyHours.has(hour);
                    const past = unavailable(hour) && !busy;
                    const off = busy || past;
                    const selected = selectedHours.includes(hour);
                    const isFirst = selected && hour === selectedHours[0];
                    const isLast =
                      selected && hour === selectedHours[selectedHours.length - 1];
                    const isNextDay = hour >= 24;

                    return (
                      <Pressable
                        key={hour}
                        style={({ pressed }) => [
                          s.slot,
                          { width: slotWidth },
                          off && s.slotOff,
                          selected && s.slotSel,
                          isFirst && s.slotFirst,
                          isLast && s.slotLast,
                          !off && !selected && pressed && s.slotPressed,
                        ]}
                        onPress={() => handleSlot(hour)}
                        disabled={off}
                      >
                        <Text
                          style={[
                            s.slotTxt,
                            off && s.slotTxtOff,
                            selected && s.slotTxtSel,
                          ]}
                        >
                          {fmtHour(hour)}
                        </Text>
                        {isNextDay && !busy && (
                          <Text style={[s.nextDayBadge, selected && s.nextDayBadgeSel]}>+1</Text>
                        )}
                        {isFirst && !isLast && <View style={s.slotDot} />}
                        {(isLast || (isFirst && isLast)) && (
                          <Check size={11} color="#fff" strokeWidth={3} />
                        )}
                        {busy && <Text style={s.slotBusyLbl}>занято</Text>}
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </Animated.View>
          )}
        </View>
      </ScrollView>

      {/* Bottom bar */}
      <Animated.View style={[s.bottomBar, { paddingBottom: insets.bottom + 12 }, btnStyle]}>
        <View style={s.selectionInfo}>
          <Clock size={15} color={COLORS.brandNavy} strokeWidth={2} />
          <Text style={s.selTxt}>
            {startH != null ? fmtHour(startH) : "–"} – {endH != null ? fmtTimeLabel(endH) : "–"}
          </Text>
          <View style={s.durBadge}>
            <Text style={s.durTxt}>{durLabel(selectedHours.length)}</Text>
          </View>
        </View>
        <Pressable
          style={({ pressed }) => [s.nextBtn, pressed && { opacity: 0.85 }]}
          onPress={handleNext}
          disabled={!canNext}
        >
          <Text style={s.nextTxt}>Далее</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.white },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 52,
    paddingHorizontal: 12,
    backgroundColor: COLORS.white,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 17, fontWeight: "700", color: COLORS.text1 },

  boatHeader: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: COLORS.white,
    gap: 2,
  },
  boatTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.text1,
    lineHeight: 28,
    marginBottom: 6,
  },
  pierNameTxt: {
    fontSize: 14,
    color: COLORS.text1,
    fontWeight: "400",
  },
  pierAddrTxt: {
    fontSize: 13,
    color: COLORS.text3,
    marginTop: 1,
  },

  scroll: { flex: 1 },
  scrollContent: { paddingTop: 8 },

  section: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  divider: { height: 8, backgroundColor: COLORS.backgroundAlt },

  slotHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  slotTitle: { fontSize: 15, fontWeight: "700", color: COLORS.text1, flex: 1 },
  slotDate: { fontSize: 13, color: COLORS.text3 },

  collapsed: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: COLORS.greyLight,
  },
  collapsedLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.text3,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  collapsedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  collapsedDate: { fontSize: 16, fontWeight: "700", color: COLORS.brandNavy },

  durOptRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  durOptChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.greyLight,
  },
  durOptChipOn: { backgroundColor: COLORS.brandNavy },
  durOptChipOff: { opacity: 0.4 },
  durOptTxt: { fontSize: 13, fontWeight: "500", color: COLORS.brandNavy },
  durOptTxtOn: { color: "#fff", fontWeight: "700" },
  durOptTxtOff: { color: COLORS.text3 },

  legend: { flexDirection: "row", gap: 14, marginBottom: 14 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 12, height: 12, borderRadius: 3 },
  legendTxt: { fontSize: 11, color: COLORS.text3 },

  loader: { alignItems: "center", gap: 10, paddingVertical: 32 },
  loaderTxt: { fontSize: 13, color: COLORS.text3 },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },

  slot: {
    height: 48,
    borderRadius: 10,
    backgroundColor: COLORS.greyLight,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  slotOff: { backgroundColor: "#F8ECEC", borderColor: "#EDD5D5", opacity: 0.7 },
  slotSel: { backgroundColor: COLORS.brandNavy, borderColor: COLORS.brandNavy },
  slotFirst: { borderBottomLeftRadius: 4, borderBottomRightRadius: 4 },
  slotLast: { borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  slotPressed: { backgroundColor: COLORS.brandNavy + "12" },

  slotTxt: { fontSize: 13, fontWeight: "600", color: COLORS.text1 },
  slotTxtOff: { color: "#C09090", fontWeight: "400" },
  slotTxtSel: { color: "#fff" },
  slotBusyLbl: { fontSize: 9, color: "#C09090" },
  nextDayBadge: { fontSize: 9, fontWeight: "700", color: COLORS.brandNavy, lineHeight: 11 },
  nextDayBadgeSel: { color: "rgba(255,255,255,0.8)" },
  slotDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "rgba(255,255,255,0.6)",
  },

  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 14,
    backgroundColor: COLORS.white,
    gap: 12,
  },
  selectionInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  selTxt: { fontSize: 15, fontWeight: "700", color: COLORS.brandNavy },
  durBadge: {
    backgroundColor: COLORS.brandNavy + "15",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  durTxt: { fontSize: 11, color: COLORS.brandNavy, fontWeight: "600" },
  selHint: { flex: 1, fontSize: 12, color: COLORS.text3 },

  nextBtn: {
    backgroundColor: COLORS.brandNavy,
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 13,
  },
  nextBtnDim: { backgroundColor: COLORS.muted },
  nextTxt: { fontSize: 15, fontWeight: "700", color: "#fff" },
});
