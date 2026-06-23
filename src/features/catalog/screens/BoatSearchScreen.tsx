import { useFocusEffect, useRouter } from 'expo-router';
import { ArrowLeft, Search, SearchX } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useHomeData } from '@/features/home/hooks/useHomeData';
import { COLORS } from '@/shared/colors';
import { Spinner } from '@/shared/components/Spinner';
import { Boat } from '@/store/useCatalogStore';

import { PromoCard } from '../../home/components/PromoCard';
import { useAvailabilityCache } from '../hooks/useAvailabilityCache';
import { useDiscountsCache } from '../hooks/useDiscountsCache';
import { DEFAULT } from '../types';

const TIMING = { duration: 280, easing: Easing.inOut(Easing.ease) };
const CANCEL_W = 74;

export function BoatSearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 180);
    return () => clearTimeout(t);
  }, [query]);

  const progress = useSharedValue(0);

  useFocusEffect(
    useCallback(() => {
      const t = setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
      return () => clearTimeout(t);
    }, []),
  );

  const { boats: allBoats, isLoadingBoats: loading } = useHomeData();
  const { availMap } = useAvailabilityCache(DEFAULT.dateTime);
  const discountsMap = useDiscountsCache();

  // ── Animated styles ──
  // Input shrinks by giving up right margin space for the cancel button
  const animInput = useAnimatedStyle(() => ({
    marginRight: interpolate(progress.value, [0, 1], [0, CANCEL_W + 8]),
  }));

  // Cancel slides in from right edge, no width changes, no clipping
  const animCancel = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [CANCEL_W, 0]) },
    ],
  }));

  const handleFocus = () => {
    progress.value = withTiming(1, TIMING);
  };

  const handleCancel = () => {
    progress.value = withTiming(0, TIMING);
    setQuery('');
    Keyboard.dismiss();
  };

  const handleBack = () => {
    Keyboard.dismiss();
    router.back();
  };

  // ── Filter boats ──
  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return allBoats;
    return allBoats.filter((b) => b.name.toLowerCase().includes(q));
  }, [allBoats, debouncedQuery]);

  const renderBoat = useCallback(
    ({ item }: { item: Boat }) => (
      <PromoCard
        boat={item}
        availInfo={availMap[item.id]}
        discount={discountsMap.get(item.id)}
        selectedDate={undefined}
      />
    ),
    [availMap, discountsMap],
  );

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Header row — cancel is absolute so it doesn't push layout */}
      <View style={s.headerRow}>
        <Pressable onPress={handleBack} hitSlop={10} style={s.backBtn}>
          <ArrowLeft size={22} color={COLORS.brandNavy} strokeWidth={2} />
        </Pressable>

        {/* Input shrinks via marginRight to make visual room for cancel */}
        <Animated.View style={[s.inputWrap, animInput]}>
          <Search size={16} color={COLORS.brandNavy} strokeWidth={2} />
          <TextInput
            ref={inputRef}
            style={s.input}
            placeholder="Поиск"
            placeholderTextColor={COLORS.text3}
            value={query}
            onChangeText={setQuery}
            onFocus={handleFocus}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </Animated.View>

        {/* Cancel — absolute right, slides in purely via translateX + opacity */}
        <Animated.View style={[s.cancelAbs, animCancel]}>
          <Pressable onPress={handleCancel} hitSlop={8}>
            <Text style={s.cancelTxt}>Отмена</Text>
          </Pressable>
        </Animated.View>
      </View>

      <View style={s.divider} />

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
          contentContainerStyle={[s.list, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          initialNumToRender={8}
          maxToRenderPerBatch={6}
          windowSize={5}
          updateCellsBatchingPeriod={100}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          ListEmptyComponent={
            debouncedQuery.length > 0 ? (
              <View style={s.empty}>
                <View style={s.emptyIconWrap}>
                  <SearchX size={32} color={COLORS.text3} strokeWidth={1.5} />
                </View>
                <Text style={s.emptyTitle}>Ничего не найдено</Text>
                <Text style={s.emptyHint}>Попробуйте изменить запрос</Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.white },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#F0F0F0",
    borderRadius: 22,
    height: 38,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text1,
    padding: 0,
  },

  cancelAbs: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    width: CANCEL_W,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelTxt: {
    fontSize: 15,
    fontWeight: '400',
    color: COLORS.brandNavy,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
  },

  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list:   { gap: 12, paddingHorizontal: 16, paddingTop: 12 },
  row:    { gap: 12 },
  empty: {
    alignItems: 'center',
    paddingTop: 64,
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: COLORS.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text1,
  },
  emptyHint: {
    fontSize: 13,
    color: COLORS.text3,
    textAlign: 'center',
  },
});
