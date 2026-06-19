import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { COLORS } from '@/shared/colors';
import { MONTHS_RU } from '../constants';

const SCREEN_W = Dimensions.get('window').width;
const DS_CELL_W = Math.round(SCREEN_W / 9);
const DS_TOTAL = 240;
const DS_PAST = 1;
const DAY_BY_JS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const FAR = DS_TOTAL * DS_CELL_W + 9999;

interface DateStripProps {
  selected: Date | null;
  onSelect: (date: Date | null) => void;
}

function buildAllDays(today: Date): Date[] {
  return Array.from({ length: DS_TOTAL }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - DS_PAST + i);
    return d;
  });
}

export const DateStrip = React.memo(function DateStrip({
  selected,
  onSelect,
}: DateStripProps) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const days = useMemo(() => buildAllDays(today), [today]);
  const scrollRef = useRef<ScrollView>(null);

  const monthBounds = useMemo(() => {
    const bounds: { name: string; x: number }[] = [
      { name: MONTHS_RU[days[0].getMonth()], x: 0 },
    ];
    for (let i = 1; i < days.length; i++) {
      if (days[i].getDate() === 1) {
        bounds.push({ name: MONTHS_RU[days[i].getMonth()], x: i * DS_CELL_W });
      }
    }
    return bounds;
  }, [days]);

  const scrollXAnim = useRef(new Animated.Value(DS_PAST * DS_CELL_W)).current;
  const [primMonth, setPrimMonth] = useState(() => MONTHS_RU[days[DS_PAST].getMonth()]);
  const [secMonth, setSecMonth] = useState<string | null>(null);

  // secBaseX starts FAR so dist is huge (primary fully visible, secondary hidden)
  const secBaseX = useRef(new Animated.Value(FAR)).current;

  // dist = secBaseX - scrollXAnim (how far next boundary is from left edge)
  const dist = useMemo(() => Animated.subtract(secBaseX, scrollXAnim), []);

  // Secondary left: clamp at 16 when dist ≤ 0 — stays at primary position instead of sliding left
  const secLabelLeft = useMemo(
    () => dist.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 17],
      extrapolateLeft: 'clamp',
      extrapolateRight: 'extend',
    }),
    [],
  );

  // Primary fades out as secondary approaches (dist 120→0 → opacity 1→0)
  const primOpacity = useMemo(
    () => dist.interpolate({ inputRange: [0, 120], outputRange: [0, 1], extrapolate: 'clamp' }),
    [],
  );

  // primFadeIn: 1 normally; 0 at crossing; then Animated.timing 0→1 (smooth fade-in with correct text)
  const primFadeIn = useRef(new Animated.Value(1)).current;
  const primFinalOpacity = useMemo(() => Animated.multiply(primOpacity, primFadeIn), []);
  const crossingAnim = useRef<Animated.CompositeAnimation | null>(null);

  const lastPrimRef = useRef('');
  const lastSecXRef = useRef(-1);

  const onScrollHandler = useMemo(
    () =>
      Animated.event(
        [{ nativeEvent: { contentOffset: { x: scrollXAnim } } }],
        {
          useNativeDriver: false,
          listener: (e: any) => {
            const x: number = e.nativeEvent.contentOffset.x;

            let prim = monthBounds[0];
            let next: { name: string; x: number } | null = null;
            for (let i = 0; i < monthBounds.length; i++) {
              if (monthBounds[i].x <= x) { prim = monthBounds[i]; }
              else { next = monthBounds[i]; break; }
            }

            if (prim.name !== lastPrimRef.current) {
              lastPrimRef.current = prim.name;
              lastSecXRef.current = next?.x ?? -1;

              // Stop any running fade-in, hide primary instantly
              crossingAnim.current?.stop();
              primFadeIn.setValue(0);

              setPrimMonth(prim.name);

              // Defer secBaseX jump until after React renders new primMonth text.
              // During the gap: dist is slightly negative → secLabel locked at 16 →
              // secondary still shows new month name at left:16. Zero flash.
              const capturedNext = next;
              requestAnimationFrame(() => {
                secBaseX.setValue(capturedNext?.x ?? FAR);
                setSecMonth(capturedNext?.name ?? null);
                // Fade primary in with correct text — 200ms smooth
                crossingAnim.current = Animated.timing(primFadeIn, {
                  toValue: 1,
                  duration: 200,
                  useNativeDriver: false,
                });
                crossingAnim.current.start();
              });
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
        },
      ),
    [monthBounds],
  );

  useEffect(() => {
    const initX = DS_PAST * DS_CELL_W;
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ x: initX, animated: false });
    });
    const firstNext = monthBounds.find((b) => b.x > initX);
    if (firstNext) {
      secBaseX.setValue(firstNext.x);
      setSecMonth(firstNext.name);
      lastSecXRef.current = firstNext.x;
    } else {
      secBaseX.setValue(FAR);
    }
    lastPrimRef.current = MONTHS_RU[days[DS_PAST].getMonth()];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isSel = useCallback(
    (d: Date) =>
      selected !== null &&
      d.getFullYear() === selected.getFullYear() &&
      d.getMonth() === selected.getMonth() &&
      d.getDate() === selected.getDate(),
    [selected],
  );

  return (
    <View style={ds.wrap}>
      <View style={ds.monthRow} pointerEvents="none">
        <Animated.Text style={[ds.primMonth, { opacity: primFinalOpacity }]}>
          {primMonth}
        </Animated.Text>
        {secMonth && (
          <Animated.Text style={[ds.secMonth, { left: secLabelLeft }]}>
            {secMonth}
          </Animated.Text>
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={onScrollHandler}
        scrollEventThrottle={16}
        bounces={false}
        overScrollMode="never"
      >
        {days.map((day, i) => {
          const jsDay = day.getDay();
          const wknd = jsDay === 0 || jsDay === 6;
          const sel = isSel(day);
          const tod = day.getTime() === today.getTime();
          const past = day < today;
          return (
            <Pressable
              key={i}
              style={[ds.cell, sel && ds.cellSel, tod && !sel && ds.cellToday]}
              onPress={() => onSelect(sel ? null : day)}
            >
              <Text
                style={[
                  ds.abbr,
                  wknd && ds.red,
                  sel && ds.wt,
                  tod && !sel && ds.navy,
                ]}
              >
                {DAY_BY_JS[jsDay]}
              </Text>
              <Text
                style={[
                  ds.num,
                  wknd && ds.red,
                  sel && ds.wt,
                  tod && !sel && ds.navy,
                  past && ds.dim,
                ]}
              >
                {day.getDate()}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
});

const ds = StyleSheet.create({
  wrap: { paddingTop: 8, paddingBottom: 4 },
  monthRow: { height: 22, marginBottom: 4 },
  primMonth: {
    position: 'absolute',
    left: 16,
    top: 0,
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  secMonth: {
    position: 'absolute',
    top: 0,
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  cell: {
    width: DS_CELL_W,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 3,
  },
  cellSel: { backgroundColor: COLORS.brandNavy },
  cellToday: { borderWidth: 1.5, borderColor: COLORS.brandNavy },
  abbr: { fontSize: 11, fontWeight: '400', color: '#888' },
  num: { fontSize: 17, fontWeight: '500', color: '#000' },
  red: { color: '#D93025' },
  wt: { color: '#fff' },
  navy: { color: COLORS.brandNavy, fontWeight: '700' },
  dim: { opacity: 0.38 },
});
