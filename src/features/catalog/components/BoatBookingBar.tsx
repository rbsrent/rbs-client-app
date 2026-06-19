import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/shared/colors';

export interface BoatBookingBarProps {
  pricePerHour:  number;
  priceNight?:   number | null;
  onBook:        () => void;
  paddingBottom: number;
}

function ruFmt(n: number) {
  return new Intl.NumberFormat('ru-RU').format(Math.round(n));
}

export default function BoatBookingBar({ pricePerHour, priceNight, onBook, paddingBottom }: BoatBookingBarProps) {
  return (
    <View style={[s.bar, { paddingBottom }]}>
      {/* Price block */}
      <View style={s.priceBlock}>
        <View style={s.priceRow}>
          <Text style={s.priceMain}>{ruFmt(pricePerHour)} ₽</Text>
          <Text style={s.priceUnit}> / час</Text>
        </View>
        {priceNight ? (
          <Text style={s.priceSub}>{ruFmt(priceNight)} ₽ / час ночью</Text>
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
