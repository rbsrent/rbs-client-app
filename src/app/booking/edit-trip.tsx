import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Check, Clock, MapPin } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PierSelectModal } from "@/features/booking/components/PierSelectModal";
import {
  getCachedPiers,
  resolveTripEdit,
} from "@/features/booking/tripEditResult";
import type { Pier } from "@/features/booking/types";
import {
  computeSlotSelection,
  durLabel,
  fmtHour,
  fmtHourLabel,
} from "@/features/booking/utils";
import { buildBoatH1 } from "@/features/catalog/hooks/useBoatDetail";
import { COLORS } from "@/shared/colors";
import { CalendarPicker } from "@/shared/components/CalendarPicker";
import { Spinner } from "@/shared/components/Spinner";
import { publicSupabase } from "@/shared/supabase/publicClient";

const { width: W } = Dimensions.get("window");
const COLS = 4;
const SLOT_W = Math.floor((W - 32 - (COLS - 1) * 8) / COLS);
const EXTRA_HOURS = 6;
const TOTAL_HOURS = 24 + EXTRA_HOURS;

const MONTHS_S = [
  "янв", "фев", "мар", "апр", "май", "июн",
  "июл", "авг", "сен", "окт", "ноя", "дек",
];
const DAYS_S = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
function fmtDateShort(d: Date) {
  return `${d.getDate()} ${MONTHS_S[d.getMonth()]}, ${DAYS_S[d.getDay()]}`;
}

const ENTER = FadeIn.duration(240).easing(Easing.out(Easing.ease));
const EXIT = FadeOut.duration(160).easing(Easing.in(Easing.ease));
const LAY = LinearTransition.duration(240).easing(Easing.inOut(Easing.ease));

