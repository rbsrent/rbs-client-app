import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
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
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '@/shared/colors';
import { ScreenHeader } from '@/shared/components/ScreenHeader';
import { SheetBackdrop } from '@/shared/components/SheetBackdrop';
import { publicSupabase, SUPABASE_URL } from '@/shared/supabase/publicClient';
import { Boat } from '@/store/useCatalogStore';

import { PromoCard } from '../../home/components/PromoCard';

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
}

const DEFAULT: Filters = {
  typeId: 'all',
  capacityMin: null, priceMin: null, priceMax: null,
  hasTarp: false, hasToilet: false, hasHeating: false,
  dateTime: { date: null, startHour: 10, durationHours: 2 },
};

// ─── Constants ────────────────────────────────────────────────────────────────

const SCREEN_W    = Dimensions.get('window').width;
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

const TIME_OPTS     = Array.from({ length: 24 }, (_, i) => i);
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
    f.hasTarp, f.hasToilet, f.hasHeating, f.dateTime.date !== null,
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

// ─── Animated FlatList ────────────────────────────────────────────────────────

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList) as React.ComponentType<
  FlatListProps<Boat> & { ref?: React.Ref<FlatList<Boat>> }
>;

// ─── Screen ───────────────────────────────────────────────────────────────────

export function AllBoatsScreen() {
  const insets    = useSafeAreaInsets();
  const params    = useLocalSearchParams<{ type?: string }>();
  const filterRef = useRef<BottomSheetModal>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scrollY   = useRef(new Animated.Value(0)).current;
  // ref for native pointer-events toggle — no React re-render needed
  const overlayRef = useRef<View>(null);

  const initialFilters = useMemo<Filters>(() => {
    const chip = TYPE_CHIPS.find((c) => c.id === params.type);
    if (!chip || chip.id === 'all') return DEFAULT;
    return { ...DEFAULT, typeId: chip.id };
  }, []);

  const [allBoats, setAll]      = useState<Boat[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRef]    = useState(false);
  const [viewMode, setView]     = useState<'list' | 'map'>('list');
  const [filters, setFilters]   = useState<Filters>(initialFilters);
  const [draft, setDraft]       = useState<Filters>(initialFilters);
  const [searchText, setSearch] = useState('');
  const fetched = useRef(false);

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
  // Pure opacity fade — no translateY, no border, completely clean
  const overlayOpacity = scrollY.interpolate({
    inputRange: [COLLAPSE_AT * 0.45, COLLAPSE_AT],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchBoats = useCallback(async (silent = false) => {
    silent ? setRef(true) : setLoading(true);
    try {
      const { data, count } = await publicSupabase
        .from('boats')
        .select(`
          id, name, type, capacity, length_meters,
          price_per_hour, public_price_per_hour_night,
          pier_id, seo_slug,
          has_tarp, has_heating, has_toilet, has_covered_saloon, has_bluetooth,
          boat_images(image_path, position),
          piers(name)
        `, { count: 'exact' })
        .eq('moderation_status', 'approved')
        .eq('is_hidden', false)
        .order('display_order', { ascending: true });

      const mapped: Boat[] = ((data ?? []) as any[]).map((b) => {
        const sorted = [...(b.boat_images ?? [])].sort((a: any, z: any) => a.position - z.position);
        const img    = sorted[0]?.image_path ?? null;
        return {
          id: b.id, name: b.name, type: b.type,
          capacity: b.capacity, length_meters: b.length_meters,
          price_per_hour: b.price_per_hour,
          public_price_per_hour_night: b.public_price_per_hour_night,
          public_price_per_hour_weekend: null,
          pier_id: b.pier_id, pier_name: b.piers?.name ?? null,
          seo_slug: b.seo_slug, promo_video_url: null,
          cover_image_url: img
            ? `${SUPABASE_URL}/storage/v1/object/public/boat_images/${img}` : null,
          rating: null, review_count: 0,
          has_tarp: b.has_tarp ?? false, has_heating: b.has_heating ?? false,
          has_toilet: b.has_toilet ?? false, has_covered_saloon: b.has_covered_saloon ?? false,
          has_bluetooth: b.has_bluetooth ?? false,
        };
      });
      setAll(mapped);
      setTotal(count ?? mapped.length);
    } finally { setLoading(false); setRef(false); }
  }, []);

  useEffect(() => { if (!fetched.current) { fetched.current = true; fetchBoats(); } }, []);

  // ── Client filter ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const chip = TYPE_CHIPS.find((c) => c.id === filters.typeId);
    const q    = searchText.trim().toLowerCase();
    return allBoats.filter((b) => {
      const t = (b.type ?? '').toLowerCase();
      if (chip?.boatType && !t.includes(chip.boatType)) return false;
      if (q && !b.name.toLowerCase().includes(q))        return false;
      if (filters.capacityMin !== null && (b.capacity ?? 0) < filters.capacityMin) return false;
      if (filters.priceMin    !== null && b.price_per_hour < filters.priceMin)      return false;
      if (filters.priceMax    !== null && b.price_per_hour > filters.priceMax)      return false;
      if (filters.hasTarp    && !b.has_tarp)    return false;
      if (filters.hasToilet  && !b.has_toilet)  return false;
      if (filters.hasHeating && !b.has_heating) return false;
      return true;
    });
  }, [allBoats, filters, searchText]);

  const badge     = countActive(filters);
  const hasActive = badge > 0 || searchText.trim() !== '';

  // ── Sheet ──────────────────────────────────────────────────────────────────
  const goToDateTime = () =>
    Animated.spring(slideAnim, { toValue: -SCREEN_W, useNativeDriver: true, tension: 68, friction: 12 }).start();
  const goToMain = () =>
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 68, friction: 12 }).start();

  const openSheet  = () => { setDraft(filters); slideAnim.setValue(0); filterRef.current?.present(); };
  const applyDraft = () => { setFilters(draft); filterRef.current?.dismiss(); };
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
          renderItem={({ item }: { item: Boat }) => <PromoCard boat={item} />}
          columnWrapperStyle={s.row}
          contentContainerStyle={[s.list, { paddingBottom: insets.bottom + 90 }]}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true },
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchBoats(true)} tintColor={COLORS.brandNavy} />
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
                  <Pressable style={s.resetBtn} onPress={() => { setFilters(DEFAULT); setSearch(''); }}>
                    <Text style={s.resetTxt}>Сбросить</Text>
                  </Pressable>
                </ScrollView>
              )}

              {/* Counter + toggle */}
              <View style={s.barRow}>
                <Text style={s.counter}>
                  {hasActive ? `${filtered.length} из ${ruFmt(total)} судов` : `${ruFmt(total)} судов найдено`}
                </Text>
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

      {/* ── Filter Bottom Sheet ───────────────────────────────────────────── */}
      <BottomSheetModal
        ref={filterRef}
        snapPoints={['75%', '95%']}
        enablePanDownToClose
        backdropComponent={SheetBackdrop}
        backgroundStyle={s.sheetBg}
        handleComponent={() => <View style={s.handleWrap}><View style={s.handle} /></View>}
        onDismiss={() => slideAnim.setValue(0)}
      >
        <BottomSheetScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={{ overflow: 'hidden', width: SCREEN_W }}>
            <Animated.View style={{ flexDirection: 'row', width: SCREEN_W * 2, transform: [{ translateX: slideAnim }] }}>

              {/* ── Panel 0: Main ─────────────────────────────────────────── */}
              <View style={[s.panel, { paddingBottom: insets.bottom + 16 }]}>
                <View style={s.sheetHeader}>
                  <Text style={s.sheetTitle}>Фильтры</Text>
                  <Pressable onPress={() => setDraft(DEFAULT)} hitSlop={8}>
                    <Text style={s.sheetResetTxt}>Сбросить</Text>
                  </Pressable>
                </View>

                <Text style={s.sheetSec}>Дата и время</Text>
                <Pressable style={s.dtRow} onPress={goToDateTime}>
                  <View style={s.dtLeft}>
                    <View style={s.dtIconWrap}>
                      <Calendar size={18} color={COLORS.brandNavy} strokeWidth={1.8} />
                    </View>
                    <View>
                      <Text style={s.dtMain}>{dtSummary(draft.dateTime)}</Text>
                      <Text style={s.dtSub}>Нажмите для выбора</Text>
                    </View>
                  </View>
                  <ChevronRight size={18} color={COLORS.text3} strokeWidth={2} />
                </Pressable>

                <Text style={s.sheetSec}>Мин. вместимость (гостей)</Text>
                <View style={s.optRow}>
                  {CAPACITY_OPTS.map((n) => {
                    const on = draft.capacityMin === (n ?? null);
                    return (
                      <Pressable key={String(n)} style={[s.optChip, on && s.optChipOn]}
                        onPress={() => setDraft((d) => ({ ...d, capacityMin: n ?? null }))}>
                        <Text style={[s.optTxt, on && s.optTxtOn]}>
                          {n === null ? 'Любая' : n === 11 ? '11+' : String(n)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={s.sheetSec}>Цена за час (₽)</Text>
                <View style={s.priceRow}>
                  <View style={s.priceInputWrap}>
                    <Text style={s.priceLabel}>от</Text>
                    <TextInput style={s.priceInput} placeholder="0" placeholderTextColor={COLORS.text3} keyboardType="numeric"
                      value={draft.priceMin !== null ? String(draft.priceMin) : ''}
                      onChangeText={(v) => setDraft((d) => ({ ...d, priceMin: v ? Number(v) : null }))} />
                  </View>
                  <View style={s.priceDash} />
                  <View style={s.priceInputWrap}>
                    <Text style={s.priceLabel}>до</Text>
                    <TextInput style={s.priceInput} placeholder="∞" placeholderTextColor={COLORS.text3} keyboardType="numeric"
                      value={draft.priceMax !== null ? String(draft.priceMax) : ''}
                      onChangeText={(v) => setDraft((d) => ({ ...d, priceMax: v ? Number(v) : null }))} />
                  </View>
                </View>
                <View style={[s.optRow, { marginBottom: 4 }]}>
                  {PRICE_PRESETS.map((p) => {
                    const on = matchesPreset(p.min, p.max);
                    return (
                      <Pressable key={p.label} style={[s.optChip, on && s.optChipOn]}
                        onPress={() => on ? setPricePreset(null, null) : setPricePreset(p.min, p.max)}>
                        <Text style={[s.optTxt, on && s.optTxtOn]}>{p.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={s.sheetSec}>Удобства</Text>
                {AMENITIES.map(({ key, label }) => (
                  <View key={key} style={s.switchRow}>
                    <Text style={s.switchLabel}>{label}</Text>
                    <Switch value={draft[key]}
                      onValueChange={(v) => setDraft((d) => ({ ...d, [key]: v }))}
                      trackColor={{ false: COLORS.border, true: COLORS.brandNavy + '70' }}
                      thumbColor={draft[key] ? COLORS.brandNavy : '#f0f0f0'} />
                  </View>
                ))}

                <View style={s.sheetFooter}>
                  <Pressable style={s.footerReset} onPress={() => { setDraft(DEFAULT); filterRef.current?.dismiss(); setFilters(DEFAULT); setSearch(''); }}>
                    <Text style={s.footerResetTxt}>Сбросить</Text>
                  </Pressable>
                  <Pressable style={({ pressed }) => [s.footerApply, pressed && { opacity: 0.88 }]} onPress={applyDraft}>
                    <Text style={s.footerApplyTxt}>Показать суда{filtered.length > 0 ? ` (${filtered.length})` : ''}</Text>
                  </Pressable>
                </View>
              </View>

              {/* ── Panel 1: Дата и время ─────────────────────────────────── */}
              <View style={[s.panel, { paddingBottom: insets.bottom + 16 }]}>
                <View style={s.dtPageHeader}>
                  <Pressable onPress={goToMain} style={s.dtBackBtn} hitSlop={10}>
                    <ChevronLeft size={20} color={COLORS.brandNavy} strokeWidth={2} />
                  </Pressable>
                  <Text style={s.sheetTitle}>Дата и время</Text>
                  <View style={{ width: 36 }} />
                </View>

                <CalendarPicker
                  selected={draft.dateTime.date}
                  onSelect={(d) => setDraft((prev) => ({ ...prev, dateTime: { ...prev.dateTime, date: d } }))}
                />

                <Text style={[s.sheetSec, { marginTop: 20 }]}>Время начала</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8, paddingBottom: 4 }} decelerationRate="fast">
                  {TIME_OPTS.map((h) => {
                    const on = draft.dateTime.startHour === h;
                    return (
                      <Pressable key={h} style={[s.optChip, on && s.optChipOn]}
                        onPress={() => setDraft((d) => ({ ...d, dateTime: { ...d.dateTime, startHour: h } }))}>
                        <Text style={[s.optTxt, on && s.optTxtOn]}>{fmtHour(h)}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                <Text style={[s.sheetSec, { marginTop: 20 }]}>Продолжительность</Text>
                <View style={s.optRow}>
                  {DURATION_OPTS.map((h) => {
                    const on = draft.dateTime.durationHours === h;
                    return (
                      <Pressable key={h} style={[s.optChip, on && s.optChipOn]}
                        onPress={() => setDraft((d) => ({ ...d, dateTime: { ...d.dateTime, durationHours: h } }))}>
                        <Text style={[s.optTxt, on && s.optTxtOn]}>{durLabel(h)}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={s.hint}>
                  <Text style={s.hintTxt}>💡 Выберите дату и время для проверки доступности</Text>
                </View>

                <Pressable style={({ pressed }) => [s.footerApply, { marginTop: 20 }, pressed && { opacity: 0.88 }]} onPress={goToMain}>
                  <Text style={s.footerApplyTxt}>Готово</Text>
                </Pressable>
              </View>

            </Animated.View>
          </View>
        </BottomSheetScrollView>
      </BottomSheetModal>
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

  // ── Sheet ────────────────────────────────────────────────────────────────
  sheetBg:    { backgroundColor: COLORS.white, borderRadius: 20 },
  handleWrap: { paddingTop: 12, paddingBottom: 2, alignItems: 'center' },
  handle:     { width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.border },
  panel:      { width: SCREEN_W, paddingHorizontal: 20, paddingTop: 6 },
  sheetHeader:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  sheetTitle:    { fontSize: 18, fontWeight: '800', color: COLORS.text1 },
  sheetResetTxt: { fontSize: 14, fontWeight: '600', color: COLORS.brandCyan },
  sheetSec: {
    fontSize: 11, fontWeight: '700', color: COLORS.text3,
    textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 10, marginTop: 18,
  },
  dtRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 14, borderRadius: 14,
    backgroundColor: COLORS.backgroundAlt, borderWidth: 1, borderColor: COLORS.border,
  },
  dtLeft:     { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  dtIconWrap: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.brandNavy + '12' },
  dtMain:     { fontSize: 14, fontWeight: '600', color: COLORS.text1 },
  dtSub:      { fontSize: 12, color: COLORS.text3, marginTop: 1 },
  dtPageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  dtBackBtn:    { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.muted, alignItems: 'center', justifyContent: 'center' },
  optRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optChip:   { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.backgroundAlt, borderWidth: 1, borderColor: COLORS.border },
  optChipOn: { backgroundColor: COLORS.brandNavy, borderColor: COLORS.brandNavy },
  optTxt:    { fontSize: 13, fontWeight: '500', color: COLORS.text2 },
  optTxtOn:  { color: COLORS.white, fontWeight: '600' },
  priceRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  priceInputWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: COLORS.backgroundAlt, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  priceLabel: { fontSize: 13, color: COLORS.text3, fontWeight: '500' },
  priceInput: { flex: 1, fontSize: 14, color: COLORS.text1, padding: 0 },
  priceDash:  { width: 12, height: 1.5, backgroundColor: COLORS.text3, borderRadius: 1 },
  switchRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border },
  switchLabel:{ fontSize: 15, color: COLORS.text1 },
  sheetFooter:  { flexDirection: 'row', gap: 12, marginTop: 24 },
  footerReset:  { flex: 1, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.backgroundAlt, borderWidth: 1, borderColor: COLORS.border },
  footerResetTxt: { fontSize: 15, fontWeight: '600', color: COLORS.text2 },
  footerApply:  { flex: 2, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.brandNavy },
  footerApplyTxt: { fontSize: 15, fontWeight: '700', color: COLORS.white },
  hint:    { marginTop: 20, padding: 14, borderRadius: 12, backgroundColor: '#FFF8E1', borderWidth: 1, borderColor: '#FFE082' },
  hintTxt: { fontSize: 13, color: '#795548', lineHeight: 18 },
});
