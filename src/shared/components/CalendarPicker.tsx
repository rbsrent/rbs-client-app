import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
} from "react-native";
import ReAnimated, {
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
const CALENDAR_W = CELL_SIZE * 7;

const MONTHS_RU = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];
const MONTHS_GEN_RU = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
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

function buildCells(year: number, month: number) {
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();
  const arr: Array<{ day: number; thisMonth: boolean; date: Date }> = [];
  for (let i = offset - 1; i >= 0; i--)
    arr.push({ day: daysInPrev - i, thisMonth: false, date: new Date(year, month - 1, daysInPrev - i) });
  for (let d = 1; d <= daysInMonth; d++)
    arr.push({ day: d, thisMonth: true, date: new Date(year, month, d) });
  const rem = arr.length % 7;
  if (rem > 0)
    for (let d = 1; d <= 7 - rem; d++)
      arr.push({ day: d, thisMonth: false, date: new Date(year, month + 1, d) });
  return arr;
}

// ── DayCell — exactly like DateStrip's DateCell ───────────────────────────────
interface DayCellProps {
  day: number;
  thisMonth: boolean;
  date: Date;
  today: Date;
  selected: Date | null;
  collapsible: boolean;
  onSelect: (d: Date) => void;
  onCollapse: (d: Date) => void;
}

const DayCell = function DayCell({
  day, thisMonth, date, today, selected, collapsible, onSelect, onCollapse,
}: DayCellProps) {
  const isSelected =
    thisMonth &&
    selected !== null &&
    date.getFullYear() === selected.getFullYear() &&
    date.getMonth() === selected.getMonth() &&
    date.getDate() === selected.getDate();
  const isToday = thisMonth && date.getTime() === today.getTime();
  const isPast = date < today && thisMonth;

  const scale = useRef(new Animated.Value(1)).current;
  const flash = useRef(new Animated.Value(0)).current;
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    if (isSelected) {
      scale.setValue(0.82);
      flash.setValue(0.5);
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, speed: 24, bounciness: 10, useNativeDriver: true }),
        Animated.timing(flash, { toValue: 0, duration: 380, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.spring(scale, { toValue: 1, speed: 30, bounciness: 0, useNativeDriver: true }).start();
    }
  }, [isSelected]);

  const handlePress = useCallback(() => {
    if (isPast || !thisMonth) return;
    if (isSelected) {
      scale.setValue(0.88);
      Animated.spring(scale, { toValue: 1, speed: 20, bounciness: 6, useNativeDriver: true }).start();
    }
    if (collapsible) onCollapse(date);
    else onSelect(date);
  }, [isSelected, isPast, thisMonth, date, collapsible, onSelect, onCollapse]);

  return (
    <Pressable style={s.cell} onPress={handlePress} disabled={isPast || !thisMonth}>
      <Animated.View
        style={[
          s.cellInner,
          isSelected && s.cellSel,
          isToday && !isSelected && s.cellToday,
          { transform: [{ scale }] },
        ]}
      >
        {isSelected && (
          <Animated.View
            style={[StyleSheet.absoluteFill, s.cellFlash, { opacity: flash }]}
            pointerEvents="none"
          />
        )}
        <Text
          style={[
            s.cellTxt,
            !thisMonth && s.cellOther,
            isPast && s.cellPast,
            isToday && !isSelected && s.cellTodayTxt,
            isSelected && s.cellSelTxt,
          ]}
        >
          {day}
        </Text>
      </Animated.View>
    </Pressable>
  );
};

// ── DateGrid — one month of cells ────────────────────────────────────────────
interface DateGridProps {
  year: number;
  month: number;
  today: Date;
  selected: Date | null;
  collapsible: boolean;
  onSelect: (d: Date) => void;
  onCollapse: (d: Date) => void;
}

