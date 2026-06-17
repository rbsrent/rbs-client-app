import { CheckCircle2, XCircle } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/shared/colors';
import { formatRub } from '@/shared/utils/currency';

export interface BoatSpecsProps {
  boat: {
    capacity?: number;
    length_meters?: number;
    type?: string;
    has_tarp?: boolean;
    has_heating?: boolean;
    has_toilet?: boolean;
    has_covered_saloon?: boolean;
    has_bluetooth?: boolean;
    price_per_hour?: number;
    public_price_per_hour_night?: number | null;
    [key: string]: any;
  };
}

const AMENITIES = [
  { key: 'has_tarp', label: 'Тент' },
  { key: 'has_heating', label: 'Отопление' },
  { key: 'has_toilet', label: 'Туалет' },
  { key: 'has_covered_saloon', label: 'Крытый салон' },
  { key: 'has_bluetooth', label: 'Bluetooth' },
];

export default function BoatSpecs({ boat }: BoatSpecsProps) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Характеристики</Text>
      <View style={s.specsGrid}>
        {boat.capacity ? (
          <View style={s.specRow}>
            <Text style={s.specLabel}>Вместимость</Text>
            <Text style={s.specValue}>{boat.capacity} чел.</Text>
          </View>
        ) : null}
        {boat.length_meters ? (
          <View style={s.specRow}>
            <Text style={s.specLabel}>Длина</Text>
            <Text style={s.specValue}>{boat.length_meters} м</Text>
          </View>
        ) : null}
        {boat.type ? (
          <View style={s.specRow}>
            <Text style={s.specLabel}>Тип</Text>
            <Text style={s.specValue}>{boat.type}</Text>
          </View>
        ) : null}
        {AMENITIES.map((a) => (
          <View key={a.key} style={s.specRow}>
            <Text style={s.specLabel}>{a.label}</Text>
            {boat[a.key] ? (
              <CheckCircle2 size={16} color={COLORS.success} strokeWidth={2} />
            ) : (
              <XCircle size={16} color={COLORS.text3} strokeWidth={2} />
            )}
          </View>
        ))}
        {boat.price_per_hour ? (
          <View style={s.specRow}>
            <Text style={s.specLabel}>Цена/час</Text>
            <Text style={[s.specValue, { color: COLORS.brandNavy, fontWeight: '700' }]}>
              {formatRub(boat.price_per_hour)}
            </Text>
          </View>
        ) : null}
        {boat.public_price_per_hour_night ? (
          <View style={s.specRow}>
            <Text style={s.specLabel}>Ночью/час</Text>
            <Text style={s.specValue}>{formatRub(boat.public_price_per_hour_night)}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  section: { gap: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text1 },
  specsGrid: {
    backgroundColor: COLORS.backgroundAlt,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  specLabel: { fontSize: 14, color: COLORS.text2 },
  specValue: { fontSize: 14, color: COLORS.text1, fontWeight: '500' },
});
