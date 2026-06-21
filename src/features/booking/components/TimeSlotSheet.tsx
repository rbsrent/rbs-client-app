import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Check, Clock, X } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SheetBackdrop } from '@/shared/components/SheetBackdrop';
import { COLORS } from '@/shared/colors';
import { publicSupabase } from '@/shared/supabase/publicClient';
import { Spinner } from '@/shared/components/Spinner';
import { computeSlotSelection, durLabel as durLabelUtil } from '../utils';

const { width: W } = Dimensions.get('window');

const MONTHS_S = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
const DAYS_S   = ['вс','пн','вт','ср','чт','пт','сб'];

function fmtDateShort(d: Date) {
  return `${d.getDate()} ${MONTHS_S[d.getMonth()]}, ${DAYS_S[d.getDay()]}`;
}
function fmtHour(h: number) { return `${String(h).padStart(2, '0')}:00`; }
function durLabel(h: number) { return h === 1 ? '1 час' : h < 5 ? `${h} часа` : `${h} часов`; }

interface TimeSlotSheetProps {
  visible: boolean;
  date: Date;
  boatId: string;
  minDuration?: number;
  onConfirm: (startHour: number, duration: number) => void;
  onClose: () => void;
}

export function TimeSlotSheet({
  visible,
  date,
  boatId,
  minDuration = 1,
  onConfirm,
  onClose,
}: TimeSlotSheetProps) {
  const insets = useSafeAreaInsets();
  const ref = useRef<BottomSheetModal>(null);

  const [busyHours, setBusyHours]         = useState<Set<number>>(new Set());
  const [loading, setLoading]             = useState(false);
  const [selectedHours, setSelectedHours] = useState<number[]>([]);

  const snapPoints = useMemo(() => ['72%'], []);

  /* ── open only; dismiss is handled internally or via onDismiss ── */
  useEffect(() => {
    if (visible) {
      setSelectedHours([]);
      ref.current?.present();
    }
  }, [visible]);

  /* ── fetch busy slots ── */
  useEffect(() => {
    if (!visible || !boatId) return;
    let cancelled = false;

    const fetchSlots = async () => {
      setLoading(true);
      setBusyHours(new Set());
      try {
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);

        const { data } = await publicSupabase.rpc('get_boat_busy_slots', {
          p_boat_id:        boatId,
          p_start_datetime: dayStart.toISOString(),
          p_end_datetime:   dayEnd.toISOString(),
        });

        if (cancelled) return;

        const busy = new Set<number>();
        (data ?? []).forEach((slot: { start_datetime: string; end_datetime: string }) => {
          const s = new Date(slot.start_datetime);
          const e = new Date(slot.end_datetime);
          for (let h = s.getHours(); h < e.getHours(); h++) busy.add(h);
        });
        setBusyHours(busy);
      } catch {
        /* treat as no constraints */
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchSlots();
    return () => { cancelled = true; };
  }, [visible, date, boatId]);

  const unavailable = useCallback((hour: number): boolean => {
    if (busyHours.has(hour)) return true;
    const now = new Date();
    if (date.toDateString() === now.toDateString() && hour <= now.getHours()) return true;
    return false;
  }, [busyHours, date]);

  const handleSlot = useCallback((hour: number) => {
    if (unavailable(hour)) return;
    setSelectedHours((prev) => computeSlotSelection(prev, hour, minDuration, unavailable));
  }, [unavailable, minDuration]);

  const canConfirm = selectedHours.length >= minDuration;

  const handleConfirm = useCallback(() => {
    if (!canConfirm) return;
    ref.current?.dismiss();
    onConfirm(selectedHours[0], selectedHours.length);
  }, [canConfirm, selectedHours, onConfirm]);

  const handleDismiss = useCallback(() => {
    onClose();
  }, [onClose]);

  const startH = selectedHours[0];
  const endH   = startH != null ? startH + selectedHours.length : null;

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={SheetBackdrop}
      backgroundStyle={s.sheetBg}
      handleComponent={() => (
        <View style={s.handleWrap}>
          <View style={s.handle} />
        </View>
      )}
      onDismiss={handleDismiss}
    >
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.sheetTitle}>Выберите время</Text>
          <Text style={s.sheetDate}>
            {fmtDateShort(date)}
            {minDuration > 1 ? `  ·  мин. ${durLabelUtil(minDuration)}` : ''}
          </Text>
        </View>
        <Pressable style={s.closeBtn} onPress={() => ref.current?.dismiss()} hitSlop={8}>
          <X size={18} color={COLORS.text2} strokeWidth={2} />
        </Pressable>
      </View>

      {/* Legend */}
      <View style={s.legend}>
        <View style={s.legendItem}>
          <View style={[s.legendDot, { backgroundColor: COLORS.brandNavy }]} />
          <Text style={s.legendTxt}>Выбрано</Text>
        </View>
        <View style={s.legendItem}>
          <View style={[s.legendDot, { backgroundColor: COLORS.backgroundAlt, borderWidth: 1, borderColor: COLORS.border }]} />
          <Text style={s.legendTxt}>Свободно</Text>
        </View>
        <View style={s.legendItem}>
          <View style={[s.legendDot, { backgroundColor: '#F3E8E8' }]} />
          <Text style={s.legendTxt}>Занято</Text>
        </View>
      </View>

      {/* Slot grid */}
      {loading ? (
        <View style={s.loader}>
          <Spinner />
          <Text style={s.loaderTxt}>Загружаем доступное время…</Text>
        </View>
      ) : (
        <BottomSheetScrollView
          contentContainerStyle={s.grid}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {Array.from({ length: 24 }, (_, hour) => {
            const busy     = busyHours.has(hour);
            const past     = unavailable(hour) && !busy;
            const off      = busy || past;
            const selected = selectedHours.includes(hour);
            const isFirst  = selected && hour === selectedHours[0];
            const isLast   = selected && hour === selectedHours[selectedHours.length - 1];

            return (
              <Pressable
                key={hour}
                style={({ pressed }) => [
                  s.slot,
                  off      && s.slotOff,
                  selected && s.slotSelected,
                  isFirst  && s.slotFirst,
                  isLast   && s.slotLast,
                  !off && !selected && pressed && s.slotPressed,
                ]}
                onPress={() => handleSlot(hour)}
                disabled={off}
              >
                <Text
                  style={[
                    s.slotTxt,
                    off      && s.slotTxtOff,
                    selected && s.slotTxtSelected,
                  ]}
                >
                  {fmtHour(hour)}
                </Text>
                {isFirst && !isLast && <View style={s.slotDot} />}
                {(isLast || (isFirst && isLast)) && (
                  <Check size={11} color="#fff" strokeWidth={3} />
                )}
                {busy && <Text style={s.slotBusyLabel}>занято</Text>}
              </Pressable>
            );
          })}
        </BottomSheetScrollView>
      )}

      {/* Bottom confirm bar */}
      <View style={[s.confirmBar, { paddingBottom: insets.bottom + 12 }]}>
        {selectedHours.length > 0 ? (
          <View style={s.selectionInfo}>
            <Clock size={14} color={COLORS.brandNavy} strokeWidth={2} />
            <Text style={s.selectionTxt}>
              {fmtHour(startH!)} – {fmtHour(endH!)}
            </Text>
            <View style={s.durBadge}>
              <Text style={s.durBadgeTxt}>{durLabel(selectedHours.length)}</Text>
            </View>
          </View>
        ) : (
          <Text style={s.selectionHint}>Выберите начало и продолжительность</Text>
        )}
        <Pressable
          style={({ pressed }) => [
            s.confirmBtn,
            !canConfirm && s.confirmBtnDim,
            pressed && canConfirm && { opacity: 0.85 },
          ]}
          onPress={handleConfirm}
          disabled={!canConfirm}
        >
          <Text style={s.confirmTxt}>Выбрать</Text>
        </Pressable>
      </View>
    </BottomSheetModal>
  );
}