export default function EditTripScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    boatId,
    date: dateParam,
    startHour: hourParam,
    duration: durParam,
    pierId,
    minDuration: minDurParam,
    boatName: boatNameParam,
    pierName: pierNameParam,
    pierAddress: pierAddressParam,
  } = useLocalSearchParams<{
    boatId: string;
    date?: string;
    startHour?: string;
    duration?: string;
    pierId?: string;
    minDuration?: string;
    boatName?: string;
    pierName?: string;
    pierAddress?: string;
  }>();

  const minDuration = minDurParam ? Math.max(1, Number(minDurParam)) : 1;

  // ── Boat name + pier (fetched from DB, same as date-select) ──
  const [boatName, setBoatName] = useState<string | null>(
    boatNameParam ? decodeURIComponent(boatNameParam) : null,
  );
  const [pierName, setPierName] = useState<string | null>(
    pierNameParam ? decodeURIComponent(pierNameParam) : null,
  );
  const [pierAddress, setPierAddress] = useState<string | null>(
    pierAddressParam ? decodeURIComponent(pierAddressParam) : null,
  );

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

  // ── Piers ──
  const [piers, setPiers] = useState<Pier[]>(() => getCachedPiers());
  const multiPier = piers.length > 1;

  useEffect(() => {
    if (piers.length > 0 || !boatId) return;
    void (async () => {
      const { data: asgn } = await publicSupabase
        .from("boat_pier_assignments")
        .select("pier_id, piers(id, name, address, latitude, longitude)")
        .eq("boat_id", boatId);
      const list: Pier[] = asgn?.length
        ? (asgn as any[]).map((a: any) => a.piers).filter(Boolean)
        : [];
      if (list.length) {
        setPiers(list);
        setSelectedPier((prev) =>
          prev ? list.find((p) => p.id === prev.id) ?? list[0] : list[0],
        );
      }
    })();
  }, [boatId]);

  // ── Date ──
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

  // ── Time slots ──
  const [busyHours, setBusyHours] = useState<Set<number>>(new Set());
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedHours, setSelectedHours] = useState<number[]>(() => {
    if (hourParam && hourParam !== "-1" && durParam) {
      const h = Number(hourParam);
      const d = Number(durParam);
      return Array.from({ length: d }, (_, i) => h + i);
    }
    return [];
  });

  // ── Pier ──
  const [selectedPier, setSelectedPier] = useState<Pier | null>(() => {
    if (pierId) return piers.find((p) => p.id === pierId) ?? piers[0] ?? null;
    return piers[0] ?? null;
  });
  const [pierSheetOpen, setPierSheetOpen] = useState(false);

  // ── Fetch busy slots (extended range for crossing midnight) ──
  const initialDateStr = useRef(date.toDateString());

  useEffect(() => {
    if (!boatId) return;
    let cancelled = false;
    setSlotsLoading(true);
    setBusyHours(new Set());
    if (date.toDateString() !== initialDateStr.current) {
      setSelectedHours([]);
    }

    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const rangeEnd = new Date(dayStart.getTime() + TOTAL_HOURS * 3_600_000);

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
      } catch {
      } finally {
        if (!cancelled) setSlotsLoading(false);
      }
    })();
    return () => { cancelled = true; };
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
        computeSlotSelection(prev, hour, minDuration, unavailable),
      );
    },
    [unavailable, minDuration],
  );

  // ── Confirm ──
  const startH = selectedHours[0];
  const endH = startH != null ? startH + selectedHours.length : null;
  const canConfirm =
    selectedHours.length >= minDuration && (multiPier ? !!selectedPier : true);

  const btnProgress = useSharedValue(0);
  useEffect(() => {
    if (canConfirm) {
      btnProgress.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) });
    } else {
      btnProgress.value = withTiming(0, { duration: 220, easing: Easing.in(Easing.cubic) });
    }
  }, [canConfirm]);

  const btnStyle = useAnimatedStyle(() => ({
    opacity: btnProgress.value,
    transform: [{ translateY: (1 - btnProgress.value) * 16 }],
    pointerEvents: btnProgress.value > 0 ? "auto" : "none",
  }));

  const handleConfirm = () => {
    resolveTripEdit({
      date,
      startHour: startH,
      duration: selectedHours.length,
      pier: selectedPier,
    });
    router.back();
  };

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={8}>
          <ArrowLeft size={22} color={COLORS.text1} strokeWidth={2} />
        </Pressable>
        <Text style={s.headerTitle}>Изменить детали</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* ── Boat + Pier sub-header (sticky, outside ScrollView) ── */}
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
        {/* ── Calendar ── */}
        <View style={s.section}>
          <CalendarPicker
            selected={date}
            onSelect={(d) => setDate(d)}
            collapsible
            initialOpen={!dateParam}
          />
        </View>

        <View style={s.divider} />

        {/* ── Time slots ── */}
        <Animated.View style={s.section} entering={ENTER} layout={LAY}>
          <View style={s.sectionHeader}>
            <Clock size={15} color={COLORS.text2} strokeWidth={2} />
            <Text style={s.sectionTitle}>Время</Text>
            <Text style={s.sectionDate}>
              {fmtDateShort(date)}
              {minDuration > 1 ? `  ·  мин. ${durLabel(minDuration)}` : ""}
            </Text>
          </View>

          {/* Legend */}
          <View style={s.legend}>
            <View style={s.legendItem}>
              <View style={[s.legendDot, { backgroundColor: COLORS.brandNavy }]} />
              <Text style={s.legendTxt}>Выбрано</Text>
            </View>
            <View style={s.legendItem}>
              <View style={[s.legendDot, { backgroundColor: COLORS.greyLight }]} />
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
            <Animated.View
              key={date.toDateString()}
              style={s.grid}
              entering={ENTER}
              exiting={EXIT}
            >
              {Array.from({ length: TOTAL_HOURS }, (_, hour) => {
                const busy = busyHours.has(hour);
                const past = unavailable(hour) && !busy;
                const off = busy || past;
                const selected = selectedHours.includes(hour);
                const isFirst = selected && hour === selectedHours[0];
                const isLast = selected && hour === selectedHours[selectedHours.length - 1];
                const isNextDay = hour >= 24;

                return (
                  <Pressable
                    key={hour}
                    style={({ pressed }) => [
                      s.slot,
                      { width: SLOT_W },
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
            </Animated.View>
          )}
        </Animated.View>

        {/* ── Pier (only when multiple options) ── */}
        {multiPier && (
          <>
            <View style={s.divider} />
            <Pressable style={s.section} onPress={() => setPierSheetOpen(true)}>
              <View style={s.sectionHeader}>
                <MapPin size={15} color={COLORS.text2} strokeWidth={2} />
                <Text style={s.sectionTitle}>Место посадки</Text>
                <Text style={s.sectionAction}>Изменить</Text>
              </View>
              <Animated.View layout={LAY}>
                {selectedPier ? (
                  <Animated.View key={selectedPier.id} entering={ENTER} exiting={EXIT}>
                    <Text style={s.pierName} numberOfLines={2}>
                      {selectedPier.name}
                    </Text>
                    {selectedPier.address ? (
                      <Text style={s.pierAddr} numberOfLines={1}>
                        {selectedPier.address}
                      </Text>
                    ) : null}
                  </Animated.View>
                ) : (
                  <Animated.Text key="ph" entering={ENTER} exiting={EXIT} style={s.placeholder}>
                    Нажмите чтобы выбрать
                  </Animated.Text>
                )}
              </Animated.View>
            </Pressable>
          </>
        )}
      </ScrollView>

      {/* ── Bottom bar ── */}
      <Animated.View style={[s.bottomBar, { paddingBottom: insets.bottom + 12 }, btnStyle]}>
        <View style={s.selInfo}>
          <Clock size={15} color={COLORS.brandNavy} strokeWidth={2} />
          <Text style={s.selTxt}>
            {startH != null ? fmtHour(startH) : "–"} – {endH != null ? fmtHourLabel(endH) : "–"}
          </Text>
          <View style={s.durBadge}>
            <Text style={s.durTxt}>{durLabel(selectedHours.length)}</Text>
          </View>
        </View>
        <Pressable
          style={({ pressed }) => [s.confirmBtn, pressed && { opacity: 0.85 }]}
          onPress={handleConfirm}
          disabled={!canConfirm}
        >
          <Text style={s.confirmTxt}>Подтвердить</Text>
        </Pressable>
      </Animated.View>

      {multiPier && (
        <PierSelectModal
          visible={pierSheetOpen}
          piers={piers}
          selectedPier={selectedPier}
          onSelect={(p) => setSelectedPier(p)}
          onClose={() => setPierSheetOpen(false)}
        />
      )}
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

  divider: { height: 8, backgroundColor: COLORS.backgroundAlt },

  section: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: COLORS.text1, flex: 1 },
  sectionDate: { fontSize: 13, color: COLORS.text3 },
  sectionAction: { fontSize: 13, fontWeight: "600", color: COLORS.brandNavy },

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

  pierName: { fontSize: 14, fontWeight: "600", color: COLORS.text1 },
  pierAddr: { fontSize: 12, color: COLORS.text3, marginTop: 2 },
  placeholder: { fontSize: 14, color: COLORS.text3 },

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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
    gap: 12,
  },
  selInfo: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6 },
  selTxt: { fontSize: 15, fontWeight: "700", color: COLORS.brandNavy },
  durBadge: {
    backgroundColor: COLORS.brandNavy + "15",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  durTxt: { fontSize: 11, fontWeight: "600", color: COLORS.brandNavy },

  confirmBtn: {
    backgroundColor: COLORS.brandNavy,
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 13,
  },
  confirmTxt: { fontSize: 15, fontWeight: "700", color: "#fff" },
});
