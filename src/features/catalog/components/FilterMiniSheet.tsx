import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '@/shared/colors';
import { SheetBackdrop } from '@/shared/components/SheetBackdrop';
import { AMENITIES, CAPACITY_OPTS, DURATION_OPTS, PRICE_PRESETS, TYPE_CHIPS } from '../constants';
import { DEFAULT, Filters } from '../types';

export type FilterSection = 'type' | 'price' | 'capacity' | 'amenities' | 'duration';

interface Props {
  modalRef: React.MutableRefObject<BottomSheetModal | null>;
  section: FilterSection | null;
  draft: Filters;
  onDraftChange: (f: Filters) => void;
  onApply: () => void;
  filteredCount: number;
}

const SECTION_TITLES: Record<FilterSection, string> = {
  type:      'Тип судна',
  price:     'Цена за час',
  capacity:  'Вместимость',
  amenities: 'Удобства',
  duration:  'Продолжительность',
};

const SNAP: Record<FilterSection, string[]> = {
  type:      ['48%'],
  price:     ['52%'],
  capacity:  ['45%'],
  amenities: ['42%'],
  duration:  ['42%'],
};

export const FilterMiniSheet: React.FC<Props> = ({
  modalRef,
  section,
  draft,
  onDraftChange,
  onApply,
  filteredCount,
}) => {
  const insets = useSafeAreaInsets();

  const resetSection = () => {
    if (!section) return;
    switch (section) {
      case 'type':
        onDraftChange({ ...draft, typeId: DEFAULT.typeId });
        break;
      case 'price':
        onDraftChange({ ...draft, priceMin: null, priceMax: null });
        break;
      case 'capacity':
        onDraftChange({ ...draft, capacityMin: null });
        break;
      case 'amenities':
        onDraftChange({ ...draft, hasTarp: false, hasToilet: false, hasHeating: false });
        break;
      case 'duration':
        onDraftChange({ ...draft, dateTime: { ...draft.dateTime, durationHours: DEFAULT.dateTime.durationHours } });
        break;
    }
  };

  const snapPoints = section ? SNAP[section] : ['50%'];

  return (
    <BottomSheetModal
      ref={modalRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={SheetBackdrop}
      backgroundStyle={s.sheetBg}
      handleComponent={() => (
        <View style={s.handleWrap}>
          <View style={s.handle} />
        </View>
      )}
    >
      <BottomSheetScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 16 }]}
      >
        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>{section ? SECTION_TITLES[section] : ''}</Text>
          <Pressable onPress={resetSection} hitSlop={8}>
            <Text style={s.resetTxt}>Сбросить</Text>
          </Pressable>
        </View>

        {/* ── Тип судна ── */}
        {section === 'type' && (
          <View style={s.optRow}>
            {TYPE_CHIPS.map((c) => {
              const on = draft.typeId === c.id;
              return (
                <Pressable
                  key={c.id}
                  style={[s.optChip, on && s.optChipOn]}
                  onPress={() => onDraftChange({ ...draft, typeId: c.id })}
                >
                  <Text style={[s.optTxt, on && s.optTxtOn]}>{c.label}</Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* ── Цена ── */}
        {section === 'price' && (
          <>
            <View style={s.priceRow}>
              <View style={s.priceInputWrap}>
                <Text style={s.priceLabel}>от</Text>
                <TextInput
                  style={s.priceInput}
                  placeholder="0"
                  placeholderTextColor={COLORS.text3}
                  keyboardType="numeric"
                  value={draft.priceMin !== null ? String(draft.priceMin) : ''}
                  onChangeText={(v) => onDraftChange({ ...draft, priceMin: v ? Number(v) : null })}
                />
              </View>
              <View style={s.priceDash} />
              <View style={s.priceInputWrap}>
                <Text style={s.priceLabel}>до</Text>
                <TextInput
                  style={s.priceInput}
                  placeholder="∞"
                  placeholderTextColor={COLORS.text3}
                  keyboardType="numeric"
                  value={draft.priceMax !== null ? String(draft.priceMax) : ''}
                  onChangeText={(v) => onDraftChange({ ...draft, priceMax: v ? Number(v) : null })}
                />
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
            >
              {PRICE_PRESETS.map((p) => {
                const on = draft.priceMin === p.min && draft.priceMax === p.max;
                return (
                  <Pressable
                    key={p.label}
                    style={[s.optChip, on && s.optChipOn]}
                    onPress={() =>
                      on
                        ? onDraftChange({ ...draft, priceMin: null, priceMax: null })
                        : onDraftChange({ ...draft, priceMin: p.min, priceMax: p.max })
                    }
                  >
                    <Text style={[s.optTxt, on && s.optTxtOn]}>{p.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </>
        )}

        {/* ── Вместимость ── */}
        {section === 'capacity' && (
          <View style={s.optRow}>
            {CAPACITY_OPTS.map((n) => {
              const on = draft.capacityMin === (n ?? null);
              return (
                <Pressable
                  key={String(n)}
                  style={[s.optChip, on && s.optChipOn]}
                  onPress={() => onDraftChange({ ...draft, capacityMin: n ?? null })}
                >
                  <Text style={[s.optTxt, on && s.optTxtOn]}>
                    {n === null ? 'Любая' : n === 11 ? '11+' : String(n)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* ── Удобства ── */}
        {section === 'amenities' && (
          <View>
            {AMENITIES.map(({ key, label }) => (
              <View key={key} style={s.switchRow}>
                <Text style={s.switchLabel}>{label}</Text>
                <Switch
                  value={draft[key]}
                  onValueChange={(v) => onDraftChange({ ...draft, [key]: v })}
                  trackColor={{ false: COLORS.border, true: COLORS.brandNavy + '70' }}
                  thumbColor={draft[key] ? COLORS.brandNavy : '#f0f0f0'}
                />
              </View>
            ))}
          </View>
        )}

        {/* ── Продолжительность ── */}
        {section === 'duration' && (
          <View style={s.optRow}>
            {DURATION_OPTS.map((h) => {
              const on = draft.dateTime.durationHours === h;
              const label = h === 1 ? '1 час' : h < 5 ? `${h} часа` : `${h} часов`;
              return (
                <Pressable
                  key={h}
                  style={[s.optChip, on && s.optChipOn]}
                  onPress={() => onDraftChange({ ...draft, dateTime: { ...draft.dateTime, durationHours: h } })}
                >
                  <Text style={[s.optTxt, on && s.optTxtOn]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Apply button */}
        <Pressable
          style={({ pressed }) => [s.applyBtn, pressed && { opacity: 0.88 }]}
          onPress={() => {
            onApply();
            modalRef.current?.dismiss();
          }}
        >
          <Text style={s.applyTxt}>
            Показать результаты
          </Text>
        </Pressable>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
};

const s = StyleSheet.create({
  sheetBg:   { backgroundColor: COLORS.white, borderRadius: 20 },
  handleWrap:{ paddingTop: 12, paddingBottom: 2, alignItems: 'center' },
  handle:    { width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.border },
  content:   { paddingHorizontal: 20, paddingTop: 4 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title:    { fontSize: 18, fontWeight: '500', color: COLORS.text1 },
  resetTxt: { fontSize: 14, fontWeight: '600', color: COLORS.brandCyan },

  optRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  optChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: COLORS.greyLight2,
  },
  optChipOn: { backgroundColor: COLORS.brandNavy, borderColor: COLORS.brandNavy },
  optTxt:    { fontSize: 13, fontWeight: '500', color: COLORS.brandNavy },
  optTxtOn:  { color: COLORS.white, fontWeight: '600' },

  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  priceInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: COLORS.backgroundAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  priceLabel: { fontSize: 13, color: COLORS.text3, fontWeight: '500' },
  priceInput: { flex: 1, fontSize: 14, color: COLORS.text1, padding: 0 },
  priceDash:  { width: 12, height: 1.5, backgroundColor: COLORS.text3, borderRadius: 1 },

  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  switchLabel: { fontSize: 15, color: COLORS.text1 },

  applyBtn: {
    marginTop: 20,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.brandNavy,
  },
  applyTxt: { fontSize: 15, fontWeight: '700', color: COLORS.white },
});
