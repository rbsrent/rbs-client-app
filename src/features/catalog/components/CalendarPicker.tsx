import { ArrowLeft, ChevronRight } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";

import { COLORS } from "@/shared/colors";
import { DAYS_SHORT, MONTHS_RU } from "../constants";
import { fmtFull } from "../utils/filterUtils";

const SCREEN_W = Dimensions.get("window").width;
const CELL_SIZE = Math.floor((SCREEN_W - 40 - 16) / 7);

interface CalendarPickerProps {
  /** Tanggal yang dipilih (null jika belum ada) */
  selected: Date | null;
  /** Callback ketika pengguna memilih tanggal */
  onSelect: (date: Date) => void;
}

export function CalendarPicker({ selected, onSelect }: CalendarPickerProps) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [viewMonth, setViewMonth] = useState(() => {
    const b = selected ?? new Date();
    return new Date(b.getFullYear(), b.getMonth(), 1);
  });

  const [open, setOpen] = useState(true);

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();

  // Generate calendar grid
  const cells = useMemo(() => {
    const offset = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev = new Date(year, month, 0).getDate();
    const arr: Array<{ day: number; thisMonth: boolean; date: Date }> = [];

    // Previous month's trailing days
    for (let i = offset - 1; i >= 0; i--) {
      arr.push({
        day: daysInPrev - i,
        thisMonth: false,
        date: new Date(year, month - 1, daysInPrev - i),
      });
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      arr.push({ day: d, thisMonth: true, date: new Date(year, month, d) });
    }

    // Next month's leading days
    const rem = arr.length % 7;
    if (rem > 0) {
      for (let d = 1; d <= 7 - rem; d++) {
        arr.push({
          day: d,
          thisMonth: false,
          date: new Date(year, month + 1, d),
        });
      }
    }
    return arr;
  }, [year, month]);

  const isSelected = (d: Date) =>
    selected !== null &&
    d.getFullYear() === selected.getFullYear() &&
    d.getMonth() === selected.getMonth() &&
    d.getDate() === selected.getDate();

  // Collapsed view
  if (!open) {
    return (
      <Pressable style={cs.collapsed} onPress={() => setOpen(true)}>
        <Text style={cs.collapsedLabel}>Выбранная дата</Text>
        <View style={cs.collapsedRow}>
          <Text style={cs.collapsedDate}>
            {selected ? fmtFull(selected) : "Выберите дату"}
          </Text>
          <ChevronRight size={15} color={COLORS.brandNavy} strokeWidth={2} />
        </View>
      </Pressable>
    );
  }

  // Expanded calendar
  return (
    <View>
      {/* Month navigation */}
      <View style={cs.monthNav}>
        <Pressable
          onPress={() => setViewMonth(new Date(year, month - 1, 1))}
          hitSlop={14}
        >
          <ArrowLeft size={20} color={COLORS.text2} strokeWidth={2} />
        </Pressable>
        <Text style={cs.monthTitle}>
          {MONTHS_RU[month]} {year}
        </Text>
        <Pressable
          onPress={() => setViewMonth(new Date(year, month + 1, 1))}
          hitSlop={14}
        >
          <ChevronRight size={20} color={COLORS.text2} strokeWidth={2} />
        </Pressable>
      </View>

      {/* Day-of-week headers */}
      <View style={cs.dayRow}>
        {DAYS_SHORT.map((d) => (
          <View key={d} style={cs.cell}>
            <Text style={cs.dayHdr}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      {Array.from({ length: Math.ceil(cells.length / 7) }, (_, w) =>
        cells.slice(w * 7, w * 7 + 7)
      ).map((week, wi) => (
        <View key={wi} style={cs.dayRow}>
          {week.map((cell, ci) => {
            const past = cell.date < today && cell.thisMonth;
            const sel = isSelected(cell.date);
            const isToday = cell.date.getTime() === today.getTime();

            return (
              <Pressable
                key={ci}
                style={[
                  cs.cell,
                  cs.cellP,
                  sel && cs.cellSel,
                  isToday && !sel && cs.cellToday,
                ]}
                onPress={() => {
                  if (!past && cell.thisMonth) {
                    onSelect(cell.date);
                    setOpen(false);
                  }
                }}
                disabled={past || !cell.thisMonth}
              >
                <Text
                  style={[
                    cs.cellTxt,
                    !cell.thisMonth && cs.cellOther,
                    past && cs.cellPast,
                    isToday && !sel && cs.cellTodayTxt,
                    sel && cs.cellSelTxt,
                  ]}
                >
                  {cell.day}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const cs = StyleSheet.create({
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
    backgroundColor: COLORS.backgroundAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
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