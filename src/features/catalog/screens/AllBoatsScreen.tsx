import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  LayoutList,
  Map,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react-native';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  FlatListProps,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '@/shared/colors';
import { ScreenHeader } from '@/shared/components/ScreenHeader';
import { Boat } from '@/store/useCatalogStore';
import { useHomeData } from '@/features/home/hooks/useHomeData';

import { PromoCard } from '../../home/components/PromoCard';
import { useAvailabilityCache } from '../hooks/useAvailabilityCache';
import { usePiersCache } from '../hooks/usePiersCache';
import { findPiersInRadius, sortBoats, AvailInfo } from '../utils/filterUtils';
import { useDiscountsCache } from '../hooks/useDiscountsCache';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DateTimeFilter {
  date: Date | null;
  startHour: number;
  durationHours: number;
}

interface Filters {
  typeId: string;
  capacityMin: number | null;
  priceMin: number | null;
  priceMax: number | null;
  hasTarp: boolean;
  hasToilet: boolean;
  hasHeating: boolean;
  dateTime: DateTimeFilter;
  pierIds: string[];
  pierRadiusKm: number;
}

const DEFAULT: Filters = {
  typeId: 'all',
  capacityMin: null, priceMin: null, priceMax: null,
  hasTarp: false, hasToilet: false, hasHeating: false,
  dateTime: { date: null, startHour: 10, durationHours: 2 },
  pierIds: [],
  pierRadiusKm: 5,
};

// ─── Constants ────────────────────────────────────────────────────────────────

const SCREEN_W    = Dimensions.get('window').width;
const SCREEN_H    = Dimensions.get('window').height;
// scrollY threshold where the collapsed overlay is fully visible
const COLLAPSE_AT = 110;

const TYPE_CHIPS = [
  { id: 'all',         label: 'Все',                boatType: '' },
  { id: 'boat',        label: 'Катер',              boatType: 'катер' },
  { id: 'yacht',       label: 'Яхта',               boatType: 'яхта' },
  { id: 'ship',        label: 'Теплоход',           boatType: 'теплоход' },
  { id: 'venetian',    label: 'Венецианский катер', boatType: 'венецианский катер' },
  { id: 'canal_yacht', label: 'Канальная яхта',     boatType: 'канальная яхта' },
] as const;

const CAPACITY_OPTS = [null, 4, 5, 6, 7, 8, 9, 10, 11] as const;

const PRICE_PRESETS = [
  { label: 'до 15 000',     min: null,  max: 15000 },
  { label: '15 000–30 000', min: 15000, max: 30000 },
  { label: '30 000+',       min: 30000, max: null  },
] as const;

const AMENITIES = [
  { key: 'hasTarp'    as const, label: 'Тент / навес' },
  { key: 'hasToilet'  as const, label: 'Туалет на борту' },
  { key: 'hasHeating' as const, label: 'Отопление' },
];

const TIME_OPTS     = Array.from({ length: 16 }, (_, i) => i + 7); // 07:00 – 22:00
const DURATION_OPTS = [1, 2, 3, 4, 6, 8, 12];

const MONTHS_RU     = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const MONTHS_GEN_RU = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
const MONTHS_S_RU   = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
const DAYS_SHORT    = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];

function durLabel(h: number) { return h === 1 ? '1 час' : h < 5 ? `${h} часа` : `${h} часов`; }
function fmtShort(d: Date)   { return `${d.getDate()} ${MONTHS_S_RU[d.getMonth()]}`; }
function fmtFull(d: Date)    { return `${d.getDate()} ${MONTHS_GEN_RU[d.getMonth()]} ${d.getFullYear()}`; }
function fmtHour(h: number)  { return `${String(h).padStart(2,'0')}:00`; }
function ruFmt(n: number)    { return new Intl.NumberFormat('ru-RU').format(n); }


function countActive(f: Filters): number {
  return [
    f.typeId !== 'all', f.capacityMin !== null,
    f.priceMin !== null, f.priceMax !== null,
    f.hasTarp, f.hasToilet, f.hasHeating,
    f.dateTime.date !== null,
    f.pierIds.length > 0,
  ].filter(Boolean).length;
}

// ─── Calendar ─────────────────────────────────────────────────────────────────

const CELL_SIZE = Math.floor((SCREEN_W - 40 - 16) / 7);

