import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  Dimensions,
  LayoutAnimation,
  Platform,
  Pressable,
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

import { COLORS } from "@/shared/colors";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SCREEN_W = Dimensions.get("window").width;
const CELL_SIZE = Math.floor((SCREEN_W - 40 - 16) / 7);

const MONTHS_RU = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];
const MONTHS_GEN_RU = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];
const DAYS_SHORT = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export function fmtDateFull(d: Date) {
  return `${d.getDate()} ${MONTHS_GEN_RU[d.getMonth()]} ${d.getFullYear()}`;
}

interface Props {
  selected: Date | null;
  onSelect: (d: Date) => void;
  collapsible?: boolean;
  initialOpen?: boolean;
}

const EXPAND_CONFIG = {
  duration: 320,
  create: {
    type: LayoutAnimation.Types.spring,
    property: LayoutAnimation.Properties.scaleXY,
    springDamping: 0.85,
  },
  update: { type: LayoutAnimation.Types.spring, springDamping: 0.85 },
  delete: {
    type: LayoutAnimation.Types.easeOut,
    property: LayoutAnimation.Properties.opacity,
  },
};

const COLLAPSE_CONFIG = {
  duration: 240,
  create: {
    type: LayoutAnimation.Types.easeOut,
    property: LayoutAnimation.Properties.opacity,
  },
  update: { type: LayoutAnimation.Types.easeInEaseOut },
  delete: {
    type: LayoutAnimation.Types.easeOut,
    property: LayoutAnimation.Properties.opacity,
  },
};

