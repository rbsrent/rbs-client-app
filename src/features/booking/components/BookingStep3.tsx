import { Mail, Phone, User } from 'lucide-react-native';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { COLORS } from '@/shared/colors';
import { fmtDateFull } from '@/shared/components/CalendarPicker';
import { PhoneInput } from '@/shared/components/PhoneInput';

import { Pier } from '../types';
import { durLabel, fmtHour, ruFmt } from '../utils';
import { FormField, SummaryRow, shared } from './BookingRows';

// ─── Props ────────────────────────────────────────────────────────────────────

interface BookingStep3Props {
  date: Date;
  startHour: number;
  duration: number;
  selectedPier: Pier | null;
  totalAfterPromo: number;
  clientName: string;
  onNameChange: (v: string) => void;
  clientPhoneDigits: string;
  onPhoneChange: (v: string) => void;
  clientEmail: string;
  onEmailChange: (v: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BookingStep3({
  date,
  startHour,
  duration,
  selectedPier,
  totalAfterPromo,
  clientName,
  onNameChange,
  clientPhoneDigits,
  onPhoneChange,
  clientEmail,
  onEmailChange,
}: BookingStep3Props) {
  return (
    <View style={s.stepBody}>
      <Text style={s.stepTitle}>Почти готово</Text>

      {/* Booking summary */}
      <View style={shared.summaryCard}>
        <Text style={shared.summaryCardTitle}>Сводка бронирования</Text>
        <SummaryRow label="Дата"              value={fmtDateFull(date)} />
        <SummaryRow label="Время"             value={`${fmtHour(startHour)} – ${fmtHour(startHour + duration)}`} />
        <SummaryRow label="Продолжительность" value={durLabel(duration)} />
        {selectedPier && <SummaryRow label="Причал"  value={selectedPier.name} />}
        {selectedPier?.address && <SummaryRow label="Адрес" value={selectedPier.address} />}
        <SummaryRow label="Общая стоимость"   value={`${ruFmt(totalAfterPromo)} ₽`} last />
      </View>

      <Text style={s.secLabel}>Введите ваши данные</Text>

      <View style={shared.formCard}>
        <FormField
          icon={<User size={16} color={COLORS.text3} strokeWidth={1.8} />}
          label="Имя *"
          last={false}
        >
          <TextInput
            style={shared.input}
            placeholder="Ваше имя"
            placeholderTextColor={COLORS.text3}
            value={clientName}
            onChangeText={onNameChange}
            autoCapitalize="words"
            returnKeyType="next"
          />
        </FormField>

        <FormField
          icon={<Phone size={16} color={COLORS.text3} strokeWidth={1.8} />}
          label="Телефон *"
          last={false}
        >
          <PhoneInput
            digits={clientPhoneDigits}
            onChangeDigits={onPhoneChange}
            style={shared.input}
            returnKeyType="done"
          />
        </FormField>

        <FormField
          icon={<Mail size={16} color={COLORS.text3} strokeWidth={1.8} />}
          label="Email (необязательно)"
          last
        >
          <TextInput
            style={shared.input}
            placeholder="email@example.com"
            placeholderTextColor={COLORS.text3}
            value={clientEmail}
            onChangeText={onEmailChange}
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="done"
          />
        </FormField>
      </View>

      <View style={shared.infoBox}>
        <Text style={shared.infoBoxTitle}>Информация о бронировании:</Text>
        {[
          'После подтверждения вы получите SMS с деталями',
          'Прибудьте к месту посадки за 15 минут до начала',
          'При себе необходимо иметь документ, удостоверяющий личность',
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
  stepBody: { marginHorizontal: 16, marginTop: 8, gap: 4 },
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
});
