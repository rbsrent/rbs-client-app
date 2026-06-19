import { Calendar, ChevronRight, Clock, Pencil } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/shared/colors';
import { CalendarPicker, fmtDateFull } from '@/shared/components/CalendarPicker';

import { durLabel, fmtHour, ruFmt } from '../utils';

// ─── Props ────────────────────────────────────────────────────────────────────

interface BookingStep1Props {
  date: Date;
  onDateChange: (d: Date) => void;
  timeConfirmed: boolean;
  startHour: number;
  duration: number;
  onOpenSheet: () => void;
  totalAfterPromo: number;
  boat: { price_per_hour: number };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BookingStep1({
  date,
  onDateChange,
  timeConfirmed,
  startHour,
  duration,
  onOpenSheet,
  totalAfterPromo,
  boat,
}: BookingStep1Props) {
  return (
    <View style={s.stepBody}>
      <CalendarPicker selected={date} onSelect={onDateChange} collapsible={false} />

      <Text style={s.secLabel}>Время и продолжительность</Text>

      {timeConfirmed ? (
        /* Selected time row */
        <Pressable style={s.timeConfirmedRow} onPress={onOpenSheet}>
          <View style={s.timeConfirmedLeft}>
            <Clock size={16} color={COLORS.brandNavy} strokeWidth={2} />
            <View>
              <Text style={s.timeConfirmedMain}>
                {fmtHour(startHour)} – {fmtHour(startHour + duration)}
              </Text>
              <Text style={s.timeConfirmedSub}>{durLabel(duration)}</Text>
            </View>
          </View>
          <View style={s.timeEditBadge}>
            <Pencil size={12} color={COLORS.brandNavy} strokeWidth={2} />
            <Text style={s.timeEditTxt}>Изменить</Text>
          </View>
        </Pressable>
      ) : (
        /* CTA to open sheet */
        <Pressable style={s.timeSelectBtn} onPress={onOpenSheet}>
          <Clock size={18} color={COLORS.brandNavy} strokeWidth={1.8} />
          <Text style={s.timeSelectTxt}>Выбрать время</Text>
          <ChevronRight size={16} color={COLORS.text3} strokeWidth={2} />
        </Pressable>
      )}

      {/* Summary pill */}
      {timeConfirmed && (
        <View style={s.summaryPill}>
          <View style={s.summaryPillLeft}>
            <Calendar size={14} color={COLORS.brandNavy} strokeWidth={1.8} />
            <View>
              <Text style={s.summaryDate}>{fmtDateFull(date)}</Text>
              <Text style={s.summaryTime}>
                {fmtHour(startHour)} – {fmtHour(startHour + duration)} · {durLabel(duration)}
              </Text>
            </View>
          </View>
          <Text style={s.summaryPrice}>{ruFmt((boat.price_per_hour ?? 0) * duration)} ₽</Text>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  stepBody:  { marginHorizontal: 16, marginTop: 8, gap: 4 },
  secLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.text3,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 18,
    marginBottom: 8,
  },

  timeSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  timeSelectTxt: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.text1 },

  timeConfirmedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: COLORS.brandNavy + '08',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.brandNavy + '30',
  },
  timeConfirmedLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  timeConfirmedMain: { fontSize: 16, fontWeight: '700', color: COLORS.brandNavy },
  timeConfirmedSub:  { fontSize: 12, color: COLORS.text3, marginTop: 1 },
  timeEditBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  timeEditTxt: { fontSize: 12, fontWeight: '600', color: COLORS.brandNavy },

  summaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    padding: 14,
    backgroundColor: COLORS.brandNavy + '08',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.brandNavy + '20',
    gap: 12,
  },
  summaryPillLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  summaryDate:     { fontSize: 13, fontWeight: '700', color: COLORS.text1 },
  summaryTime:     { fontSize: 12, color: COLORS.text2, marginTop: 1 },
  summaryPrice:    { fontSize: 18, fontWeight: '800', color: COLORS.brandNavy },
});
