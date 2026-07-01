import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { COLORS } from "@/shared/colors";
import { MONTHS_RU } from "../constants";

const SCREEN_W = Dimensions.get("window").width;
const STRIP_PADDING_LEFT = 16;
const CELL_W = Math.round((SCREEN_W - STRIP_PADDING_LEFT) / 9);
const TOTAL_DAYS = 240;
const DAY_RU = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const RED = "#E04747";
const FAR = TOTAL_DAYS * CELL_W + 9999;

function buildDays(from: Date): Date[] {
  return Array.from({ length: TOTAL_DAYS }, (_, i) => {
    const d = new Date(from);
    d.setDate(from.getDate() + i);
    return d;
  });
}

interface CellProps {
  day: Date;
  sel: boolean;
  tod: boolean;
  wknd: boolean;
  past: boolean;
  onSelect: (d: Date | null) => void;
}

const DateCell = React.memo(
  function DateCell({ day, sel, tod, wknd, past, onSelect }: CellProps) {
    const scale = useRef(new Animated.Value(1)).current;
    const flash = useRef(new Animated.Value(0)).current;
    const mounted = useRef(false);

    useEffect(() => {
      if (!mounted.current) {
        mounted.current = true;
        return;
      }
      if (sel) {
        scale.setValue(0.8);
        flash.setValue(0.6);
        Animated.parallel([
          Animated.spring(scale, {
            toValue: 1,
            speed: 24,
            bounciness: 11,
            useNativeDriver: true,
          }),
          Animated.timing(flash, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        Animated.spring(scale, {
          toValue: 1,
          speed: 30,
          bounciness: 0,
          useNativeDriver: true,
        }).start();
      }
    }, [sel]);

    const handlePress = useCallback(() => {
      if (sel) {
        scale.setValue(0.88);
        Animated.spring(scale, {
          toValue: 1,
          speed: 20,
          bounciness: 6,
          useNativeDriver: true,
        }).start();
      }
      onSelect(sel ? null : day);
    }, [sel, day, onSelect]);

    const accent = wknd;

    const abbrColor = sel ? "#fff" : accent ? RED : past ? "#bbb" : "#111";
    const numColor = sel ? "#fff" : accent ? RED : past ? "#bbb" : "#111";

    return (
      <Pressable onPress={handlePress} style={s.cellWrap}>
        <Animated.View
          style={[
            s.cell,
            sel && s.cellSel,
            tod && !sel && s.cellToday,
            { transform: [{ scale }] },
          ]}
        >
          {sel && (
            <Animated.View
              style={[StyleSheet.absoluteFill, s.cellFlash, { opacity: flash }]}
              pointerEvents="none"
            />
          )}
          <Text style={[s.abbr, { color: abbrColor }]}>
            {DAY_RU[day.getDay()]}
          </Text>
          <Text style={[s.num, { color: numColor }]}>{day.getDate()}</Text>
        </Animated.View>
      </Pressable>
    );
  },
  (prev, next) =>
    prev.sel === next.sel &&
    prev.tod === next.tod &&
    prev.onSelect === next.onSelect,
);

export interface DateStripProps {
  selected: Date | null;
  onSelect: (date: Date | null) => void;
  disabled?: boolean;
}

export const DateStrip = React.memo(function DateStrip({
  selected,
  onSelect,
  disabled = false,
}: DateStripProps) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const days = useMemo(() => buildDays(today), [today]);
  const todayTime = today.getTime();
  const monthBounds = useMemo(() => {
    const bounds: { name: string; x: number }[] = [
      { name: MONTHS_RU[days[0].getMonth()], x: 0 },
    ];
    for (let i = 1; i < days.length; i++) {
      if (days[i].getDate() === 1) {
        bounds.push({ name: MONTHS_RU[days[i].getMonth()], x: i * CELL_W });
      }
    }
    return bounds;
  }, [days]);

  const scrollXAnim = useRef(new Animated.Value(0)).current;

  const [primMonth, setPrimMonth] = useState(
    () => MONTHS_RU[days[0].getMonth()],
  );
  const [secMonth, setSecMonth] = useState<string | null>(null);

  // secBaseX = content-x of the next month boundary ("1st" cell)
  const secBaseX = useRef(new Animated.Value(FAR)).current;

  // dist = viewport position of the next "1st" cell
  //   > SCREEN_W  → off-screen right  → sec hidden
  //   [0, SCREEN_W] → entering screen  → sec tracks cell
  //   ≤ 0         → past left edge    → sec locked at left:16
  const dist = useMemo(() => Animated.subtract(secBaseX, scrollXAnim), []);

  // Secondary translateX = clamp(dist, 0, SCREEN_W)
  // Ties the label physically to the "1st" cell position in the viewport.
  const secTranslateX = useMemo(
    () =>
      dist.interpolate({
        inputRange: [0, SCREEN_W],
        outputRange: [0, SCREEN_W],
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }),
    [],
  );

  // Primary opacity = clamp(dist / SCREEN_W, 0, 1).
  // No extra Animated.Value — purely scroll-driven via native driver.
  // WHY this works at crossing:
  //   Forward: dist ≈ 0 at crossing → primOpacity ≈ 0 → primary invisible while
  //            text changes. After secBaseX jumps to next boundary, dist >> SCREEN_W
  //            → primOpacity = 1 → primary visible with correct committed text.
  //   Backward: dist increases with scroll → primary fades in instantly (no delay).
  const primOpacity = useMemo(
    () =>
      dist.interpolate({
        inputRange: [0, 160],
        outputRange: [0, 1],
        extrapolate: "clamp",
      }),
    [],
  );

  const lastPrimRef = useRef(MONTHS_RU[days[0].getMonth()]);
  const lastPrimIdxRef = useRef(0);
  const lastSecXRef = useRef(-1);
  const pendingSecXRef = useRef<number>(FAR);
  const pendingSecNameRef = useRef<string | null>(null);
  const crossingRef = useRef(false);
  const crossingFwdRef = useRef(false);
  const lastCheckedXRef = useRef(0);

  // After primMonth text commits to native:
  // - Always: move secBaseX to pending position (safe — text already committed)
  // - Forward only: also update secMonth text (was kept stable during crossing)
  useEffect(() => {
    if (!crossingRef.current) return;
    crossingRef.current = false;
    secBaseX.setValue(pendingSecXRef.current);
    if (crossingFwdRef.current) {
      crossingFwdRef.current = false;
      setSecMonth(pendingSecNameRef.current);
    }
  }, [primMonth]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const firstNext = monthBounds.find((b) => b.x > 0);
    if (firstNext) {
      secBaseX.setValue(firstNext.x);
      setSecMonth(firstNext.name);
      lastSecXRef.current = firstNext.x;
    }
    lastPrimRef.current = MONTHS_RU[days[0].getMonth()];
    lastPrimIdxRef.current = 0;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onScrollHandler = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { x: scrollXAnim } } }], {
        useNativeDriver: true,
        listener: (e: any) => {
          const x: number = e.nativeEvent.contentOffset.x;

          // Cheap early-out: the boundary search only needs to re-run once
          // we've moved roughly a cell's width — skips most of the 60fps
          // callbacks during a scroll without affecting the (native-driven,
          // untouched) label opacity/position animation.
          if (Math.abs(x - lastCheckedXRef.current) < CELL_W) return;
          lastCheckedXRef.current = x;

          let prim = monthBounds[0];
          let primIdx = 0;
          let next: { name: string; x: number } | null = null;
          for (let i = 0; i < monthBounds.length; i++) {
            if (monthBounds[i].x <= x) {
              prim = monthBounds[i];
              primIdx = i;
            } else {
              next = monthBounds[i];
              break;
            }
          }

          if (prim.name !== lastPrimRef.current) {
            const isForward = primIdx > lastPrimIdxRef.current;
            lastPrimRef.current = prim.name;
            lastPrimIdxRef.current = primIdx;
            lastSecXRef.current = next?.x ?? -1;
            pendingSecXRef.current = next?.x ?? FAR;
            pendingSecNameRef.current = next?.name ?? null;
            crossingRef.current = true;
            crossingFwdRef.current = isForward;

            setPrimMonth(prim.name);

            if (!isForward) {
              // Backward: secBaseX is at the old (far) boundary → secondary off-screen.
              // Safe to update secMonth text now while off-screen.
              // secBaseX moves to new position in useEffect after primMonth commits.
              setSecMonth(next?.name ?? null);
            }
            // Forward: secondary is visible at left:16 with correct current text.
            // Keep secMonth stable here; useEffect will update it after secBaseX moves.
            return;
          }

          const newSecX = next?.x ?? -1;
          if (newSecX !== lastSecXRef.current) {
            lastSecXRef.current = newSecX;
            if (next) {
              secBaseX.setValue(next.x);
              setSecMonth(next.name);
            } else {
              secBaseX.setValue(FAR);
              setSecMonth(null);
            }
          }
        },
      }),
    [monthBounds],
  );

  const handleCellSelect = useCallback(
    (d: Date | null) => onSelect(d),
    [onSelect],
  );

  return (
    <View style={[s.wrap, disabled && s.wrapDisabled]}>
      <View style={s.monthRow} pointerEvents="none">
        <Animated.Text style={[s.monthLabel, { opacity: primOpacity }]}>
          {primMonth}
        </Animated.Text>
        {secMonth && (
          <Animated.Text
            style={[s.secLabel, { transform: [{ translateX: secTranslateX }] }]}
          >
            {secMonth}
          </Animated.Text>
        )}
      </View>

      <Animated.ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={onScrollHandler}
        scrollEventThrottle={16}
        bounces={false}
        overScrollMode="never"
        scrollEnabled={!disabled}
        pointerEvents={disabled ? 'none' : 'auto'}
      >
        {days.map((day, i) => {
          const jsDay = day.getDay();
          const sel =
            selected !== null &&
            day.getFullYear() === selected.getFullYear() &&
            day.getMonth() === selected.getMonth() &&
            day.getDate() === selected.getDate();
          return (
            <DateCell
              key={i}
              day={day}
              sel={sel}
              tod={day.getTime() === todayTime}
              wknd={jsDay === 0 || jsDay === 6}
              past={day.getTime() < todayTime}
              onSelect={handleCellSelect}
            />
          );
        })}
      </Animated.ScrollView>
    </View>
  );
});

const s = StyleSheet.create({
  wrap: {
    paddingTop: 6,
    paddingBottom: 8,
    paddingLeft: 16,
  },
  wrapDisabled: {
    opacity: 0.4,
  },

  monthRow: {
    height: 22,
    marginBottom: 4,
    overflow: "hidden",
  },

  monthLabel: {
    position: "absolute",
    left: 0,
    top: 0,
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.text1,
  },

  secLabel: {
    position: "absolute",
    left: 0,
    top: 0,
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.text1,
  },

  cellWrap: {
    width: CELL_W,
    alignItems: "center",
  },

  cell: {
    width: CELL_W - 4,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 10,
    gap: 3,
    overflow: "hidden",
  },

  cellSel: {
    backgroundColor: COLORS.brandNavy,
  },

  cellToday: {
    borderWidth: 1,
    borderColor: COLORS.brandNavy,
    paddingVertical: 7,
  },

  cellFlash: {
    borderRadius: 10,
    backgroundColor: "#fff",
  },

  abbr: {
    fontSize: 12,
    fontWeight: "400",
  },

  num: {
    fontSize: 15,
    fontWeight: "500",
  },
});
