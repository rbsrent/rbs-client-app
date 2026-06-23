import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ActiveDiscount } from '@/features/catalog/hooks/useDiscountsCache';
import { COLORS } from '@/shared/colors';
import { getBoatPriceInfo, ruFmtPrice } from '@/shared/utils/boatPrice';

export interface BoatBookingBarProps {
  pricePerHour:  number;
  priceNight?:   number | null;
  discount?:     ActiveDiscount | null;
  onBook:        () => void;
  paddingBottom: number;
}

export default function BoatBookingBar({ pricePerHour, priceNight, discount, onBook, paddingBottom }: BoatBookingBarProps) {
  const { displayPrice, originalPrice, discountPct, isNight } = getBoatPriceInfo(pricePerHour, priceNight, discount);
  return (
    <View style={[s.bar, { paddingBottom }]}>
      {/* Price block */}
      <View style={s.priceBlock}>
        {discount && (
          <View style={s.discountBadge}>
            <Text style={s.discountBadgeTxt}>{discount.name} −{discountPct}%</Text>
          </View>
        )}
        <View style={s.priceRow}>
          {originalPrice && (
            <Text style={s.priceOld}>{ruFmtPrice(originalPrice)} ₽</Text>
          )}
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
  priceBlock:      { flex: 1, gap: 2 },
  discountBadge:   { alignSelf: 'flex-start', backgroundColor: COLORS.success + '18', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginBottom: 2 },
  discountBadgeTxt:{ fontSize: 11, fontWeight: '700', color: COLORS.success },
  priceRow:        { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  priceOld:        { fontSize: 13, color: '#6A6A6A', textDecorationLine: 'line-through' },
  priceMain:       { fontSize: 18, fontWeight: '700', color: '#000' },
  priceUnit:       { fontSize: 13, color: '#6A6A6A' },
  priceSub:        { fontSize: 12, color: '#6A6A6A' },

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