export function CalendarPicker({
  selected,
  onSelect,
  collapsible = true,
  initialOpen = true,
}: Props) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const [viewMonth, setViewMonth] = useState(() => {
    const b = selected ?? new Date();
    return new Date(b.getFullYear(), b.getMonth(), 1);
  });
  const [open, setOpen] = useState(initialOpen);

  // 0 = collapsed, 1 = expanded — persists across conditional re-mounts
  const fade = useSharedValue(initialOpen ? 1 : 0);

  const year = viewMonth.getFullYear(),
    month = viewMonth.getMonth();

  const cells = useMemo(() => {
    const offset = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev = new Date(year, month, 0).getDate();
    const arr: Array<{ day: number; thisMonth: boolean; date: Date }> = [];
    for (let i = offset - 1; i >= 0; i--)
      arr.push({
        day: daysInPrev - i,
        thisMonth: false,
        date: new Date(year, month - 1, daysInPrev - i),
      });
    for (let d = 1; d <= daysInMonth; d++)
      arr.push({ day: d, thisMonth: true, date: new Date(year, month, d) });
    const rem = arr.length % 7;
    if (rem > 0)
      for (let d = 1; d <= 7 - rem; d++)
        arr.push({
          day: d,
          thisMonth: false,
          date: new Date(year, month + 1, d),
        });
    return arr;
  }, [year, month]);

  const isSel = (d: Date) =>
    selected !== null &&
    d.getFullYear() === selected.getFullYear() &&
    d.getMonth() === selected.getMonth() &&
    d.getDate() === selected.getDate();

  // Pill fades in as fade goes 1→0 (opacity = 1 - fade)
  const pillStyle = useAnimatedStyle(() => ({
    opacity: interpolate(fade.value, [0, 0.5], [1, 0], "clamp"),
    transform: [
      { translateY: interpolate(fade.value, [0, 0.4], [0, -6], "clamp") },
    ],
  }));

  // Calendar fades in as fade goes 0→1
  const calStyle = useAnimatedStyle(() => ({
    opacity: interpolate(fade.value, [0.2, 1], [0, 1], "clamp"),
    transform: [
      { translateY: interpolate(fade.value, [0, 1], [10, 0], "clamp") },
    ],
  }));

  const expand = () => {
    LayoutAnimation.configureNext(EXPAND_CONFIG);
    fade.value = withTiming(1, {
      duration: 300,
      easing: Easing.out(Easing.cubic),
    });
    setOpen(true);
  };

  const collapse = (date?: Date) => {
    if (date) onSelect(date);
    LayoutAnimation.configureNext(COLLAPSE_CONFIG);
    fade.value = withTiming(0, {
      duration: 220,
      easing: Easing.in(Easing.cubic),
    });
    setOpen(false);
  };

  // ── Collapsed pill ───────────────────────────────────────────────────────
  if (collapsible && !open) {
    return (
      <Animated.View style={pillStyle}>
        <Pressable style={s.collapsed} onPress={expand}>
          <Text style={s.collapsedLabel}>Выбранная дата</Text>
          <View style={s.collapsedRow}>
            <Text style={s.collapsedDate}>
              {selected ? fmtDateFull(selected) : "Выберите дату"}
            </Text>
            <ChevronRight size={15} color={COLORS.brandNavy} strokeWidth={2} />
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  // ── Full calendar ────────────────────────────────────────────────────────
  const weeks = Array.from({ length: Math.ceil(cells.length / 7) }, (_, w) =>
    cells.slice(w * 7, w * 7 + 7),
  );

  return (
    <Animated.View style={calStyle}>
      <View style={s.monthNav}>
        <Pressable
          onPress={() => setViewMonth(new Date(year, month - 1, 1))}
          hitSlop={14}
        >
          <ChevronLeft size={20} color={COLORS.text2} strokeWidth={2} />
        </Pressable>
        <Text style={s.monthTitle}>
          {MONTHS_RU[month]} {year}
        </Text>
        <Pressable
          onPress={() => setViewMonth(new Date(year, month + 1, 1))}
          hitSlop={14}
        >
          <ChevronRight size={20} color={COLORS.text2} strokeWidth={2} />
        </Pressable>
      </View>

      <View style={s.dayRow}>
        {DAYS_SHORT.map((d) => (
          <View key={d} style={s.cell}>
            <Text style={s.dayHdr}>{d}</Text>
          </View>
        ))}
      </View>

      {weeks.map((week, wi) => (
        <View key={wi} style={s.dayRow}>
          {week.map((cell, ci) => {
            const past = cell.date < today && cell.thisMonth;
            const sel = isSel(cell.date);
            const tod = cell.date.getTime() === today.getTime();
            return (
              <Pressable
                key={ci}
                style={[
                  s.cell,
                  s.cellP,
                  sel && s.cellSel,
                  tod && !sel && s.cellToday,
                ]}
                onPress={() => {
                  if (!past && cell.thisMonth) {
                    if (collapsible) collapse(cell.date);
                    else onSelect(cell.date);
                  }
                }}
                disabled={past || !cell.thisMonth}
              >
                <Text
                  style={[
                    s.cellTxt,
                    !cell.thisMonth && s.cellOther,
                    past && s.cellPast,
                    tod && !sel && s.cellTodayTxt,
                    sel && s.cellSelTxt,
                  ]}
                >
                  {cell.day}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  monthTitle: { fontSize: 15, fontWeight: "700", color: COLORS.text1 },
  dayRow: { flexDirection: "row", marginBottom: 2 },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  cellP: { borderRadius: CELL_SIZE / 2 },
  dayHdr: { fontSize: 11, fontWeight: "600", color: COLORS.text3 },
  cellTxt: { fontSize: 14, fontWeight: "500", color: COLORS.text1 },
  cellOther: { color: COLORS.border },
  cellPast: { color: COLORS.text3, opacity: 0.38 },
  cellSel: { backgroundColor: COLORS.brandNavy },
  cellSelTxt: { color: COLORS.white, fontWeight: "700" },
  cellToday: { borderWidth: 1.5, borderColor: COLORS.brandNavy },
  cellTodayTxt: { color: COLORS.brandNavy, fontWeight: "700" },
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
});