/* ─── styles ─── */
const COLS   = 4;
const SLOT_W = (W - 32 - (COLS - 1) * 8) / COLS;

const s = StyleSheet.create({
  sheetBg: { backgroundColor: COLORS.white, borderTopLeftRadius: 22, borderTopRightRadius: 22 },

  handleWrap: { alignItems: 'center', paddingTop: 10, paddingBottom: 4 },
  handle:     { width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.border },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text1 },
  sheetDate:  { fontSize: 13, color: COLORS.text3, marginTop: 2 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.backgroundAlt,
    alignItems: 'center', justifyContent: 'center',
  },

  legend: { flexDirection: 'row', gap: 16, paddingHorizontal: 20, paddingVertical: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot:  { width: 12, height: 12, borderRadius: 3 },
  legendTxt:  { fontSize: 11, color: COLORS.text3 },

  loader:    { alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 40 },
  loaderTxt: { fontSize: 13, color: COLORS.text3 },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 16,
  },
  slot: {
    width: SLOT_W, height: 46,
    borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    alignItems: 'center', justifyContent: 'center', gap: 2,
  },
  slotOff:      { backgroundColor: '#F8ECEC', borderColor: '#EDD5D5', opacity: 0.7 },
  slotSelected: { backgroundColor: COLORS.brandNavy, borderColor: COLORS.brandNavy },
  slotFirst:    { borderBottomLeftRadius: 4, borderBottomRightRadius: 4 },
  slotLast:     { borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  slotPressed:  { backgroundColor: COLORS.brandNavy + '12' },

  slotTxt:         { fontSize: 13, fontWeight: '600', color: COLORS.text1 },
  slotTxtOff:      { color: '#C09090', fontWeight: '400' },
  slotTxtSelected: { color: '#fff' },
  slotBusyLabel:   { fontSize: 9, color: '#C09090' },
  slotDot: {
    width: 5, height: 5, borderRadius: 2.5,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },

  confirmBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: COLORS.divider,
    gap: 12,
  },
  selectionInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  selectionTxt:  { fontSize: 15, fontWeight: '700', color: COLORS.brandNavy },
  durBadge: {
    backgroundColor: COLORS.brandNavy + '15',
    borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3,
  },
  durBadgeTxt:   { fontSize: 11, color: COLORS.brandNavy, fontWeight: '600' },
  selectionHint: { flex: 1, fontSize: 12, color: COLORS.text3 },

  confirmBtn: {
    backgroundColor: COLORS.brandNavy,
    borderRadius: 12, paddingHorizontal: 22, paddingVertical: 12,
    alignItems: 'center',
  },
  confirmBtnDim: { backgroundColor: COLORS.muted },
  confirmTxt: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
