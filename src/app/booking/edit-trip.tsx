import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Clock, MapPin } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PierMapSheet } from '@/features/booking/components/PierMapSheet';
import { TimeSlotSheet } from '@/features/booking/components/TimeSlotSheet';
import { getCachedPiers, resolveTripEdit } from '@/features/booking/tripEditResult';
import type { Pier } from '@/features/booking/types';
import { durLabel, fmtHour } from '@/features/booking/utils';
import { COLORS } from '@/shared/colors';
import { CalendarPicker, fmtDateFull } from '@/shared/components/CalendarPicker';

export default function EditTripScreen() {
  const insets = useSafeAreaInsets();
  const router  = useRouter();
  const {
    boatId,
    date:        dateParam,
    startHour:   hourParam,
    duration:    durParam,
    pierId,
    minDuration: minDurParam,
  } = useLocalSearchParams<{
    boatId: string;
    date?: string;
    startHour?: string;
    duration?: string;
    pierId?: string;
    minDuration?: string;
  }>();

  const minDuration = minDurParam ? Math.max(1, Number(minDurParam)) : 1;

  const piers = getCachedPiers();

  const [date, setDate] = useState<Date>(() => {
    if (dateParam) {
      const d = new Date(dateParam);
      if (!isNaN(d.getTime())) { d.setHours(0, 0, 0, 0); return d; }
    }
    const d = new Date(); d.setHours(0, 0, 0, 0); return d;
  });

  const [startHour,     setStartHour]     = useState<number>(() => hourParam && hourParam !== '-1' ? Number(hourParam) : -1);
  const [duration,      setDuration]      = useState<number>(() => durParam ? Number(durParam) : 0);
  const [timeConfirmed, setTimeConfirmed] = useState(() => !!hourParam && hourParam !== '-1' && !!durParam);

  const [selectedPier, setSelectedPier] = useState<Pier | null>(() => {
    if (pierId) return piers.find((p) => p.id === pierId) ?? piers[0] ?? null;
    return piers[0] ?? null;
  });

  const [timeSheetOpen, setTimeSheetOpen] = useState(false);
  const [pierSheetOpen, setPierSheetOpen] = useState(false);

  const canConfirm = timeConfirmed && !!selectedPier;

  const handleConfirm = () => {
    resolveTripEdit({ date, startHour, duration, pier: selectedPier });
    router.back();
  };

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={8}>
          <ArrowLeft size={22} color={COLORS.text1} strokeWidth={2} />
        </Pressable>
        <Text style={s.headerTitle}>Изменить детали</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingBottom: 120 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Date */}
        <View style={s.section}>
          <CalendarPicker
            selected={date}
            onSelect={(d) => {
              setDate(d);
              setStartHour(-1);
              setDuration(0);
              setTimeConfirmed(false);
            }}
            collapsible={false}
          />
        </View>

        <View style={s.divider} />

        {/* Time */}
        <View style={s.card}>
          <Pressable style={s.row} onPress={() => setTimeSheetOpen(true)}>
            <View style={s.rowIcon}>
              <Clock size={15} color={COLORS.brandNavy} strokeWidth={2} />
            </View>
            <View style={s.rowBody}>
              <Text style={s.rowLabel}>Время и продолжительность</Text>
              {timeConfirmed
                ? <Text style={s.rowValue}>{fmtHour(startHour)} – {fmtHour(startHour + duration)} · {durLabel(duration)}</Text>
                : <Text style={s.rowPlaceholder}>Нажмите чтобы выбрать</Text>}
            </View>
            <Text style={s.rowAction}>Изменить</Text>
          </Pressable>
        </View>

        <View style={s.divider} />

        {/* Pier */}
        <View style={s.card}>
          <Pressable style={s.row} onPress={() => setPierSheetOpen(true)}>
            <View style={s.rowIcon}>
              <MapPin size={15} color={COLORS.brandNavy} strokeWidth={2} />
            </View>
            <View style={s.rowBody}>
              <Text style={s.rowLabel}>Место посадки</Text>
              {selectedPier
                ? <Text style={s.rowValue} numberOfLines={2}>{selectedPier.name}</Text>
                : <Text style={s.rowPlaceholder}>Нажмите чтобы выбрать</Text>}
              {selectedPier?.address
                ? <Text style={s.rowSub} numberOfLines={1}>{selectedPier.address}</Text>
                : null}
            </View>
            <Text style={s.rowAction}>Изменить</Text>
          </Pressable>
        </View>
      </ScrollView>

      <View style={[s.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          style={({ pressed }) => [
            s.confirmBtn,
            !canConfirm && s.confirmBtnDim,
            pressed && canConfirm && { opacity: 0.85 },
          ]}
          onPress={handleConfirm}
          disabled={!canConfirm}
        >
          <Text style={s.confirmTxt}>Подтвердить</Text>
        </Pressable>
      </View>

      <TimeSlotSheet
        visible={timeSheetOpen}
        date={date}
        boatId={boatId}
        minDuration={minDuration}
        onConfirm={(h, dur) => {
          setStartHour(h);
          setDuration(dur);
          setTimeConfirmed(true);
        }}
        onClose={() => setTimeSheetOpen(false)}
      />

      <PierMapSheet
        visible={pierSheetOpen}
        piers={piers}
        selectedPier={selectedPier}
        onSelect={(p) => setSelectedPier(p)}
        onClose={() => setPierSheetOpen(false)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: COLORS.backgroundAlt },
  header:      {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    height: 52, paddingHorizontal: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border,
  },
  backBtn:     { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text1 },

  scroll:        { flex: 1 },
  scrollContent: { paddingTop: 8 },

  section: { backgroundColor: COLORS.white },
  divider: { height: 8 },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 0,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  rowIcon: {
    width: 32, height: 32, borderRadius: 9,
    backgroundColor: COLORS.brandNavy + '12',
    alignItems: 'center', justifyContent: 'center',
  },
  rowBody:        { flex: 1, gap: 2 },
  rowLabel:       { fontSize: 11, color: COLORS.text3, fontWeight: '500' },
  rowValue:       { fontSize: 14, fontWeight: '600', color: COLORS.text1 },
  rowPlaceholder: { fontSize: 14, color: COLORS.text3 },
  rowSub:         { fontSize: 12, color: COLORS.text3 },
  rowAction:      { fontSize: 13, fontWeight: '600', color: COLORS.brandNavy },

  bottomBar: {
    paddingHorizontal: 16, paddingTop: 12,
    backgroundColor: COLORS.white,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 8,
  },
  confirmBtn:    { height: 54, backgroundColor: COLORS.brandNavy, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  confirmBtnDim: { backgroundColor: COLORS.muted },
  confirmTxt:    { fontSize: 16, fontWeight: '700', color: '#fff' },
});
