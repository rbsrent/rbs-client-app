import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Check, Clock } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { computeSlotSelection } from "@/features/booking/utils";
import { COLORS } from "@/shared/colors";
import { CalendarPicker } from "@/shared/components/CalendarPicker";
import { Spinner } from "@/shared/components/Spinner";
import { publicSupabase } from "@/shared/supabase/publicClient";

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
  return `${String(h).padStart(2, "0")}:00`;
}
function durLabel(h: number) {
  return h === 1 ? "1 час" : h < 5 ? `${h} часа` : `${h} часов`;
}

const COLS = 4;

export default function DateSelectScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { boatId, date: dateParam } = useLocalSearchParams<{
    boatId: string;
    date?: string;
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
  const [busyHours, setBusyHours] = useState<Set<number>>(new Set());
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedHours, setSelectedHours] = useState<number[]>([]);

  // Fetch boat min_duration_hours once (column may not exist yet — defaults to 1)
  useEffect(() => {
    if (!boatId) return;
    void (async () => {
      try {
        const { data, error } = await publicSupabase
          .from("boats")
          .select("min_duration_hours")
          .eq("id", boatId)
          .single();
        if (!error && data?.min_duration_hours)
          setMinDuration(data.min_duration_hours);
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
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    void (async () => {
      try {
        const { data } = await publicSupabase.rpc("get_boat_busy_slots", {
          p_boat_id: boatId,
          p_start_datetime: dayStart.toISOString(),
          p_end_datetime: dayEnd.toISOString(),
        });
        if (cancelled) return;
        const busy = new Set<number>();
        (data ?? []).forEach(
          (slot: { start_datetime: string; end_datetime: string }) => {
            const s = new Date(slot.start_datetime);
            const e = new Date(slot.end_datetime);
            for (let h = s.getHours(); h < e.getHours(); h++) busy.add(h);
          },
        );
        setBusyHours(busy);
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
      const now = new Date();
      if (date.toDateString() === now.toDateString() && hour <= now.getHours())
        return true;
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
    // computed in render is fine — screen width doesn't change
    const { width } = require("react-native").Dimensions.get("window");
    return Math.floor((width - 32 - (COLS - 1) * 8) / COLS);
  }, []);

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

        {/* Time slots */}
        <View style={s.section}>
          <View style={s.slotHeader}>
            <Clock size={15} color={COLORS.text2} strokeWidth={2} />
            <Text style={s.slotTitle}>Время</Text>
            <Text style={s.slotDate}>
              {fmtDateShort(date)}
              {minDuration > 1 ? `  ·  мин. ${durLabel(minDuration)}` : ""}
            </Text>
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
              {Array.from({ length: 24 }, (_, hour) => {
                const busy = busyHours.has(hour);
                const past = unavailable(hour) && !busy;
                const off = busy || past;
                const selected = selectedHours.includes(hour);
                const isFirst = selected && hour === selectedHours[0];
                const isLast =
                  selected && hour === selectedHours[selectedHours.length - 1];

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
        </View>
      </ScrollView>

      {/* Bottom bar */}
      <View style={[s.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <View style={s.selectionInfo}>
          {canNext ? (
            <>
              <Clock size={15} color={COLORS.brandNavy} strokeWidth={2} />
              <Text style={s.selTxt}>
                {fmtHour(startH!)} – {fmtHour(endH!)}
              </Text>
              <View style={s.durBadge}>
                <Text style={s.durTxt}>{durLabel(selectedHours.length)}</Text>
              </View>
            </>
          ) : (
            <Text style={s.selHint}>Выберите начало и продолжительность</Text>
          )}
        </View>
        <Pressable
          style={({ pressed }) => [
            s.nextBtn,
            !canNext && s.nextBtnDim,
            pressed && canNext && { opacity: 0.85 },
          ]}
          onPress={handleNext}
          disabled={!canNext}
        >
          <Text style={s.nextTxt}>Далее</Text>
        </Pressable>
      </View>
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

  scroll: { flex: 1 },
  scrollContent: { paddingTop: 8 },

  section: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  divider: { height: 8 },

  slotHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  slotTitle: { fontSize: 15, fontWeight: "700", color: COLORS.text1, flex: 1 },
  slotDate: { fontSize: 13, color: COLORS.text3 },

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