function DateGrid({ year, month, today, selected, collapsible, onSelect, onCollapse }: DateGridProps) {
  const cells = useMemo(() => buildCells(year, month), [year, month]);
  const weeks = useMemo(
    () => Array.from({ length: Math.ceil(cells.length / 7) }, (_, w) => cells.slice(w * 7, w * 7 + 7)),
    [cells],
  );
  return (
    <View style={{ width: CALENDAR_W }}>
      {weeks.map((week, wi) => (
        <View key={wi} style={s.dayRow}>
          {week.map((cell, ci) => (
            <DayCell
              key={ci}
              day={cell.day}
              thisMonth={cell.thisMonth}
              date={cell.date}
              today={today}
              selected={selected}
              collapsible={collapsible}
              onSelect={onSelect}
              onCollapse={onCollapse}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

// ── Expand / collapse ─────────────────────────────────────────────────────────
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

// ── CalendarPicker ────────────────────────────────────────────────────────────
export function CalendarPicker({ selected, onSelect, collapsible = true, initialOpen = true }: Props) {
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

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const prevDate = new Date(year, month - 1, 1);
  const nextDate = new Date(year, month + 1, 1);

  const todayMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const canGoPrev = prevDate.getTime() >= todayMonthStart.getTime();

  // ── Scroll tracking — same pattern as DateStrip ───────────────────────────
  // scrollX starts at CALENDAR_W (center page = current month)
  const scrollX = useRef(new Animated.Value(CALENDAR_W)).current;
  const scrollRef = useRef<ScrollView>(null);

  // dist to next-month boundary (right side, at content-x = 2*CALENDAR_W)
  const distToNext = useMemo(
    () => Animated.subtract(new Animated.Value(2 * CALENDAR_W), scrollX),
    [],
  );
  // dist to prev-month boundary (left side, at content-x = 0)
  // When at center: scrollX = CALENDAR_W → distToPrev = CALENDAR_W (far left, secondary off-screen)
  // When at prev page: scrollX = 0 → distToPrev = 0 (secondary at center)
  const distToPrev = useMemo(() => scrollX, []); // distToPrev = scrollX itself

  // Primary title opacity: same formula as DateStrip
  //   → fades out as either boundary enters view (< 160px from edge)
  //   → 0 when boundary is at left edge, 1 when boundary is >160px away
  //
  // For bidirectional: use the MINIMUM dist of both boundaries.
  // Since only one boundary is ever near at a time, we interpolate from scrollX directly:
  const primOpacity = useMemo(
    () =>
      scrollX.interpolate({
        inputRange: [CALENDAR_W - 160, CALENDAR_W, CALENDAR_W + 160],
        outputRange: [0, 1, 0],
        extrapolate: "clamp",
      }),
    [],
  );

  // Next secondary title: physically tracks the right boundary (same as DateStrip's secTranslateX)
  //   dist=0 → label at viewport center (translateX=0)
  //   dist=CALENDAR_W → label off screen to the right (translateX=CALENDAR_W)
  const nextSecTranslateX = useMemo(
    () =>
      distToNext.interpolate({
        inputRange: [0, CALENDAR_W],
        outputRange: [0, CALENDAR_W],
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }),
    [],
  );

  // Prev secondary title: physically tracks the left boundary
  //   distToPrev=0 (at prev page) → label at center (translateX=0)
  //   distToPrev=CALENDAR_W (at center page) → label off screen to the left
  const prevSecTranslateX = useMemo(
    () =>
      distToPrev.interpolate({
        inputRange: [0, CALENDAR_W],
        outputRange: [0, -CALENDAR_W],
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }),
    [],
  );

  // After viewMonth commits (React re-render done), reset scroll to center.
  // At the crossing moment, primOpacity ≈ 0 (boundary at edge) → primary text
  // change is invisible. After reset, primary shows correct new month. Same as DateStrip.
  const needsScrollReset = useRef(false);
  useEffect(() => {
    if (needsScrollReset.current) {
      needsScrollReset.current = false;
      scrollX.setValue(CALENDAR_W);
      scrollRef.current?.scrollTo({ x: CALENDAR_W, animated: false });
    }
  }, [viewMonth]);

  const onScrollEnd = useCallback(
    (e: { nativeEvent: { contentOffset: { x: number } } }) => {
      const x = e.nativeEvent.contentOffset.x;
      if (x < CALENDAR_W - 10) {
        if (!canGoPrev) {
          scrollRef.current?.scrollTo({ x: CALENDAR_W, animated: true });
          return;
        }
        needsScrollReset.current = true;
        setViewMonth(new Date(year, month - 1, 1));
      } else if (x > CALENDAR_W + 10) {
        needsScrollReset.current = true;
        setViewMonth(new Date(year, month + 1, 1));
      }
    },
    [year, month, canGoPrev],
  );

  // ── Expand / collapse — Reanimated for the outer wrapper fade ─────────────
  const fade = useSharedValue(initialOpen ? 1 : 0);

  const pillStyle = useAnimatedStyle(() => ({
    opacity: interpolate(fade.value, [0, 0.5], [1, 0], "clamp"),
    transform: [{ translateY: interpolate(fade.value, [0, 0.4], [0, -6], "clamp") }],
  }));
  const calStyle = useAnimatedStyle(() => ({
    opacity: interpolate(fade.value, [0.2, 1], [0, 1], "clamp"),
    transform: [{ translateY: interpolate(fade.value, [0, 1], [10, 0], "clamp") }],
  }));

  const expand = () => {
    LayoutAnimation.configureNext(EXPAND_CONFIG);
    fade.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) });
    setOpen(true);
  };
  const collapse = (date?: Date) => {
    if (date) onSelect(date);
    LayoutAnimation.configureNext(COLLAPSE_CONFIG);
    fade.value = withTiming(0, { duration: 220, easing: Easing.in(Easing.cubic) });
    setOpen(false);
  };

  if (collapsible && !open) {
    return (
      <ReAnimated.View style={pillStyle}>
        <Pressable style={s.collapsed} onPress={expand}>
          <Text style={s.collapsedLabel}>Выбранная дата</Text>
          <View style={s.collapsedRow}>
            <Text style={s.collapsedDate}>{selected ? fmtDateFull(selected) : "Выберите дату"}</Text>
            <ChevronRight size={15} color={COLORS.brandNavy} strokeWidth={2} />
          </View>
        </Pressable>
      </ReAnimated.View>
    );
  }

  return (
    <ReAnimated.View style={calStyle}>
      {/* Month navigation */}
      <View style={s.monthNav}>
        <Pressable
          onPress={() => canGoPrev && scrollRef.current?.scrollTo({ x: 0, animated: true })}
          hitSlop={14}
          disabled={!canGoPrev}
        >
          <ChevronLeft size={20} color={canGoPrev ? COLORS.text2 : COLORS.border} strokeWidth={2} />
        </Pressable>

        {/* Title: same 2-label system as DateStrip, adapted for bidirectional */}
        <View style={s.titleViewport} pointerEvents="none">
          {/* Primary — stays at center, fades as boundary approaches */}
          <Animated.Text style={[s.monthTitle, { opacity: primOpacity }]}>
            {MONTHS_RU[month]} {year}
          </Animated.Text>
          {/* Prev secondary — slides in from left (hidden when at first allowed month) */}
          {canGoPrev && (
            <Animated.Text
              style={[s.monthTitle, { transform: [{ translateX: prevSecTranslateX }] }]}
            >
              {MONTHS_RU[prevDate.getMonth()]} {prevDate.getFullYear()}
            </Animated.Text>
          )}
          {/* Next secondary — slides in from right */}
          <Animated.Text
            style={[s.monthTitle, { transform: [{ translateX: nextSecTranslateX }] }]}
          >
            {MONTHS_RU[nextDate.getMonth()]} {nextDate.getFullYear()}
          </Animated.Text>
        </View>

        <Pressable
          onPress={() => scrollRef.current?.scrollTo({ x: 2 * CALENDAR_W, animated: true })}
          hitSlop={14}
        >
          <ChevronRight size={20} color={COLORS.text2} strokeWidth={2} />
        </Pressable>
      </View>

      {/* Fixed day-of-week headers */}
      <View style={s.dayRow}>
        {DAYS_SHORT.map((d) => (
          <View key={d} style={s.cell}>
            <Text style={s.dayHdr}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Paging scroll view — same as DateStrip uses Animated.ScrollView */}
      <View style={s.gridViewport}>
        <Animated.ScrollView
          ref={scrollRef as any}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          overScrollMode="never"
          scrollEventThrottle={16}
          contentOffset={{ x: CALENDAR_W, y: 0 }}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: true },
          )}
          onMomentumScrollEnd={onScrollEnd}
        >
          <DateGrid
            year={canGoPrev ? prevDate.getFullYear() : year}
            month={canGoPrev ? prevDate.getMonth() : month}
            today={today} selected={selected}
            collapsible={collapsible} onSelect={onSelect} onCollapse={collapse}
          />
          <DateGrid
            year={year} month={month}
            today={today} selected={selected}
            collapsible={collapsible} onSelect={onSelect} onCollapse={collapse}
          />
          <DateGrid
            year={nextDate.getFullYear()} month={nextDate.getMonth()}
            today={today} selected={selected}
            collapsible={collapsible} onSelect={onSelect} onCollapse={collapse}
          />
        </Animated.ScrollView>
      </View>
    </ReAnimated.View>
  );
}

const s = StyleSheet.create({
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  titleViewport: {
    flex: 1,
    overflow: "hidden",
    height: 22,
    justifyContent: "center",
  },
  monthTitle: {
    position: "absolute",
    left: 0,
    right: 0,
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text1,
    textAlign: "center",
  },
  dayRow: { flexDirection: "row", marginBottom: 2 },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  dayHdr: { fontSize: 11, fontWeight: "600", color: COLORS.text3 },
  cellInner: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: CELL_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  cellSel: { backgroundColor: COLORS.brandNavy },
  cellToday: { borderWidth: 1.5, borderColor: COLORS.brandNavy },
  cellFlash: { borderRadius: CELL_SIZE / 2, backgroundColor: "#fff" },
  cellTxt: { fontSize: 14, fontWeight: "500", color: COLORS.text1 },
  cellOther: { color: COLORS.border },
  cellPast: { color: COLORS.text3, opacity: 0.38 },
  cellTodayTxt: { color: COLORS.brandNavy, fontWeight: "700" },
  cellSelTxt: { color: COLORS.white, fontWeight: "700" },
  gridViewport: {
    width: CALENDAR_W,
    overflow: "hidden",
  },
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
