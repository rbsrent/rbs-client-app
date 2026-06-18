import { MapPin, Ruler, Shield, Users } from 'lucide-react-native';
import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Boat } from '@/features/catalog/hooks/useBoatDetail';

interface Props { boat: Boat }

function FeatureRow({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <View style={s.row}>
      <View style={s.iconWrap}>{icon}</View>
      <View style={s.text}>
        <Text style={s.title}>{title}</Text>
        <Text style={s.desc}>{desc}</Text>
      </View>
    </View>
  );
}

function BoatDetailFeatures({ boat }: Props) {
  return (
    <View>
      <View style={s.block}>
        {boat.capacity ? (
          <FeatureRow
            icon={<Users size={22} color="#222" strokeWidth={1.8} />}
            title={`До ${boat.capacity} гостей`}
            desc="Вместительная комфортная каюта и открытая палуба"
          />
        ) : null}
        {boat.length_meters ? (
          <FeatureRow
            icon={<Ruler size={22} color="#222" strokeWidth={1.8} />}
            title={`Длина ${boat.length_meters} м`}
            desc="Просторное судно с удобным размещением"
          />
        ) : null}
        {boat.piers?.name ? (
          <FeatureRow
            icon={<MapPin size={22} color="#222" strokeWidth={1.8} />}
            title={boat.piers.name}
            desc={boat.piers.address ?? 'Удобное расположение в Санкт-Петербурге'}
          />
        ) : null}
      </View>

      <View style={s.banner}>
        <Shield size={14} color="#222" strokeWidth={2} />
        <Text style={s.bannerTxt}>Бесплатная отмена до начала аренды</Text>
      </View>
    </View>
  );
}

export default memo(BoatDetailFeatures);

const s = StyleSheet.create({
  block:     { paddingHorizontal: 24, paddingVertical: 20, gap: 20 },
  row:       { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  iconWrap:  { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  text:      { flex: 1, gap: 2 },
  title:     { fontSize: 14, fontWeight: '500', color: '#222', lineHeight: 21 },
  desc:      { fontSize: 14, color: '#6A6A6A', lineHeight: 21 },

  banner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 24, marginBottom: 20,
    paddingVertical: 12, paddingHorizontal: 16,
    backgroundColor: '#EBEBEB', borderRadius: 8,
  },
  bannerTxt: { fontSize: 12, fontWeight: '500', color: '#222', flex: 1 },
});
