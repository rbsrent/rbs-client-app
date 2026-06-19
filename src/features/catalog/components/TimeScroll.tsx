import { COLORS } from '@/shared/colors';
import { useEffect, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { TIME_OPTS } from '../constants';
import { fmtHour } from '../utils/filterUtils';

const TIME_CHIP_W = 68;
const TIME_CHIP_GAP = 8;

interface TimeScrollProps {
  selected: number;
  onSelect: (hour: number) => void;
}

export function TimeScroll({ selected, onSelect }: TimeScrollProps) {
  const ref = useRef<ScrollView>(null);

  useEffect(() => {
    const idx = TIME_OPTS.indexOf(selected);
    if (idx < 0) return;
    const t = setTimeout(() => {
      ref.current?.scrollTo({ x: idx * (TIME_CHIP_W + TIME_CHIP_GAP), animated: true });
    }, 80);
    return () => clearTimeout(t);
  }, [selected]);

  return (
    <ScrollView
      ref={ref}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: TIME_CHIP_GAP, paddingBottom: 4 }}
      decelerationRate="fast"
    >
      {TIME_OPTS.map((h) => {
        const on = selected === h;
        return (
          <Pressable
            key={h}
            style={[ts.chip, on && ts.chipOn]}
            onPress={() => onSelect(h)}
          >
            <Text style={[ts.txt, on && ts.txtOn]}>{fmtHour(h)}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const ts = StyleSheet.create({
  chip: {
    width: TIME_CHIP_W,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.backgroundAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipOn: { backgroundColor: COLORS.brandNavy, borderColor: COLORS.brandNavy },
  txt: { fontSize: 14, fontWeight: '600', color: COLORS.text2 },
  txtOn: { color: COLORS.white },
});