function CalendarPicker({ selected, onSelect }: { selected: Date | null; onSelect: (d: Date) => void }) {
  const today = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);
  const [viewMonth, setViewMonth] = useState(() => {
    const b = selected ?? new Date();
    return new Date(b.getFullYear(), b.getMonth(), 1);
  });
  const [open, setOpen] = useState(true);
  const year = viewMonth.getFullYear(), month = viewMonth.getMonth();

  const cells = useMemo(() => {
    const offset      = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev  = new Date(year, month, 0).getDate();
    const arr: Array<{ day: number; thisMonth: boolean; date: Date }> = [];
    for (let i = offset - 1; i >= 0; i--)
      arr.push({ day: daysInPrev - i, thisMonth: false, date: new Date(year, month - 1, daysInPrev - i) });
    for (let d = 1; d <= daysInMonth; d++)
      arr.push({ day: d, thisMonth: true, date: new Date(year, month, d) });
    const rem = arr.length % 7;
    if (rem > 0) for (let d = 1; d <= 7 - rem; d++)
      arr.push({ day: d, thisMonth: false, date: new Date(year, month + 1, d) });
    return arr;
  }, [year, month]);

  const isSel = (d: Date) => selected !== null &&
    d.getFullYear() === selected.getFullYear() && d.getMonth() === selected.getMonth() && d.getDate() === selected.getDate();

  if (!open) {
    return (
      <Pressable style={cs.collapsed} onPress={() => setOpen(true)}>
        <Text style={cs.collapsedLabel}>Выбранная дата</Text>
        <View style={cs.collapsedRow}>
          <Text style={cs.collapsedDate}>{selected ? fmtFull(selected) : 'Выберите дату'}</Text>
          <ChevronRight size={15} color={COLORS.brandNavy} strokeWidth={2} />
        </View>
      </Pressable>
    );
  }

  return (
    <View>
      <View style={cs.monthNav}>
        <Pressable onPress={() => setViewMonth(new Date(year, month - 1, 1))} hitSlop={14}>
          <ChevronLeft size={20} color={COLORS.text2} strokeWidth={2} />
        </Pressable>
        <Text style={cs.monthTitle}>{MONTHS_RU[month]} {year}</Text>
        <Pressable onPress={() => setViewMonth(new Date(year, month + 1, 1))} hitSlop={14}>
          <ChevronRight size={20} color={COLORS.text2} strokeWidth={2} />
        </Pressable>
      </View>
      <View style={cs.dayRow}>
        {DAYS_SHORT.map((d) => <View key={d} style={cs.cell}><Text style={cs.dayHdr}>{d}</Text></View>)}
      </View>
      {Array.from({ length: Math.ceil(cells.length / 7) }, (_, w) => cells.slice(w * 7, w * 7 + 7)).map((week, wi) => (
        <View key={wi} style={cs.dayRow}>
          {week.map((cell, ci) => {
            const past = cell.date < today && cell.thisMonth;
            const sel  = isSel(cell.date);
            const tod  = cell.date.getTime() === today.getTime();
            return (
              <Pressable key={ci}
                style={[cs.cell, cs.cellP, sel && cs.cellSel, tod && !sel && cs.cellToday]}
                onPress={() => { if (!past && cell.thisMonth) { onSelect(cell.date); setOpen(false); } }}
                disabled={past || !cell.thisMonth}>
                <Text style={[cs.cellTxt, !cell.thisMonth && cs.cellOther, past && cs.cellPast, tod && !sel && cs.cellTodayTxt, sel && cs.cellSelTxt]}>
                  {cell.day}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const cs = StyleSheet.create({
  monthNav:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  monthTitle:   { fontSize: 15, fontWeight: '700', color: COLORS.text1 },
  dayRow:       { flexDirection: 'row', marginBottom: 2 },
  cell:         { width: CELL_SIZE, height: CELL_SIZE, alignItems: 'center', justifyContent: 'center' },
  cellP:        { borderRadius: CELL_SIZE / 2 },
  dayHdr:       { fontSize: 11, fontWeight: '600', color: COLORS.text3 },
  cellTxt:      { fontSize: 14, fontWeight: '500', color: COLORS.text1 },
  cellOther:    { color: COLORS.border },
  cellPast:     { color: COLORS.text3, opacity: 0.38 },
  cellSel:      { backgroundColor: COLORS.brandNavy },
  cellSelTxt:   { color: COLORS.white, fontWeight: '700' },
  cellToday:    { borderWidth: 1.5, borderColor: COLORS.brandNavy },
  cellTodayTxt: { color: COLORS.brandNavy, fontWeight: '700' },
  collapsed:    { paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14, backgroundColor: COLORS.backgroundAlt, borderWidth: 1, borderColor: COLORS.border },
  collapsedLabel: { fontSize: 11, fontWeight: '600', color: COLORS.text3, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.6 },
  collapsedRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  collapsedDate:  { fontSize: 16, fontWeight: '700', color: COLORS.brandNavy },
});

// ─── TimeScroll ───────────────────────────────────────────────────────────────

const TIME_CHIP_W = 68;
const TIME_CHIP_GAP = 8;

function TimeScroll({ selected, onSelect }: { selected: number; onSelect: (h: number) => void }) {
  const ref = useRef<ScrollView>(null);

  useEffect(() => {
    const idx = TIME_OPTS.indexOf(selected);
    if (idx < 0) return;
    // small delay so the ScrollView has laid out
    const t = setTimeout(() => {
      ref.current?.scrollTo({ x: idx * (TIME_CHIP_W + TIME_CHIP_GAP), animated: true });
    }, 80);
    return () => clearTimeout(t);
  }, [selected]);

  return (
    <ScrollView
      ref={ref}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: TIME_CHIP_GAP, paddingBottom: 4 }}
      decelerationRate="fast"
    >
      {TIME_OPTS.map((h) => {
        const on = selected === h;
        return (
          <Pressable
            key={h}
            style={[ts.chip, on && ts.chipOn]}
            onPress={() => onSelect(h)}
          >
            <Text style={[ts.txt, on && ts.txtOn]}>{fmtHour(h)}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const ts = StyleSheet.create({
  chip:  { width: TIME_CHIP_W, paddingVertical: 10, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.backgroundAlt, borderWidth: 1, borderColor: COLORS.border },
  chipOn:{ backgroundColor: COLORS.brandNavy, borderColor: COLORS.brandNavy },
  txt:   { fontSize: 14, fontWeight: '600', color: COLORS.text2 },
  txtOn: { color: COLORS.white },
});

// ─── Animated FlatList ────────────────────────────────────────────────────────

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList) as React.ComponentType<
  FlatListProps<Boat> & { ref?: React.Ref<FlatList<Boat>> }
>;

function FilterSection({
  title, expanded, onToggle, children,
}: {
  title: string; expanded: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <View style={fs.wrap}>
      <Pressable style={fs.header} onPress={onToggle}>
        <Text style={fs.title}>{title}</Text>
        {expanded
          ? <ChevronUp size={18} color={COLORS.text2} strokeWidth={2} />
          : <ChevronDown size={18} color={COLORS.text2} strokeWidth={2} />}
      </Pressable>
      {expanded && <View style={fs.body}>{children}</View>}
    </View>
  );
}

const fs = StyleSheet.create({
  wrap:   { paddingHorizontal: 24, paddingVertical: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title:  { fontSize: 17, fontWeight: '700', color: '#000' },
  body:   { marginTop: 20 },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export function AllBoatsScreen() {
  const insets    = useSafeAreaInsets();
  const params    = useLocalSearchParams<{ type?: string }>();
  const scrollY   = useRef(new Animated.Value(0)).current;
  // ref for native pointer-events toggle — no React re-render needed
  const overlayRef = useRef<View>(null);

  const initialFilters = useMemo<Filters>(() => {
    const chip = TYPE_CHIPS.find((c) => c.id === params.type);
    if (!chip || chip.id === 'all') return DEFAULT;
    return { ...DEFAULT, typeId: chip.id };
  }, []);

  const { boats: allBoats, isLoadingBoats: loading, refetch } = useHomeData();
  const allPiers = usePiersCache();

  const total = allBoats.length;
  const [refreshing, setRef] = useState(false);
  const [viewMode, setView]  = useState<'list' | 'map'>('list');
  const [filters, setFilters]   = useState<Filters>(initialFilters);
  const [draft, setDraft]       = useState<Filters>(initialFilters);
  const [searchText, setSearch] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [sec, setSec] = useState({ amenities: true, datetime: true, pier: false });

  const capIdx = draft.capacityMin === null
    ? 0
    : Math.max(0, CAPACITY_OPTS.indexOf(draft.capacityMin as typeof CAPACITY_OPTS[number]));

  const { availMap, loading: availLoading } = useAvailabilityCache(filters.dateTime);
  const discountsMap = useDiscountsCache();

  const handleRefresh = useCallback(async () => {
    setRef(true);
    await refetch();
    setRef(false);
  }, [refetch]);

  // Toggle overlay pointer-events via setNativeProps — zero React re-renders
  useEffect(() => {
    const id = scrollY.addListener(({ value }) => {
      overlayRef.current?.setNativeProps({
        pointerEvents: value >= COLLAPSE_AT * 0.55 ? 'auto' : 'none',
      });
    });
    return () => scrollY.removeListener(id);
  }, []);

  // ── Animated values (all useNativeDriver: true) ────────────────────────────
  const overlayOpacity = scrollY.interpolate({
    inputRange: [COLLAPSE_AT * 0.45, COLLAPSE_AT],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // ── Client filter + sort ───────────────────────────────────────────────────
  const renderBoat = useCallback(
    ({ item }: { item: Boat }) => (
      <PromoCard
        boat={item}
        availInfo={availMap[item.id]}
        discount={discountsMap.get(item.id)}
      />
    ),
    [availMap, discountsMap],
  );

  const applyBoatFilter = useCallback((f: Filters, q: string) => {
    const chip = TYPE_CHIPS.find((c) => c.id === f.typeId);
    const hasAvailData = f.dateTime.date !== null && Object.keys(availMap).length > 0;

    // pier radius filter
    let pierSet: Set<string> | null = null;
    if (f.pierIds.length > 0) {
      pierSet = findPiersInRadius(allPiers, f.pierIds, f.pierRadiusKm);
    }

    const pass = allBoats.filter((b) => {
      const t = (b.type ?? '').toLowerCase();
      if (chip?.boatType && t !== chip.boatType) return false;
      if (q && !b.name.toLowerCase().includes(q)) return false;
      if (f.capacityMin !== null && (b.capacity ?? 0) < f.capacityMin) return false;
      if (f.priceMin !== null && b.price_per_hour < f.priceMin) return false;
      if (f.priceMax !== null && b.price_per_hour > f.priceMax) return false;
      if (f.hasTarp    && !b.has_tarp)    return false;
      if (f.hasToilet  && !b.has_toilet)  return false;
      if (f.hasHeating && !b.has_heating) return false;
      if (hasAvailData && availMap[b.id]?.status === 'not_available') return false;
      if (pierSet && (!b.pier_id || !pierSet.has(b.pier_id))) return false;
      return true;
    });

    return sortBoats(pass, {
      pierIds: f.pierIds,
      availMap,
      allPiers,
      radiusKm: f.pierRadiusKm,
      dateActive: f.dateTime.date !== null,
    });
  }, [allBoats, availMap, allPiers]);

  const filtered      = useMemo(() => applyBoatFilter(filters, searchText.trim().toLowerCase()), [applyBoatFilter, filters, searchText]);
  const draftFiltered = useMemo(() => applyBoatFilter(draft,   searchText.trim().toLowerCase()), [applyBoatFilter, draft,    searchText]);

  const badge     = countActive(filters);
  const hasActive = badge > 0 || searchText.trim() !== '';

  // ── Sheet ──────────────────────────────────────────────────────────────────
  const openSheet  = () => { setDraft(filters); setFilterVisible(true); };
  const closeSheet = () => setFilterVisible(false);
  const applyDraft = () => { setFilters(draft); closeSheet(); };
  const removeTag  = (key: keyof Filters, def: any) => setFilters((f) => ({ ...f, [key]: def }));

  const setPricePreset = (min: number | null, max: number | null) =>
    setDraft((d) => ({ ...d, priceMin: min, priceMax: max }));
  const matchesPreset  = (min: number | null, max: number | null) =>
    draft.priceMin === min && draft.priceMax === max;

  const dtSummary = (dt: DateTimeFilter) =>
    `${dt.date ? fmtShort(dt.date) : 'Сегодня'} · ${fmtHour(dt.startHour)} · ${durLabel(dt.durationHours)}`;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={s.root}>

      {/* ── Normal header (same as before) ──────────────────────────────── */}
      <ScreenHeader
        title="Доступные суда"
        right={
          <Pressable style={[s.filterBtn, badge > 0 && s.filterBtnActive]} onPress={openSheet} hitSlop={8}>
            <SlidersHorizontal size={17} color={badge > 0 ? COLORS.white : COLORS.text2} strokeWidth={1.8} />
            {badge > 0 && <View style={s.filterBadge}><Text style={s.filterBadgeTxt}>{badge}</Text></View>}
          </Pressable>
        }
      />

      {/* ── List ────────────────────────────────────────────────────────── */}
      {loading ? (
        <View style={s.loader}><ActivityIndicator color={COLORS.brandNavy} size="large" /></View>
      ) : (
        <AnimatedFlatList
          data={filtered}
          keyExtractor={(b: Boat) => b.id}
          numColumns={2}
          renderItem={renderBoat}
          columnWrapperStyle={s.row}
          contentContainerStyle={[s.list, { paddingBottom: insets.bottom + 90 }]}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          removeClippedSubviews
          initialNumToRender={6}
          maxToRenderPerBatch={4}
          windowSize={5}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true },
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.brandNavy} />
          }
          ListHeaderComponent={
            <View>
              {/* Search */}
              <View style={s.searchWrap}>
                <Search size={15} color={COLORS.text3} strokeWidth={2} />
                <TextInput
                  style={s.searchInput}
                  placeholder="Найти судно по названию..."
                  placeholderTextColor={COLORS.text3}
                  value={searchText}
                  onChangeText={setSearch}
                  returnKeyType="search"
                  clearButtonMode="while-editing"
                />
                {searchText.length > 0 && (
                  <Pressable onPress={() => setSearch('')} hitSlop={8}>
                    <X size={13} color={COLORS.text3} strokeWidth={2.5} />
                  </Pressable>
                )}
              </View>

              {/* Type chips — no white background, consistent with screen bg */}
              <View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipStrip}>
                  {TYPE_CHIPS.map((c) => {
                    const on = filters.typeId === c.id;
                    return (
                      <Pressable key={c.id} style={[s.chip, on && s.chipOn]}
                        onPress={() => setFilters((f) => ({ ...f, typeId: c.id }))}>
                        <Text style={[s.chipTxt, on && s.chipTxtOn]}>{c.label}</Text>
                      </Pressable>
                    );
                  })}
                  <View style={s.sep} />
                  <Pressable style={[s.chip, filters.capacityMin !== null && s.chipOn]} onPress={openSheet}>
                    <Text style={[s.chipTxt, filters.capacityMin !== null && s.chipTxtOn]}>
                      {filters.capacityMin !== null ? `от ${filters.capacityMin} гостей` : 'Вместимость'}
                    </Text>
                  </Pressable>
                  <Pressable style={[s.chip, filters.dateTime.date !== null && s.chipOn]} onPress={openSheet}>
                    <Calendar size={13} color={filters.dateTime.date !== null ? COLORS.white : COLORS.text2} strokeWidth={2} />
                    <Text style={[s.chipTxt, filters.dateTime.date !== null && s.chipTxtOn]}>
                      {filters.dateTime.date !== null ? fmtShort(filters.dateTime.date) : 'Дата'}
                    </Text>
                  </Pressable>
                  <Pressable style={[s.chip, filters.pierIds.length > 0 && s.chipOn]} onPress={openSheet}>
                    <Text style={[s.chipTxt, filters.pierIds.length > 0 && s.chipTxtOn]}>
                      {filters.pierIds.length > 0
                        ? `${filters.pierIds.length} пирс${filters.pierIds.length > 1 ? 'а' : ''}`
                        : 'Пирс'}
                    </Text>
                  </Pressable>
                </ScrollView>
              </View>

              {/* Active tags */}
              {hasActive && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tagStrip}>
                  {filters.typeId !== 'all' && (
                    <Pressable style={s.tag} onPress={() => removeTag('typeId', 'all')}>
                      <Text style={s.tagTxt}>{TYPE_CHIPS.find((c) => c.id === filters.typeId)?.label}</Text>
                      <X size={11} color={COLORS.brandNavy} strokeWidth={2.5} />
                    </Pressable>
                  )}
                  {searchText.trim() !== '' && (
                    <Pressable style={s.tag} onPress={() => setSearch('')}>
                      <Text style={s.tagTxt}>«{searchText}»</Text>
                      <X size={11} color={COLORS.brandNavy} strokeWidth={2.5} />
                    </Pressable>
                  )}
                  {filters.dateTime.date !== null && (
                    <Pressable style={s.tag} onPress={() => removeTag('dateTime', { ...filters.dateTime, date: null })}>
                      <Text style={s.tagTxt}>{dtSummary(filters.dateTime)}</Text>
                      <X size={11} color={COLORS.brandNavy} strokeWidth={2.5} />
                    </Pressable>
                  )}
                  {filters.capacityMin !== null && (
                    <Pressable style={s.tag} onPress={() => removeTag('capacityMin', null)}>
                      <Text style={s.tagTxt}>от {filters.capacityMin} гостей</Text>
                      <X size={11} color={COLORS.brandNavy} strokeWidth={2.5} />
                    </Pressable>
                  )}
                  {(filters.priceMin !== null || filters.priceMax !== null) && (
                    <Pressable style={s.tag} onPress={() => { removeTag('priceMin', null); removeTag('priceMax', null); }}>
                      <Text style={s.tagTxt}>
                        {filters.priceMin !== null && filters.priceMax !== null
                          ? `${ruFmt(filters.priceMin)}–${ruFmt(filters.priceMax)} ₽`
                          : filters.priceMax !== null ? `до ${ruFmt(filters.priceMax)} ₽`
                          : `от ${ruFmt(filters.priceMin!)} ₽`}
                      </Text>
                      <X size={11} color={COLORS.brandNavy} strokeWidth={2.5} />
                    </Pressable>
                  )}
                  {filters.hasTarp    && <Pressable style={s.tag} onPress={() => removeTag('hasTarp', false)}><Text style={s.tagTxt}>Тент</Text><X size={11} color={COLORS.brandNavy} strokeWidth={2.5} /></Pressable>}
                  {filters.hasToilet  && <Pressable style={s.tag} onPress={() => removeTag('hasToilet', false)}><Text style={s.tagTxt}>Туалет</Text><X size={11} color={COLORS.brandNavy} strokeWidth={2.5} /></Pressable>}
                  {filters.hasHeating && <Pressable style={s.tag} onPress={() => removeTag('hasHeating', false)}><Text style={s.tagTxt}>Отопление</Text><X size={11} color={COLORS.brandNavy} strokeWidth={2.5} /></Pressable>}
                  {filters.pierIds.length > 0 && (
                    <Pressable style={s.tag} onPress={() => removeTag('pierIds', [])}>
                      <Text style={s.tagTxt}>
                        {filters.pierIds.length === 1
                          ? (allPiers.find((p) => p.id === filters.pierIds[0])?.name ?? 'Пирс')
                          : `${filters.pierIds.length} пирса`}
                        {` ±${filters.pierRadiusKm} км`}
                      </Text>
                      <X size={11} color={COLORS.brandNavy} strokeWidth={2.5} />
                    </Pressable>
                  )}
                  <Pressable style={s.resetBtn} onPress={() => { setFilters(DEFAULT); setSearch(''); }}>
                    <Text style={s.resetTxt}>Сбросить</Text>
                  </Pressable>
                </ScrollView>
              )}

              {/* Counter + toggle */}
              <View style={s.barRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={s.counter}>
                    {hasActive ? `${filtered.length} из ${ruFmt(total)} судов` : `${ruFmt(total)} судов найдено`}
                  </Text>
                  {availLoading && <ActivityIndicator size="small" color={COLORS.brandNavy} />}
                </View>
                <View style={s.toggle}>
                  {(['list', 'map'] as const).map((m) => (
                    <Pressable key={m} style={[s.tBtn, viewMode === m && s.tBtnOn]} onPress={() => setView(m)}>
                      {m === 'list'
                        ? <LayoutList size={14} color={viewMode === m ? COLORS.brandNavy : COLORS.text3} strokeWidth={2} />
                        : <Map       size={14} color={viewMode === m ? COLORS.brandNavy : COLORS.text3} strokeWidth={2} />}
                      <Text style={[s.tTxt, viewMode === m && s.tTxtOn]}>
                        {m === 'list' ? 'Список' : 'Карта'}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyTxt}>Суда не найдены</Text>
              {hasActive && (
                <Pressable onPress={() => { setFilters(DEFAULT); setSearch(''); }} style={s.emptyBtn}>
                  <Text style={s.emptyBtnTxt}>Сбросить фильтры</Text>
                </Pressable>
              )}
            </View>
          }
        />
      )}

      {/* ── Collapsed header overlay — fades in over ScreenHeader on scroll ── */}
      <View ref={overlayRef} pointerEvents="none" style={s.overlayWrap}>
        <Animated.View
          style={[
            s.overlayInner,
            { paddingTop: insets.top, opacity: overlayOpacity,
              transform: [{ translateY: overlayOpacity.interpolate({ inputRange: [0,1], outputRange: [-6, 0] }) }] },
          ]}
        >
          {/* Search input */}
          <View style={s.overlaySearchWrap}>
            <Search size={15} color={COLORS.text3} strokeWidth={2} />
            <TextInput
              style={s.overlaySearchInput}
              placeholder="Найти судно..."
              placeholderTextColor={COLORS.text3}
              value={searchText}
              onChangeText={setSearch}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
            {searchText.length > 0 && (
              <Pressable onPress={() => setSearch('')} hitSlop={8}>
                <X size={13} color={COLORS.text3} strokeWidth={2.5} />
              </Pressable>
            )}
          </View>

          {/* Filter */}
          <Pressable style={[s.filterBtn, badge > 0 && s.filterBtnActive]} onPress={openSheet} hitSlop={8}>
            <SlidersHorizontal size={17} color={badge > 0 ? COLORS.white : COLORS.text2} strokeWidth={1.8} />
            {badge > 0 && <View style={s.filterBadge}><Text style={s.filterBadgeTxt}>{badge}</Text></View>}
          </Pressable>
        </Animated.View>
      </View>

      {/* ── Filter Modal ─────────────────────────────────────────────────── */}
      <Modal visible={filterVisible} animationType="slide" transparent onRequestClose={closeSheet}>
        <View style={s.modalOverlay} pointerEvents="box-none">
          <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet} />
          <View style={[s.modalSheet, s.modalSheetFull]}>

            {/* Handle */}
            <View style={s.handleWrap}><View style={s.handle} /></View>

            {/* Header */}
            <View style={s.fHeader}>
              <Text style={s.fHeaderTitle}>Фильтры</Text>
              <Pressable style={s.fCloseBtn} onPress={closeSheet} hitSlop={8}>
                <X size={16} color={COLORS.text1} strokeWidth={2.5} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

              {/* ── Тип судна ── */}
              <View style={s.fSection}>
                <Text style={s.fSecTitle}>Тип судна</Text>
                <View style={[s.fChipGrid, { marginTop: 16 }]}>
                  {TYPE_CHIPS.map((c) => {
                    const on = draft.typeId === c.id;
                    return (
                      <Pressable key={c.id} style={[s.fChip, on && s.fChipOn]}
                        onPress={() => setDraft((d) => ({ ...d, typeId: c.id }))}>
                        <Text style={[s.fChipTxt, on && s.fChipTxtOn]}>{c.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
              <View style={s.fDivider} />

              {/* ── Вместимость ── */}
              <View style={s.fSection}>
                <Text style={s.fSecTitle}>Вместимость</Text>
                <View style={s.fStepRow}>
                  <Text style={s.fStepLabel}>Мин. гостей</Text>
                  <View style={s.fStepper}>
                    <Pressable
                      style={[s.fStepBtn, capIdx === 0 && s.fStepBtnDis]}
                      onPress={() => capIdx > 0 && setDraft((d) => ({ ...d, capacityMin: CAPACITY_OPTS[capIdx - 1] ?? null }))}
                    >
                      <Text style={[s.fStepBtnTxt, capIdx === 0 && s.fStepBtnTxtDis]}>−</Text>
                    </Pressable>
                    <Text style={s.fStepVal}>
                      {capIdx === 0 ? 'Неважно' : CAPACITY_OPTS[capIdx] === 11 ? '11+' : `${CAPACITY_OPTS[capIdx]}+`}
                    </Text>
                    <Pressable
                      style={[s.fStepBtn, capIdx === CAPACITY_OPTS.length - 1 && s.fStepBtnDis]}
                      onPress={() => capIdx < CAPACITY_OPTS.length - 1 && setDraft((d) => ({ ...d, capacityMin: CAPACITY_OPTS[capIdx + 1] ?? null }))}
                    >
                      <Text style={[s.fStepBtnTxt, capIdx === CAPACITY_OPTS.length - 1 && s.fStepBtnTxtDis]}>+</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
              <View style={s.fDivider} />

              {/* ── Цена ── */}
              <View style={s.fSection}>
                <Text style={s.fSecTitle}>Цена за час</Text>
                <Text style={s.fSecSub}>В рублях за час аренды</Text>
                <View style={s.fPriceRow}>
                  <View style={s.fPriceBox}>
                    <Text style={s.fPriceBoxLbl}>от</Text>
                    <TextInput style={s.fPriceInput} placeholder="0" placeholderTextColor={COLORS.text3}
                      keyboardType="numeric"
                      value={draft.priceMin !== null ? String(draft.priceMin) : ''}
                      onChangeText={(v) => setDraft((d) => ({ ...d, priceMin: v ? Number(v) : null }))} />
                  </View>
                  <View style={s.fPriceDash} />
                  <View style={s.fPriceBox}>
                    <Text style={s.fPriceBoxLbl}>до</Text>
                    <TextInput style={s.fPriceInput} placeholder="∞" placeholderTextColor={COLORS.text3}
                      keyboardType="numeric"
                      value={draft.priceMax !== null ? String(draft.priceMax) : ''}
                      onChangeText={(v) => setDraft((d) => ({ ...d, priceMax: v ? Number(v) : null }))} />
                  </View>
                </View>
                <View style={[s.fChipGrid, { marginTop: 12 }]}>
                  {PRICE_PRESETS.map((p) => {
                    const on = matchesPreset(p.min, p.max);
                    return (
                      <Pressable key={p.label} style={[s.fChip, on && s.fChipOn]}
                        onPress={() => on ? setPricePreset(null, null) : setPricePreset(p.min, p.max)}>
                        <Text style={[s.fChipTxt, on && s.fChipTxtOn]}>{p.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
              <View style={s.fDivider} />

              {/* ── Удобства ── */}
              <FilterSection title="Удобства" expanded={sec.amenities}
                onToggle={() => setSec((s) => ({ ...s, amenities: !s.amenities }))}>
                {AMENITIES.map(({ key, label }) => {
                  const on = draft[key];
                  return (
                    <Pressable key={key} style={s.fCheckRow}
                      onPress={() => setDraft((d) => ({ ...d, [key]: !d[key] }))}>
                      <Text style={s.fCheckLabel}>{label}</Text>
                      <View style={[s.fCheckbox, on && s.fCheckboxOn]}>
                        {on && <View style={s.fCheckmark} />}
                      </View>
                    </Pressable>
                  );
                })}
              </FilterSection>
              <View style={s.fDivider} />

              {/* ── Дата и время ── */}
              <FilterSection title="Дата и время" expanded={sec.datetime}
                onToggle={() => setSec((s) => ({ ...s, datetime: !s.datetime }))}>
                <CalendarPicker
                  selected={draft.dateTime.date}
                  onSelect={(d) => setDraft((prev) => ({ ...prev, dateTime: { ...prev.dateTime, date: d } }))}
                />
                <Text style={[s.fSubSec, { marginTop: 20 }]}>Время начала</Text>
                <TimeScroll
                  selected={draft.dateTime.startHour}
                  onSelect={(h) => setDraft((d) => ({ ...d, dateTime: { ...d.dateTime, startHour: h } }))}
                />
                <Text style={[s.fSubSec, { marginTop: 20 }]}>Продолжительность</Text>
                <View style={s.fChipGrid}>
                  {DURATION_OPTS.map((h) => {
                    const on = draft.dateTime.durationHours === h;
                    return (
                      <Pressable key={h} style={[s.fChip, on && s.fChipOn]}
                        onPress={() => setDraft((d) => ({ ...d, dateTime: { ...d.dateTime, durationHours: h } }))}>
                        <Text style={[s.fChipTxt, on && s.fChipTxtOn]}>{durLabel(h)}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </FilterSection>
              <View style={s.fDivider} />

              {/* ── Пирс ── */}
              {allPiers.length > 0 && (
                <>
                  <FilterSection title="Пирс отправления" expanded={sec.pier}
                    onToggle={() => setSec((s) => ({ ...s, pier: !s.pier }))}>
                    {allPiers.map((p) => {
                      const on = draft.pierIds.includes(p.id);
                      return (
                        <Pressable key={p.id} style={s.fCheckRow}
                          onPress={() => setDraft((d) => ({
                            ...d,
                            pierIds: on ? d.pierIds.filter((x) => x !== p.id) : [...d.pierIds, p.id],
                          }))}>
                          <Text style={s.fCheckLabel}>{p.name}</Text>
                          <View style={[s.fCheckbox, on && s.fCheckboxOn]}>
                            {on && <View style={s.fCheckmark} />}
                          </View>
                        </Pressable>
                      );
                    })}
                    {draft.pierIds.length > 0 && (
                      <>
                        <Text style={[s.fSubSec, { marginTop: 20 }]}>Радиус поиска</Text>
                        <View style={[s.fChipGrid, { marginTop: 8 }]}>
                          {[1, 2, 5, 10, 20].map((km) => {
                            const on = draft.pierRadiusKm === km;
                            return (
                              <Pressable key={km} style={[s.fChip, on && s.fChipOn]}
                                onPress={() => setDraft((d) => ({ ...d, pierRadiusKm: km }))}>
                                <Text style={[s.fChipTxt, on && s.fChipTxtOn]}>{km} км</Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      </>
                    )}
                  </FilterSection>
                  <View style={s.fDivider} />
                </>
              )}

              <View style={{ height: 8 }} />
            </ScrollView>

            {/* Footer */}
            <View style={[s.fFooter, { paddingBottom: insets.bottom + 12 }]}>
              <Pressable onPress={() => { setDraft(DEFAULT); }} hitSlop={12}>
                <Text style={s.fFooterReset}>Очистить всё</Text>
              </Pressable>
              <Pressable style={({ pressed }) => [s.fFooterApply, pressed && { opacity: 0.88 }]} onPress={applyDraft}>
                <Text style={s.fFooterApplyTxt}>
                  {draftFiltered.length > 0 ? `Показать ${draftFiltered.length} судов` : 'Показать суда'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.backgroundAlt },

  filterBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: COLORS.muted, alignItems: 'center', justifyContent: 'center',
  },
  filterBtnActive: { backgroundColor: COLORS.brandNavy },
  filterBadge: {
    position: 'absolute', top: -2, right: -2,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: COLORS.brandCyan, alignItems: 'center', justifyContent: 'center',
  },
  filterBadgeTxt: { fontSize: 9, fontWeight: '800', color: COLORS.white },

  // ── Collapsed header overlay ─────────────────────────────────────────────
  overlayWrap: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30,
  },
  overlayInner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 12, paddingBottom: 10,
    backgroundColor: COLORS.white,
  },
  overlaySearchWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 9,
    backgroundColor: COLORS.backgroundAlt, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.border,
  },
  overlaySearchInput: { flex: 1, fontSize: 14, color: COLORS.text1, padding: 0 },

  // ── List header ──────────────────────────────────────────────────────────
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginTop: 8, marginBottom: 4,
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: COLORS.white, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.text1, padding: 0 },

  chipStrip:  { paddingHorizontal: 16, paddingVertical: 8, gap: 8, alignItems: 'center' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 13, paddingVertical: 6, borderRadius: 20,
    backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border,
  },
  chipOn:    { backgroundColor: COLORS.brandNavy, borderColor: COLORS.brandNavy },
  chipTxt:   { fontSize: 13, fontWeight: '500', color: COLORS.text2 },
  chipTxtOn: { color: COLORS.white, fontWeight: '600' },
  sep:       { width: 1, height: 18, backgroundColor: COLORS.border, marginHorizontal: 2 },

  tagStrip: { paddingHorizontal: 16, paddingVertical: 8, gap: 8, alignItems: 'center' },
  tag: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14,
    backgroundColor: COLORS.brandNavy + '12', borderWidth: 1, borderColor: COLORS.brandNavy + '28',
  },
  tagTxt:   { fontSize: 12, fontWeight: '600', color: COLORS.brandNavy },
  resetBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, backgroundColor: COLORS.muted },
  resetTxt: { fontSize: 12, fontWeight: '600', color: COLORS.text3 },

  barRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  counter: { fontSize: 13, fontWeight: '600', color: COLORS.text2 },
  toggle:  { flexDirection: 'row', gap: 2, backgroundColor: COLORS.white, borderRadius: 10, padding: 3, borderWidth: 1, borderColor: COLORS.border },
  tBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 7 },
  tBtnOn:  { backgroundColor: COLORS.brandNavy + '14' },
  tTxt:    { fontSize: 12, color: COLORS.text3, fontWeight: '500' },
  tTxtOn:  { color: COLORS.brandNavy, fontWeight: '600' },

  loader:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list:        { gap: 12, paddingHorizontal: 16 },
  row:         { gap: 12 },
  empty:       { paddingTop: 80, alignItems: 'center', gap: 12 },
  emptyTxt:    { fontSize: 15, color: COLORS.text3 },
  emptyBtn:    { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, backgroundColor: COLORS.brandNavy },
  emptyBtnTxt: { fontSize: 14, fontWeight: '700', color: COLORS.white },

  // ── Modal sheet ──────────────────────────────────────────────────────────
  // ── Modals ───────────────────────────────────────────────────────────────
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  modalSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: SCREEN_H * 0.94,
  },
  modalSheetFull: { maxHeight: SCREEN_H * 0.96 },
  handleWrap: { paddingTop: 12, paddingBottom: 2, alignItems: 'center' },
  handle:     { width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.border },

  // ── Filter sheet header ──────────────────────────────────────────────────
  fHeader: {
    height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border,
    position: 'relative',
  },
  fHeaderTitle: { fontSize: 16, fontWeight: '700', color: '#000' },
  fCloseBtn: {
    position: 'absolute', right: 16,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center',
  },

  // ── Sections ─────────────────────────────────────────────────────────────
  fSection:  { paddingHorizontal: 24, paddingVertical: 24 },
  fSecTitle: { fontSize: 17, fontWeight: '700', color: '#000' },
  fSecSub:   { fontSize: 13, color: COLORS.text3, marginTop: 4 },
  fSubSec:   { fontSize: 14, fontWeight: '600', color: COLORS.text1, marginBottom: 10 },
  fDivider:  { height: StyleSheet.hairlineWidth, backgroundColor: COLORS.border },

  // ── Chips ────────────────────────────────────────────────────────────────
  fChipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  fChip: {
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 30, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  fChipOn:    { borderWidth: 2, borderColor: '#000', backgroundColor: '#F7F7F7' },
  fChipTxt:   { fontSize: 14, color: COLORS.text2, fontWeight: '500' },
  fChipTxtOn: { color: '#000', fontWeight: '700' },

  // ── Stepper ──────────────────────────────────────────────────────────────
  fStepRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 },
  fStepLabel:  { fontSize: 15, color: COLORS.text1 },
  fStepper:    { flexDirection: 'row', alignItems: 'center', gap: 14 },
  fStepBtn: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
  fStepBtnDis:    { borderColor: COLORS.border, opacity: 0.3 },
  fStepBtnTxt:    { fontSize: 20, fontWeight: '300', color: '#000', lineHeight: 24 },
  fStepBtnTxtDis: { color: COLORS.text3 },
  fStepVal:       { fontSize: 15, fontWeight: '500', color: '#000', minWidth: 72, textAlign: 'center' },

  // ── Price ────────────────────────────────────────────────────────────────
  fPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20 },
  fPriceBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 14,
    borderRadius: 12, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.backgroundAlt,
  },
  fPriceBoxLbl: { fontSize: 13, color: COLORS.text3, fontWeight: '500' },
  fPriceInput:  { flex: 1, fontSize: 15, color: '#000', padding: 0 },
  fPriceDash:   { width: 16, height: 1.5, backgroundColor: COLORS.text3 },

  // ── Checkbox rows ────────────────────────────────────────────────────────
  fCheckRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border,
  },
  fCheckLabel:    { fontSize: 15, color: '#000', flex: 1 },
  fCheckbox: {
    width: 24, height: 24, borderRadius: 6,
    borderWidth: 1.5, borderColor: '#BBBBBB',
    alignItems: 'center', justifyContent: 'center',
  },
  fCheckboxOn:  { backgroundColor: '#000', borderColor: '#000' },
  fCheckmark:   { width: 12, height: 12, borderRadius: 2, backgroundColor: '#fff' },

  // ── Show more link ───────────────────────────────────────────────────────
  fShowMore:    { paddingTop: 16 },
  fShowMoreTxt: { fontSize: 14, fontWeight: '600', color: '#000', textDecorationLine: 'underline' },

  // ── Footer ───────────────────────────────────────────────────────────────
  fFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.border,
  },
  fFooterReset:      { fontSize: 15, fontWeight: '600', color: COLORS.text2, textDecorationLine: 'underline' },
  fFooterApply: {
    height: 52, paddingHorizontal: 28, borderRadius: 26,
    backgroundColor: '#000', alignItems: 'center', justifyContent: 'center',
  },
  fFooterApplyTxt: { fontSize: 15, fontWeight: '700', color: '#fff' },

  // ── Pier sheet rows ──────────────────────────────────────────────────────
  pierStackList: {
    marginTop: 10, borderRadius: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: COLORS.border,
  },
  pierRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 15,
    backgroundColor: COLORS.white,
  },
  pierRowBorder:     { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border },
  pierRowOn:         { backgroundColor: '#F7F7F7' },
  pierRowTxt:        { fontSize: 15, color: COLORS.text1, fontWeight: '500', flex: 1 },
  pierRowTxtOn:      { color: '#000', fontWeight: '600' },
  pierRowCheckbox:   { width: 24, height: 24, borderRadius: 6, borderWidth: 1.5, borderColor: '#BBBBBB', alignItems: 'center', justifyContent: 'center' },
  pierRowCheckboxOn: { backgroundColor: '#000', borderColor: '#000' },
  pierRowCheckmark:  { width: 12, height: 12, borderRadius: 2, backgroundColor: '#fff' },
});
