import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useLocalSearchParams } from 'expo-router';
import { Search, X } from 'lucide-react-native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useHomeData } from '@/features/home/hooks/useHomeData';
import { COLORS } from '@/shared/colors';
import { clearSelectedDate, saveSelectedDate } from '@/shared/selectedDate';
import { ScreenHeader } from '@/shared/components/ScreenHeader';
import { Spinner } from '@/shared/components/Spinner';
import { Boat } from '@/store/useCatalogStore';

import { PromoCard } from '../../home/components/PromoCard';
import { BoatEmpty } from '../components/BoatEmpty';
import { BoatFilter } from '../components/BoatFilter';
import { BoatsListHeader, SortBy } from '../components/BoatsListHeader';
import { FilterMiniSheet, FilterSection } from '../components/FilterMiniSheet';
import { TYPE_CHIPS } from '../constants';
import { useAvailabilityCache } from '../hooks/useAvailabilityCache';
import { useDiscountsCache } from '../hooks/useDiscountsCache';
import { usePiersCache } from '../hooks/usePiersCache';
import { DEFAULT, Filters } from '../types';
import { countActive, findPiersInRadius, sortBoats, toLocalDateISO } from '../utils/filterUtils';

export function AllBoatsScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ type?: string }>();

  // Full filter sheet ref
  const filterRef = useRef<BottomSheetModal>(null);

  // Per-section mini sheet refs
  const typeSheetRef  = useRef<BottomSheetModal>(null);
  const priceSheetRef = useRef<BottomSheetModal>(null);
  const capSheetRef   = useRef<BottomSheetModal>(null);
  const amenSheetRef  = useRef<BottomSheetModal>(null);
  const durSheetRef   = useRef<BottomSheetModal>(null);

  // ── Initial filters from URL params ──
  const initialFilters = useMemo<Filters>(() => {
    const chip = TYPE_CHIPS.find((c) => c.id === params.type);
    if (!chip || chip.id === 'all') return DEFAULT;
    return { ...DEFAULT, typeId: chip.id };
  }, [params.type]);

  const [filters, setFilters] = useState<Filters>(initialFilters);

  // ── Data ──
  const { boats: allBoats, isLoadingBoats: loading, refetch } = useHomeData();
  const allPiers = usePiersCache();
  const { availMap, loading: availLoading } = useAvailabilityCache(filters.dateTime);
  const discountsMap = useDiscountsCache();

  // ── State ──
  const [refreshing, setRefreshing]   = useState(false);
  const [viewMode, setViewMode]       = useState<'list' | 'map'>('list');
  const [draft, setDraft]             = useState<Filters>(initialFilters);
  const [searchText, setSearch]       = useState('');
  const [searchOpen, setSearchOpen]   = useState(false);
  const [sortBy, setSortBy]           = useState<SortBy>('popular');

  const total    = allBoats.length;
  const hasActive = countActive(filters) > 0 || searchText.trim() !== '';

  // ── Refresh ──
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // ── Filter & sort ──
  const applyBoatFilter = useCallback((f: Filters, q: string) => {
    const chip = TYPE_CHIPS.find((c) => c.id === f.typeId);
    const hasAvailData = f.dateTime.date !== null && Object.keys(availMap).length > 0;

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
      if (f.hasTarp && !b.has_tarp) return false;
      if (f.hasToilet && !b.has_toilet) return false;
      if (f.hasHeating && !b.has_heating) return false;
      if (hasAvailData && availMap[b.id]?.status === 'not_available') return false;
      if (pierSet && (!b.pier_id || !pierSet.has(b.pier_id))) return false;
      return true;
    });

    const sorted = sortBoats(pass, {
      pierIds: f.pierIds,
      availMap,
      allPiers,
      radiusKm: f.pierRadiusKm,
      dateActive: f.dateTime.date !== null,
    });

    if (sortBy === 'price_asc') return [...sorted].sort((a, b) => a.price_per_hour - b.price_per_hour);
    if (sortBy === 'price_desc') return [...sorted].sort((a, b) => b.price_per_hour - a.price_per_hour);
    return sorted;
  }, [allBoats, availMap, allPiers, sortBy]);

  const filtered = useMemo(
    () => applyBoatFilter(filters, searchText.trim().toLowerCase()),
    [applyBoatFilter, filters, searchText]
  );

  // ── Full sheet handlers ──
  const openSheet = () => {
    setDraft(filters);
    filterRef.current?.present();
  };

  const handleApply = () => {
    setFilters(draft);
    filterRef.current?.dismiss();
  };

  const handleResetAll = () => {
    setFilters(DEFAULT);
    setSearch('');
    setDraft(DEFAULT);
    filterRef.current?.dismiss();
  };

  // ── Mini sheet handlers ──
  const openFilter = useCallback((section: FilterSection) => {
    setDraft(filters);
    switch (section) {
      case 'type':      typeSheetRef.current?.present();  break;
      case 'price':     priceSheetRef.current?.present(); break;
      case 'capacity':  capSheetRef.current?.present();   break;
      case 'amenities': amenSheetRef.current?.present();  break;
      case 'duration':  durSheetRef.current?.present();   break;
    }
  }, [filters]);

  const handleMiniApply = useCallback(() => {
    setFilters(draft);
  }, [draft]);

  const handleWeekDate = useCallback((date: Date | null) => {
    setFilters((f) => ({ ...f, dateTime: { ...f.dateTime, date } }));
    if (date) saveSelectedDate(date).catch(() => {});
    else clearSelectedDate().catch(() => {});
  }, []);

  const renderBoat = useCallback(
    ({ item }: { item: Boat }) => (
      <PromoCard
        boat={item}
        availInfo={availMap[item.id]}
        discount={discountsMap.get(item.id)}
        selectedDate={filters.dateTime.date ? toLocalDateISO(filters.dateTime.date) : undefined}
      />
    ),
    [availMap, discountsMap, filters.dateTime.date]
  );

  const listContentStyle = useMemo(
    () => [s.list, { paddingBottom: insets.bottom + 90 }],
    [insets.bottom]
  );

  // useMemo element (not useCallback component) — FlatList reconciles without remounting,
  // so DateStrip scroll position is preserved when filters change.
  const listHeader = useMemo(() => (
    <BoatsListHeader
      filters={filters}
      setFilters={setFilters}
      onDateSelect={handleWeekDate}
      onOpenFilter={openFilter}
      viewMode={viewMode}
      setView={setViewMode}
      filteredCount={filtered.length}
      total={total}
      availLoading={availLoading}
      sortBy={sortBy}
      onSortChange={setSortBy}
    />
  ), [filters, setFilters, handleWeekDate, openFilter, viewMode, filtered.length, total, availLoading, sortBy]);

  const handleResetFilters = useCallback(() => { setFilters(DEFAULT); setSearch(''); }, []);

  const ListEmpty = useCallback(() => (
    <BoatEmpty
      hasActive={hasActive}
      onReset={handleResetFilters}
    />
  ), [hasActive, handleResetFilters]);

  return (
    <View style={s.root}>
      <ScreenHeader
        title="Доступные суда"
        right={
          <Pressable
            style={s.searchBtn}
            onPress={() => { setSearchOpen((o) => !o); if (searchOpen) setSearch(''); }}
            hitSlop={8}
          >
            {searchOpen
              ? <X size={20} color={COLORS.brandNavy} strokeWidth={2} />
              : <Search size={20} color={COLORS.brandNavy} strokeWidth={2} />
            }
          </Pressable>
        }
      />

      {/* Inline search — fixed below header */}
      {searchOpen && (
        <View style={s.inlineSearch}>
          <Search size={15} color={COLORS.text3} strokeWidth={2} />
          <TextInput
            autoFocus
            style={s.inlineInput}
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
      )}

      {loading ? (
        <View style={s.loader}>
          <Spinner />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(b) => b.id}
          numColumns={2}
          renderItem={renderBoat}
          columnWrapperStyle={s.row}
          contentContainerStyle={listContentStyle}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          initialNumToRender={6}
          maxToRenderPerBatch={4}
          windowSize={5}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.brandNavy} />
          }
          ListHeaderComponent={listHeader as any}
          ListEmptyComponent={ListEmpty}
        />
      )}

      {/* Full filter sheet (kept for future use) */}
      <BoatFilter
        modalRef={filterRef}
        draft={draft}
        onDraftChange={setDraft}
        onApply={handleApply}
        onResetAll={handleResetAll}
        filteredCount={filtered.length}
      />

      {/* Per-section mini sheets */}
      <FilterMiniSheet
        modalRef={typeSheetRef}
        section="type"
        draft={draft}
        onDraftChange={setDraft}
        onApply={handleMiniApply}
        filteredCount={filtered.length}
      />
      <FilterMiniSheet
        modalRef={priceSheetRef}
        section="price"
        draft={draft}
        onDraftChange={setDraft}
        onApply={handleMiniApply}
        filteredCount={filtered.length}
      />
      <FilterMiniSheet
        modalRef={capSheetRef}
        section="capacity"
        draft={draft}
        onDraftChange={setDraft}
        onApply={handleMiniApply}
        filteredCount={filtered.length}
      />
      <FilterMiniSheet
        modalRef={amenSheetRef}
        section="amenities"
        draft={draft}
        onDraftChange={setDraft}
        onApply={handleMiniApply}
        filteredCount={filtered.length}
      />
      <FilterMiniSheet
        modalRef={durSheetRef}
        section="duration"
        draft={draft}
        onDraftChange={setDraft}
        onApply={handleMiniApply}
        filteredCount={filtered.length}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.white },

  searchBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },

  inlineSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inlineInput: { flex: 1, fontSize: 14, color: COLORS.text1, padding: 0 },

  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list:   { gap: 12, paddingHorizontal: 16 },
  row:    { gap: 12 },
});
