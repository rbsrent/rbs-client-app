import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/shared/colors';
import { getBoatPriceInfo, ruFmtPrice } from '@/shared/utils/boatPrice';

export interface BoatBookingBarProps {
  pricePerHour:  number;
  priceNight?:   number | null;
  onBook:        () => void;
  paddingBottom: number;
}

export default function BoatBookingBar({ pricePerHour, priceNight, onBook, paddingBottom }: BoatBookingBarProps) {
  const { displayPrice, isNight } = getBoatPriceInfo(pricePerHour, priceNight);
  return (
    <View style={[s.bar, { paddingBottom }]}>
      {/* Price block */}
      <View style={s.priceBlock}>
        <View style={s.priceRow}>
          <Text style={s.priceMain}>{ruFmtPrice(displayPrice)} ₽</Text>
          <Text style={s.priceUnit}> / час</Text>
        </View>
        {isNight && priceNight ? (
          <Text style={s.priceSub}>ночной тариф</Text>
        ) : priceNight ? (
          <Text style={s.priceSub}>ночью {ruFmtPrice(priceNight)} ₽/ч</Text>
        ) : (
          <Text style={s.priceSub}>за 1 час · день</Text>
        )}
      </View>

      {/* Book button */}
      <Pressable style={({ pressed }) => [s.btn, pressed && { opacity: 0.88 }]} onPress={onBook}>
        <Text style={s.btnTxt}>Забронировать</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: '#fff',
    // borderTopWidth: 1,
    // borderTopColor: '#DDDDDD',
  },
  priceBlock: { flex: 1, gap: 2 },
  priceRow:   { flexDirection: 'row', alignItems: 'baseline' },
  priceMain:  { fontSize: 18, fontWeight: '700', color: '#000' },
  priceUnit:  { fontSize: 13, color: '#6A6A6A' },
  priceSub:   { fontSize: 12, color: '#6A6A6A' },

  btn: {
    backgroundColor: COLORS.brandNavy,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    minWidth: 148,
    alignItems: 'center',
  },
  btnTxt: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
