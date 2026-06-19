// features/catalog/components/BoatEmpty.tsx

import { COLORS } from '@/shared/colors';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface BoatEmptyProps {
  hasActive: boolean;
  onReset: () => void;
}

export const BoatEmpty: React.FC<BoatEmptyProps> = ({ hasActive, onReset }) => {
  return (
    <View style={s.empty}>
      <Text style={s.emptyTxt}>Суда не найдены</Text>
      {hasActive && (
        <Pressable onPress={onReset} style={s.emptyBtn}>
          <Text style={s.emptyBtnTxt}>Сбросить фильтры</Text>
        </Pressable>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  empty: { paddingTop: 80, alignItems: 'center', gap: 12 },
  emptyTxt: { fontSize: 15, color: COLORS.text3 },
  emptyBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.brandNavy,
  },
  emptyBtnTxt: { fontSize: 14, fontWeight: '700', color: COLORS.white },
});