import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MapPin, Search, SlidersHorizontal, Users } from 'lucide-react-native';
import { memo, useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useHomeData } from '@/features/home/hooks/useHomeData';
import { COLORS } from '@/shared/colors';
import { Boat } from '@/store/useCatalogStore';

function BoatGridCard({ boat, router }: { boat: Boat; router: any }) {
  return (
    <Pressable
      style={styles.gridCard}
      onPress={() => router.push(`/catalog/${boat.id}`)}
    >
      <View style={styles.gridImageWrap}>
        {boat.cover_image_url ? (
          <Image source={{ uri: boat.cover_image_url }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
        ) : (
          <LinearGradient colors={[COLORS.brandNavy, COLORS.brandCyan]} style={StyleSheet.absoluteFill} />
        )}
        <View style={styles.gridTypeBadge}>
          <Text style={styles.gridTypeText}>{boat.type}</Text>
        </View>
      </View>
      <View style={styles.gridInfo}>
        <Text style={styles.gridName} numberOfLines={1}>{boat.name}</Text>
        {boat.pier_name ? (
          <View style={styles.gridMeta}>
            <MapPin size={10} color={COLORS.text3} strokeWidth={2} />
            <Text style={styles.gridMetaText} numberOfLines={1}>{boat.pier_name}</Text>
          </View>
        ) : null}
        <View style={styles.gridMeta}>
          <Users size={10} color={COLORS.text3} strokeWidth={2} />
          <Text style={styles.gridMetaText}>{boat.capacity} чел.</Text>
        </View>
        <Text style={styles.gridPrice}>
          {new Intl.NumberFormat('ru-RU').format(boat.price_per_hour)} ₽/ч
        </Text>
      </View>
    </Pressable>
  );
}

const VESSEL_TYPES = ['Все', 'Катер', 'Яхта', 'Моторная яхта'];

export const CatalogScreen = memo(function CatalogScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ type?: string }>();
  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState(params.type ?? 'Все');
  const router = useRouter();
  const { boats, isLoadingBoats, refetch } = useHomeData();

  const filtered = useMemo(() => {
    let list = boats;
    if (activeType !== 'Все') {
      list = list.filter((b) => b.type === activeType);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.type.toLowerCase().includes(q) ||
          (b.pier_name ?? '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [boats, activeType, search]);

  const renderItem = useCallback(({ item }: { item: Boat }) => (
    <BoatGridCard boat={item} router={router} />
  ), [router]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Каталог</Text>
        <View style={styles.searchRow}>
          <View style={styles.searchWrap}>
            <Search size={16} color={COLORS.text3} strokeWidth={2} />
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Поиск судна..."
              placeholderTextColor={COLORS.text3}
              returnKeyType="search"
            />
          </View>
          <Pressable style={styles.filterBtn}>
            <SlidersHorizontal size={18} color={COLORS.brandNavy} strokeWidth={2} />
          </Pressable>
        </View>
        <FlatList
          horizontal
          data={VESSEL_TYPES}
          keyExtractor={(t) => t}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.chip, activeType === item && styles.chipActive]}
              onPress={() => setActiveType(item)}
            >
              <Text style={[styles.chipText, activeType === item && styles.chipTextActive]}>
                {item}
              </Text>
            </Pressable>
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
          ItemSeparatorComponent={() => <View style={{ width: 8 }} />}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(b) => b.id}
        renderItem={renderItem}
        numColumns={2}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoadingBoats} onRefresh={refetch} tintColor={COLORS.brandCyan} />
        }
        ListEmptyComponent={
          !isLoadingBoats ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Суда не найдены</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundAlt,
  },
  header: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text1,
    paddingTop: 8,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.backgroundAlt,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text1,
  },
  filterBtn: {
    width: 44,
    height: 44,
    backgroundColor: COLORS.backgroundAlt,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chips: {
    paddingVertical: 2,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: COLORS.muted,
  },
  chipActive: {
    backgroundColor: COLORS.brandNavy,
  },
  chipText: {
    fontSize: 13,
    color: COLORS.text2,
    fontWeight: '500',
  },
  chipTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  list: {
    padding: 16,
  },
  row: {
    gap: 12,
    marginBottom: 12,
  },
  empty: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.text3,
  },
  gridCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  gridImageWrap: {
    height: 110,
    overflow: 'hidden',
  },
  gridTypeBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(11,17,32,0.6)',
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  gridTypeText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '600',
  },
  gridInfo: {
    padding: 10,
    gap: 3,
  },
  gridName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text1,
  },
  gridMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  gridMetaText: {
    fontSize: 10,
    color: COLORS.text3,
    flex: 1,
  },
  gridPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.brandNavy,
    marginTop: 2,
  },
});
