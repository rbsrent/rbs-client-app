import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { List, Map, MapPin, Search, X } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import YaMap, { Marker } from 'react-native-yamap';


import { COLORS } from '@/shared/colors';
import { initYaMap } from '@/shared/yamap';

initYaMap();
import { SheetBackdrop } from '@/shared/components/SheetBackdrop';
import type { Pier } from '../types';

const { width: W, height: H } = Dimensions.get('window');
const MAP_HEIGHT = Math.min(H * 0.45, 340);

type ViewMode = 'map' | 'list';

interface PierMapSheetProps {
  visible: boolean;
  piers: Pier[];
  selectedPier: Pier | null;
  onSelect: (pier: Pier) => void;
  onClose: () => void;
}

export function PierMapSheet({
  visible,
  piers,
  selectedPier,
  onSelect,
  onClose,
}: PierMapSheetProps) {
  const insets  = useSafeAreaInsets();
  const ref     = useRef<BottomSheetModal>(null);
  const mapRef  = useRef<YaMap>(null);

  const [mode, setMode]     = useState<ViewMode>('map');
  const [query, setQuery]   = useState('');
  const [focused, setFocused] = useState<Pier | null>(null);

  const snapPoints = useMemo(() => ['92%'], []);

  useEffect(() => {
    if (visible) {
      ref.current?.present();
    } else {
      ref.current?.dismiss();
    }
  }, [visible]);

  const piersWithCoords = useMemo(
    () => piers.filter((p) => p.latitude != null && p.longitude != null),
    [piers],
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return piers;
    const q = query.toLowerCase();
    return piers.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.address ?? '').toLowerCase().includes(q),
    );
  }, [piers, query]);

  const handleSelect = useCallback((pier: Pier) => {
    onSelect(pier);
    ref.current?.dismiss();
  }, [onSelect]);

  const handleMarkerPress = useCallback((pier: Pier) => {
    setFocused(pier);
  }, []);

  const fitAllMarkers = useCallback(() => {
    if (!mapRef.current || piersWithCoords.length === 0) return;
    const points = piersWithCoords.map((p) => ({
      lat: p.latitude!,
      lon: p.longitude!,
    }));
    mapRef.current.fitAllMarkers?.();
  }, [piersWithCoords]);

  // Center map on selected pier when sheet opens
  useEffect(() => {
    if (visible && selectedPier?.latitude) {
      setTimeout(() => {
        mapRef.current?.setCenter(
          { lat: selectedPier.latitude!, lon: selectedPier.longitude! },
          14,
          0,
          0,
          0.5,
        );
      }, 400);
    } else if (visible && piersWithCoords.length > 0) {
      setTimeout(fitAllMarkers, 400);
    }
  }, [visible]);

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={SheetBackdrop}
      backgroundStyle={s.sheetBg}
      handleComponent={() => (
        <View style={s.handleWrap}>
          <View style={s.handle} />
        </View>
      )}
      onDismiss={onClose}
    >
      <BottomSheetView style={[s.content, { paddingBottom: insets.bottom + 8 }]}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>Выберите причал</Text>
          <View style={s.headerRight}>
            {/* Map / List toggle */}
            <Pressable
              style={[s.modeBtn, mode === 'map' && s.modeBtnOn]}
              onPress={() => setMode('map')}
              hitSlop={6}
            >
              <Map size={16} color={mode === 'map' ? COLORS.white : COLORS.text2} strokeWidth={2} />
            </Pressable>
            <Pressable
              style={[s.modeBtn, mode === 'list' && s.modeBtnOn]}
              onPress={() => setMode('list')}
              hitSlop={6}
            >
              <List size={16} color={mode === 'list' ? COLORS.white : COLORS.text2} strokeWidth={2} />
            </Pressable>
            <Pressable style={s.closeBtn} onPress={() => ref.current?.dismiss()} hitSlop={8}>
              <X size={18} color={COLORS.text2} strokeWidth={2} />
            </Pressable>
          </View>
        </View>

        {/* Search */}
        <View style={s.searchRow}>
          <Search size={16} color={COLORS.text3} strokeWidth={2} />
          <TextInput
            style={s.searchInput}
            placeholder="Поиск по названию или адресу"
            placeholderTextColor={COLORS.text3}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {query.length > 0 && Platform.OS === 'android' && (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <X size={14} color={COLORS.text3} strokeWidth={2} />
            </Pressable>
          )}
        </View>

        {/* Map view */}
        {mode === 'map' && (
          <View style={s.mapWrap}>
            <YaMap
              ref={mapRef}
              style={s.map}
              initialRegion={{
                lat: 59.9386,
                lon: 30.3141,
                zoom: 11,
                azimuth: 0,
                tilt: 0,
              }}
              showUserPosition
            >
              {piersWithCoords
                .filter((p) =>
                  !query.trim() ||
                  p.name.toLowerCase().includes(query.toLowerCase()) ||
                  (p.address ?? '').toLowerCase().includes(query.toLowerCase()),
                )
                .map((pier) => {
                  const active = selectedPier?.id === pier.id || focused?.id === pier.id;
                  return (
                    <Marker
                      key={pier.id}
                      point={{ lat: pier.latitude!, lon: pier.longitude! }}
                      scale={active ? 1.3 : 1}
                      onPress={() => handleMarkerPress(pier)}
                    >
                      <View style={[s.pin, active && s.pinActive]}>
                        <MapPin size={active ? 20 : 16} color="#fff" strokeWidth={2} />
                      </View>
                    </Marker>
                  );
                })}
            </YaMap>

            {/* Focused pier card */}
            {focused && (
              <View style={s.focusedCard}>
                <View style={{ flex: 1 }}>
                  <Text style={s.focusedName}>{focused.name}</Text>
                  {focused.address ? (
                    <Text style={s.focusedAddr} numberOfLines={1}>{focused.address}</Text>
                  ) : null}
                </View>
                <Pressable
                  style={({ pressed }) => [s.selectBtn, pressed && { opacity: 0.85 }]}
                  onPress={() => handleSelect(focused)}
                >
                  <Text style={s.selectBtnTxt}>Выбрать</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}

        {/* List view */}
        {mode === 'list' && (
          <View style={s.listWrap}>
            {filtered.length === 0 ? (
              <View style={s.emptyBox}>
                <MapPin size={32} color={COLORS.text3} strokeWidth={1.5} />
                <Text style={s.emptyTxt}>Причалы не найдены</Text>
              </View>
            ) : (
              filtered.map((pier, i) => {
                const on = selectedPier?.id === pier.id;
                return (
                  <Pressable
                    key={pier.id}
                    style={[s.pierRow, on && s.pierRowOn, i === 0 && { borderTopWidth: 0 }]}
                    onPress={() => handleSelect(pier)}
                  >
                    <View style={[s.pierRadio, on && s.pierRadioOn]}>
                      {on && <View style={s.pierRadioDot} />}
                    </View>
                    <MapPin
                      size={16}
                      color={on ? COLORS.brandNavy : COLORS.text3}
                      strokeWidth={1.8}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[s.pierName, on && s.pierNameOn]}>{pier.name}</Text>
                      {pier.address ? (
                        <Text style={s.pierAddr} numberOfLines={2}>{pier.address}</Text>
                      ) : null}
                    </View>
                  </Pressable>
                );
              })
            )}
          </View>
        )}
      </BottomSheetView>
    </BottomSheetModal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  sheetBg:    { backgroundColor: COLORS.white, borderTopLeftRadius: 22, borderTopRightRadius: 22 },
  handleWrap: { alignItems: 'center', paddingTop: 10, paddingBottom: 4 },
  handle:     { width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.border },

  content: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  title:       { fontSize: 16, fontWeight: '700', color: COLORS.text1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  modeBtn: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: COLORS.backgroundAlt,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  modeBtnOn: { backgroundColor: COLORS.brandNavy, borderColor: COLORS.brandNavy },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.backgroundAlt,
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 4,
  },

  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginVertical: 10,
    backgroundColor: COLORS.backgroundAlt,
    borderRadius: 12, borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.text1 },

  /* map */
  mapWrap: { flex: 1, position: 'relative' },
  map:     { flex: 1, height: MAP_HEIGHT },

  pin: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: COLORS.brandNavy,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 4, elevation: 4,
  },
  pinActive: { backgroundColor: COLORS.brandCyan ?? COLORS.brandNavy, width: 42, height: 42, borderRadius: 21 },

  focusedCard: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.white,
    borderTopWidth: 1, borderTopColor: COLORS.border,
    paddingHorizontal: 16, paddingVertical: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 8,
  },
  focusedName: { fontSize: 14, fontWeight: '700', color: COLORS.text1 },
  focusedAddr: { fontSize: 12, color: COLORS.text3, marginTop: 2 },
  selectBtn: {
    backgroundColor: COLORS.brandNavy, borderRadius: 10,
    paddingHorizontal: 18, paddingVertical: 10,
  },
  selectBtnTxt: { fontSize: 14, fontWeight: '700', color: '#fff' },

  /* list */
  listWrap: { flex: 1 },
  pierRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.border,
  },
  pierRowOn: { backgroundColor: COLORS.brandNavy + '06' },
  pierRadio: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 2, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
  pierRadioOn:  { borderColor: COLORS.brandNavy },
  pierRadioDot: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: COLORS.brandNavy },
  pierName:     { fontSize: 14, fontWeight: '600', color: COLORS.text1 },
  pierNameOn:   { color: COLORS.brandNavy },
  pierAddr:     { fontSize: 12, color: COLORS.text3, marginTop: 2, lineHeight: 17 },

  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingTop: 60 },
  emptyTxt: { fontSize: 14, color: COLORS.text3 },
});
