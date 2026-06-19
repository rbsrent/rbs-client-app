import { Calendar, Map, MapPin, Tag } from 'lucide-react-native';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { COLORS } from '@/shared/colors';

import { PricingResult, Pier } from '../types';
import { shared } from './BookingRows';
import { PricingCard } from './PricingCard';
import { Spinner } from '@/shared/components/Spinner';

// ─── Props ────────────────────────────────────────────────────────────────────

interface BookingStep2Props {
  date: Date;
  startHour: number;
  duration: number;
  dateLabel: string;
  piers: Pier[];
  selectedPier: Pier | null;
  onSelectPier: (p: Pier) => void;
  onOpenMap: () => void;
  promoInput: string;
  onPromoInputChange: (v: string) => void;
  promoLoading: boolean;
  promo: { discount_percent: number; id: string } | null;
  promoError: string;
  onApplyPromo: () => void;
  pricingLoading: boolean;
  pricing: PricingResult | null;
  baseTotal: number;
  promoDiscount: number;
  totalAfterPromo: number;
  prepaymentAmt: number;
  remainingAmt: number;
  boat: { price_per_hour: number };
  onEditDate: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BookingStep2({
  dateLabel,
  piers,
  selectedPier,
  onSelectPier,
  onOpenMap,
  promoInput,
  onPromoInputChange,
  promoLoading,
  promo,
  promoError,
  onApplyPromo,
  pricingLoading,
  pricing,
  baseTotal,
  promoDiscount,
  totalAfterPromo,
  prepaymentAmt,
  remainingAmt,
  boat,
  duration,
  onEditDate,
}: BookingStep2Props) {
  return (
    <View style={s.stepBody}>
      <Pressable style={s.editChip} onPress={onEditDate}>
        <Calendar size={14} color={COLORS.brandNavy} strokeWidth={1.8} />
        <Text style={s.editChipTxt}>{dateLabel}</Text>
        <Text style={s.editChipAction}>Изменить</Text>
      </Pressable>

      <View style={s.sectionRow}>
        <Text style={s.secLabel}>Место посадки</Text>
        <Pressable style={s.mapChip} onPress={onOpenMap} hitSlop={6}>
          <Map size={13} color={COLORS.brandNavy} strokeWidth={2} />
          <Text style={s.mapChipTxt}>На карте</Text>
        </Pressable>
      </View>
      {piers.length === 0 ? (
        <Text style={s.hintTxt}>Причал уточните у менеджера</Text>
      ) : (
        piers.map((p) => {
          const on = selectedPier?.id === p.id;
          return (
            <Pressable
              key={p.id}
              style={[s.pierCard, on && s.pierCardOn]}
              onPress={() => onSelectPier(p)}
            >
              <View style={[s.radio, on && s.radioOn]}>
                {on && <View style={s.radioDot} />}
              </View>
              <View style={s.pierCardBody}>
                <Text style={[s.pierName, on && s.pierNameOn]}>{p.name}</Text>
                {p.address ? <Text style={s.pierAddr}>{p.address}</Text> : null}
              </View>
              <MapPin size={15} color={on ? COLORS.brandNavy : COLORS.text3} strokeWidth={1.8} />
            </Pressable>
          );
        })
      )}

      <Text style={[s.secLabel, { marginTop: 20 }]}>Промокод</Text>
      <View style={shared.codeRow}>
        <View style={shared.codeInput}>
          <Tag size={14} color={COLORS.text3} strokeWidth={1.8} />
          <TextInput
            style={shared.input}
            placeholder="Введите промокод"
            placeholderTextColor={COLORS.text3}
            value={promoInput}
            onChangeText={(t) => onPromoInputChange(t.toUpperCase())}
            autoCapitalize="characters"
            returnKeyType="done"
            onSubmitEditing={onApplyPromo}
          />
        </View>
        <Pressable
          style={[shared.applyBtn, promo && shared.applyBtnOk, (!promoInput.trim() || promoLoading) && shared.applyBtnDim]}
          onPress={onApplyPromo}
          disabled={!promoInput.trim() || promoLoading || !!promo}
        >
          {promoLoading
            ? <Spinner size={20} color="#fff" trackColor="rgba(255,255,255,0.25)" />
            : <Text style={shared.applyTxt}>{promo ? '✓' : 'OK'}</Text>}
        </Pressable>
      </View>
      {promoError ? <Text style={shared.errNote}>{promoError}</Text> : null}
      {promo      ? <Text style={shared.okNote}>Скидка {promo.discount_percent}% применена</Text> : null}

      {pricingLoading ? (
        <View style={s.pricingLoader}>
          <Spinner size={20} />
          <Text style={s.hintTxt}>Рассчитываем стоимость…</Text>
        </View>
      ) : pricing ? (
        <PricingCard
          pricing={pricing}
          boat={boat}
          duration={duration}
          baseTotal={baseTotal}
          promoDiscount={promoDiscount}
          promo={promo}
          totalAfterPromo={totalAfterPromo}
          prepaymentAmt={prepaymentAmt}
          remainingAmt={remainingAmt}
        />
      ) : null}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  stepBody: { marginHorizontal: 16, marginTop: 8, gap: 4 },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 8,
  },
  secLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text3,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  mapChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: COLORS.brandNavy + '10',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.brandNavy + '20',
  },
  mapChipTxt: { fontSize: 12, fontWeight: '600', color: COLORS.brandNavy },
  hintTxt: { fontSize: 12, color: COLORS.text3, lineHeight: 18 },

  editChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  editChipTxt:    { flex: 1, fontSize: 13, fontWeight: '600', color: COLORS.text1 },
  editChipAction: { fontSize: 13, color: COLORS.brandCyan, fontWeight: '600' },

  pierCard:     { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, marginBottom: 8 },
  pierCardOn:   { borderColor: COLORS.brandNavy, backgroundColor: COLORS.brandNavy + '05' },
  radio:        { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  radioOn:      { borderColor: COLORS.brandNavy },
  radioDot:     { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.brandNavy },
  pierCardBody: { flex: 1 },
  pierName:     { fontSize: 14, fontWeight: '600', color: COLORS.text1 },
  pierNameOn:   { color: COLORS.brandNavy },
  pierAddr:     { fontSize: 12, color: COLORS.text3, marginTop: 2 },

  pricingLoader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
});
