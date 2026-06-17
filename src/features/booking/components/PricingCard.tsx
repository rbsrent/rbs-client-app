import { StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/shared/colors';

import { PricingResult } from '../types';
import { durLabel, fmtDiscountCondition, ruFmt } from '../utils';

// ─── Props ────────────────────────────────────────────────────────────────────

interface PricingCardProps {
  pricing: PricingResult;
  boat: { price_per_hour: number };
  duration: number;
  baseTotal: number;
  promoDiscount: number;
  promo: { discount_percent: number } | null;
  totalAfterPromo: number;
  prepaymentAmt: number;
  remainingAmt: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PricingCard({
  pricing,
  boat,
  duration,
  baseTotal,
  promoDiscount,
  promo,
  totalAfterPromo,
  prepaymentAmt,
  remainingAmt,
}: PricingCardProps) {
  return (
    <View style={s.pricingCard}>
      <Text style={s.pricingCardTitle}>Итоговая стоимость</Text>

      {/* Discount badge */}
      {pricing.appliedDiscount && (
        <View style={s.discountBadge}>
          <Text style={s.discountBadgeTxt}>
            {pricing.appliedDiscount.name} {pricing.appliedDiscount.percentage}%
          </Text>
        </View>
      )}

      {/* Rate display */}
      <View style={s.pricingRateRow}>
        {pricing.appliedDiscount && pricing.originalHourlyRate ? (
          <>
            <Text style={s.pricingRateOld}>{ruFmt(pricing.originalHourlyRate)} ₽/час</Text>
            <Text style={s.pricingRate}>{ruFmt(pricing.finalHourlyRate ?? 0)} ₽/час</Text>
          </>
        ) : (
          <Text style={s.pricingRate}>{ruFmt(pricing.finalHourlyRate ?? boat.price_per_hour)} ₽/час</Text>
        )}
      </View>

      {/* Savings line */}
      {pricing.appliedDiscount && (pricing.totalSavings ?? 0) > 0 && (
        <View style={s.pricingRow}>
          <Text style={[s.pricingRowKey, { color: COLORS.success }]}>
            −{ruFmt(pricing.totalSavings!)} ₽
          </Text>
        </View>
      )}

      {/* Discount condition */}
      {pricing.appliedDiscount && (
        <Text style={s.discountCondition}>
          {fmtDiscountCondition(pricing.appliedDiscount)}
        </Text>
      )}

      <View style={s.pricingDivider} />

      <View style={s.pricingRow}>
        <Text style={s.pricingRowKey}>
          {ruFmt(pricing.finalHourlyRate ?? boat.price_per_hour)} ₽/час × {durLabel(duration)}
        </Text>
        <Text style={s.pricingRowVal}>{ruFmt(baseTotal)} ₽</Text>
      </View>
      {promoDiscount > 0 && (
        <View style={s.pricingRow}>
          <Text style={[s.pricingRowKey, { color: COLORS.success }]}>
            Промокод −{promo!.discount_percent}%
          </Text>
          <Text style={[s.pricingRowVal, { color: COLORS.success }]}>
            −{ruFmt(promoDiscount)} ₽
          </Text>
        </View>
      )}

      <View style={[s.pricingRow, s.pricingRowTotal]}>
        <Text style={s.pricingTotalKey}>Общая стоимость:</Text>
        <Text style={s.pricingTotalVal}>{ruFmt(totalAfterPromo)} ₽</Text>
      </View>

      {prepaymentAmt > 0 && (
        <>
          <View style={s.pricingRow}>
            <Text style={s.pricingRowKey}>Оплата бронирования:</Text>
            <Text style={s.pricingRowVal}>{ruFmt(prepaymentAmt)} ₽</Text>
          </View>
          <View style={s.pricingRow}>
            <Text style={s.pricingRowKey}>К оплате исполнителю:</Text>
            <Text style={s.pricingRowVal}>{ruFmt(remainingAmt)} ₽</Text>
          </View>
        </>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  pricingCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginTop: 12,
    padding: 14,
    gap: 8,
  },
  pricingCardTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text1 },
  pricingRateRow:   { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  pricingRate:      { fontSize: 22, fontWeight: '800', color: COLORS.brandNavy },
  pricingRateOld:   { fontSize: 15, color: COLORS.text3, textDecorationLine: 'line-through' },
  pricingDivider:   { height: StyleSheet.hairlineWidth, backgroundColor: COLORS.border, marginVertical: 2 },
  pricingRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pricingRowKey:    { fontSize: 13, color: COLORS.text2, flex: 1 },
  pricingRowVal:    { fontSize: 13, fontWeight: '600', color: COLORS.text1 },
  pricingRowTotal:  { marginTop: 4, paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.border },
  pricingTotalKey:  { fontSize: 14, fontWeight: '700', color: COLORS.text1, flex: 1 },
  pricingTotalVal:  { fontSize: 18, fontWeight: '800', color: COLORS.brandNavy },
  discountBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.success + '18',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  discountBadgeTxt:  { fontSize: 12, fontWeight: '700', color: COLORS.success },
  discountCondition: { fontSize: 11, color: COLORS.text3, marginTop: -2 },
});
