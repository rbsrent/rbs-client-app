import { Moon, Sun } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/shared/colors';
import { formatRub } from '@/shared/utils/currency';

export interface BoatBookingBarProps {
  pricePerHour: number;
  priceNight?: number | null;
  onBook: () => void;
  paddingBottom: number;
}

export default function BoatBookingBar({
  pricePerHour,
  priceNight,
  onBook,
  paddingBottom,
}: BoatBookingBarProps) {
  return (
    <View style={[s.bookingBar, { paddingBottom }]}>
      <View style={s.priceBlock}>
        <View style={s.priceRow}>
          <Sun size={13} color={COLORS.warning} strokeWidth={2} />
          <Text style={s.priceMain}>{formatRub(pricePerHour)}</Text>
          <Text style={s.priceUnit}>/час</Text>
        </View>
        {priceNight ? (
          <View style={s.priceNightRow}>
            <Moon size={11} color={COLORS.brandViolet} strokeWidth={2} />
            <Text style={s.priceNightTxt}>
              {formatRub(priceNight)}/час ночью
            </Text>
          </View>
        ) : (
          <Text style={s.bookingUnit}>за час · день</Text>
        )}
      </View>
      <Pressable
        style={({ pressed }) => [s.bookBtn, pressed && { opacity: 0.82 }]}
        onPress={onBook}
      >
        <Text style={s.bookBtnText}>Забронировать</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  bookingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 10,
    gap: 14,
  },
  priceBlock: { flex: 1, gap: 3, minWidth: 0 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, flexWrap: 'wrap' },
  priceMain: { fontSize: 22, fontWeight: '800', color: COLORS.brandNavy },
  priceUnit: { fontSize: 13, color: COLORS.text2, fontWeight: '500' },
  priceNightRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  priceNightTxt: { fontSize: 12, color: COLORS.brandViolet, fontWeight: '500', flexShrink: 1 },
  bookingUnit: { fontSize: 12, color: COLORS.text3 },
  bookBtn: {
    minWidth: 158,
    borderRadius: 14,
    backgroundColor: COLORS.brandNavy,
    paddingVertical: 15,
    alignItems: 'center',
    flexShrink: 0,
  },
  bookBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },
});
