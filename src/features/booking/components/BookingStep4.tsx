import { Gift } from 'lucide-react-native';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { COLORS } from '@/shared/colors';
import { fmtDateFull } from '@/shared/components/CalendarPicker';
import { digitsToE164 } from '@/shared/utils/phone';

import { Pier } from '../types';
import { durLabel, fmtHour, ruFmt } from '../utils';
import { SummaryRow, shared } from './BookingRows';

// ─── Props ────────────────────────────────────────────────────────────────────

interface BookingStep4Props {
  boat: { name: string };
  date: Date;
  startHour: number;
  duration: number;
  selectedPier: Pier | null;
  clientName: string;
  clientPhoneDigits: string;
  clientEmail: string;
  totalAfterPromo: number;
  prepaymentAmt: number;
  remainingAmt: number;
  isPrepayment: boolean;
  onSetPrepayment: (v: boolean) => void;
  giftInput: string;
  onGiftInputChange: (v: string) => void;
  giftLoading: boolean;
  gift: { balance: number; id: string } | null;
  giftError: string;
  giftUsed: number;
  onApplyGift: () => void;
  payNow: number;
  payOnline: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BookingStep4({
  boat,
  date,
  startHour,
  duration,
  selectedPier,
  clientName,
  clientPhoneDigits,
  clientEmail,
  totalAfterPromo,
  prepaymentAmt,
  remainingAmt,
  isPrepayment,
  onSetPrepayment,
  giftInput,
  onGiftInputChange,
  giftLoading,
  gift,
  giftError,
  giftUsed,
  onApplyGift,
  payNow,
  payOnline,
}: BookingStep4Props) {
  return (
    <View style={s.stepBody}>
      <Text style={s.stepTitle}>Проверьте данные бронирования</Text>

      {/* Full details card */}
      <View style={shared.summaryCard}>
        <Text style={shared.summaryCardTitle}>Детали бронирования</Text>
        <SummaryRow label="Катер"             value={boat.name} />
        <SummaryRow label="Дата"              value={fmtDateFull(date)} />
        <SummaryRow label="Время"             value={`${fmtHour(startHour)} – ${fmtHour(startHour + duration)}`} />
        <SummaryRow label="Продолжительность" value={durLabel(duration)} />
        {selectedPier && <SummaryRow label="Причал"  value={selectedPier.name} />}
        {selectedPier?.address && <SummaryRow label="Адрес" value={selectedPier.address} />}
        <SummaryRow label="Имя"               value={clientName} />
        <SummaryRow label="Телефон"           value={digitsToE164(clientPhoneDigits)} />
        {clientEmail
          ? <SummaryRow label="Email"         value={clientEmail} />
          : null}
        <SummaryRow label="Общая стоимость"   value={`${ruFmt(totalAfterPromo)} ₽`} last />
      </View>

      <Text style={s.secLabel}>Способ оплаты</Text>

      {/* Payment amount card */}
      <View style={s.payMethodCard}>
        {prepaymentAmt > 0 ? (
          <>
            <Pressable
              style={[s.payOption, isPrepayment && s.payOptionOn]}
              onPress={() => onSetPrepayment(true)}
            >
              <View style={[s.payOptionRadio, isPrepayment && s.payOptionRadioOn]}>
                {isPrepayment && <View style={s.payOptionRadioDot} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.payOptionTitle, isPrepayment && s.payOptionTitleOn]}>
                  Оплата бронирования
                </Text>
                <Text style={s.payOptionSub}>
                  Сейчас: {ruFmt(prepaymentAmt)} ₽ · Исполнителю: {ruFmt(remainingAmt)} ₽
                </Text>
              </View>
              <Text style={[s.payOptionAmt, isPrepayment && s.payOptionAmtOn]}>
                {ruFmt(prepaymentAmt)} ₽
              </Text>
            </Pressable>

            <View style={s.payOptionDivider} />

            <Pressable
              style={[s.payOption, !isPrepayment && s.payOptionOn]}
              onPress={() => onSetPrepayment(false)}
            >
              <View style={[s.payOptionRadio, !isPrepayment && s.payOptionRadioOn]}>
                {!isPrepayment && <View style={s.payOptionRadioDot} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.payOptionTitle, !isPrepayment && s.payOptionTitleOn]}>
                  Полная оплата
                </Text>
                <Text style={s.payOptionSub}>Всё сейчас онлайн</Text>
              </View>
              <Text style={[s.payOptionAmt, !isPrepayment && s.payOptionAmtOn]}>
                {ruFmt(totalAfterPromo)} ₽
              </Text>
            </Pressable>
          </>
        ) : (
          <View style={[s.payOption, s.payOptionOn]}>
            <View style={[s.payOptionRadio, s.payOptionRadioOn]}>
              <View style={s.payOptionRadioDot} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.payOptionTitle, s.payOptionTitleOn]}>Полная оплата</Text>
              <Text style={s.payOptionSub}>Всё сейчас онлайн</Text>
            </View>
            <Text style={[s.payOptionAmt, s.payOptionAmtOn]}>{ruFmt(totalAfterPromo)} ₽</Text>
          </View>
        )}
      </View>

      {/* YooKassa badge */}
      <View style={s.ykBadge}>
        <View style={s.ykBadgeLeft}>
          <Text style={s.ykBadgeIcon}>🔒</Text>
          <View>
            <Text style={s.ykBadgeTitle}>Банковская карта МИР</Text>
            <Text style={s.ykBadgeSub}>Безопасная обработка через ЮKassa</Text>
          </View>
        </View>
      </View>

      {/* Gift cert */}
      <Text style={s.secLabel}>Подарочный сертификат</Text>
      <View style={shared.codeRow}>
        <View style={shared.codeInput}>
          <Gift size={14} color={COLORS.text3} strokeWidth={1.8} />
          <TextInput
            style={shared.input}
            placeholder="GIFT-XXXX-XXXX"
            placeholderTextColor={COLORS.text3}
            value={giftInput}
            onChangeText={(t) => onGiftInputChange(t.toUpperCase())}
            autoCapitalize="characters"
            returnKeyType="done"
            onSubmitEditing={onApplyGift}
          />
        </View>
        <Pressable
          style={[shared.applyBtn, gift && shared.applyBtnOk, (!giftInput.trim() || giftLoading) && shared.applyBtnDim]}
          onPress={onApplyGift}
          disabled={!giftInput.trim() || giftLoading || !!gift}
        >
          {giftLoading
            ? <ActivityIndicator color={COLORS.white} size="small" />
            : <Text style={shared.applyTxt}>{gift ? '✓' : 'OK'}</Text>}
        </Pressable>
      </View>
      {giftError ? <Text style={shared.errNote}>{giftError}</Text> : null}
      {gift && giftUsed > 0 && (
        <Text style={shared.okNote}>Сертификат применён: −{ruFmt(giftUsed)} ₽</Text>
      )}

      {/* Final calc */}
      <View style={s.finalCalcCard}>
        <View style={s.finalCalcRow}>
          <Text style={s.finalCalcKey}>
            {isPrepayment ? 'Оплата бронирования' : 'Полная стоимость'}
          </Text>
          <Text style={s.finalCalcVal}>{ruFmt(payNow)} ₽</Text>
        </View>
        {giftUsed > 0 && (
          <View style={s.finalCalcRow}>
            <Text style={[s.finalCalcKey, { color: COLORS.success }]}>Сертификат</Text>
            <Text style={[s.finalCalcVal, { color: COLORS.success }]}>−{ruFmt(giftUsed)} ₽</Text>
          </View>
        )}
        <View style={s.finalCalcTotal}>
          <Text style={s.finalCalcTotalKey}>К оплате онлайн</Text>
          <Text style={s.finalCalcTotalVal}>{ruFmt(payOnline)} ₽</Text>
        </View>
        {isPrepayment && (
          <View style={s.finalCalcHint}>
            <Text style={s.finalCalcHintTxt}>
              К оплате исполнителю: {ruFmt(remainingAmt)} ₽ в день аренды
            </Text>
          </View>
        )}
      </View>

      <View style={shared.infoBox}>
        <Text style={shared.infoBoxTitle}>Важная информация:</Text>
        {[
          'Бронирование действительно только после успешной оплаты',
          'Возврат средств возможен не позднее чем за 24 часа до начала аренды',
          'При отмене менее чем за 24 часа возврат составляет 50%',
          'В случае форс-мажора полный возврат гарантирован',
        ].map((t, i) => (
          <View key={i} style={shared.infoBoxRow}>
            <Text style={shared.infoBoxDot}>•</Text>
            <Text style={shared.infoBoxTxt}>{t}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  stepBody:  { marginHorizontal: 16, marginTop: 8, gap: 4 },
  stepTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text1, marginBottom: 4 },
  secLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text3,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 18,
    marginBottom: 8,
  },

  payMethodCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  payOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  payOptionOn:       { backgroundColor: COLORS.brandNavy + '06' },
  payOptionDivider:  { height: StyleSheet.hairlineWidth, backgroundColor: COLORS.border, marginHorizontal: 14 },
  payOptionRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payOptionRadioOn:  { borderColor: COLORS.brandNavy },
  payOptionRadioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.brandNavy },
  payOptionTitle:    { fontSize: 14, fontWeight: '600', color: COLORS.text2 },
  payOptionTitleOn:  { color: COLORS.text1 },
  payOptionSub:      { fontSize: 11, color: COLORS.text3, marginTop: 2 },
  payOptionAmt:      { fontSize: 15, fontWeight: '700', color: COLORS.text2 },
  payOptionAmtOn:    { color: COLORS.brandNavy },

  ykBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.backgroundAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
  },
  ykBadgeLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ykBadgeIcon:  { fontSize: 20 },
  ykBadgeTitle: { fontSize: 13, fontWeight: '600', color: COLORS.text1 },
  ykBadgeSub:   { fontSize: 11, color: COLORS.text3, marginTop: 1 },

  finalCalcCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  finalCalcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  finalCalcKey: { fontSize: 14, color: COLORS.text2 },
  finalCalcVal: { fontSize: 14, fontWeight: '600', color: COLORS.text1 },
  finalCalcTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: COLORS.brandNavy + '08',
  },
  finalCalcTotalKey: { fontSize: 15, fontWeight: '700', color: COLORS.text1 },
  finalCalcTotalVal: { fontSize: 22, fontWeight: '800', color: COLORS.brandNavy },
  finalCalcHint: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  finalCalcHintTxt: { fontSize: 12, color: COLORS.text3 },
});
