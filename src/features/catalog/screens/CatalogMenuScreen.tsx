import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Search } from 'lucide-react-native';
import { memo, useCallback, useRef } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '@/shared/colors';

interface Category {
  id: string;
  title: string;
  route: string;
  imageUrl?: string;
  isAll?: boolean;
}

const CATEGORIES: Category[] = [
  {
    id: 'all',
    title: 'Все суда',
    route: '/boats',
    isAll: true,
  },
  {
    id: 'katera',
    title: 'Катера',
    route: '/boats?type=boat',
  },
  {
    id: 'yakhty',
    title: 'Яхты',
    route: '/boats?type=yacht',
  },
  {
    id: 'venetian',
    title: 'Венецианские\nкатера',
    route: '/boats?type=venetian',
  },
  {
    id: 'teplohody',
    title: 'Теплоходы',
    route: '/boats?type=ship',
  },
  {
    id: 'progulki',
    title: 'Прогулки по рекам\nи каналам',
    route: '/(tabs)/routes',
  },
  {
    id: 'arenda',
    title: 'Аренда катеров\nи яхт в СПб',
    route: '/boats',
  },
];

const TOPBAR_H = 56;
const THUMB = 76;

export const CatalogMenuScreen = memo(function CatalogMenuScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;

  const topBarBg = scrollY.interpolate({
    inputRange: [0, 40, 90],
    outputRange: [
      'rgba(247,247,247,0)',
      'rgba(247,247,247,0.9)',
      'rgba(247,247,247,1)',
    ],
    extrapolate: 'clamp',
  });

  const onScroll = useCallback(
    Animated.event(
      [{ nativeEvent: { contentOffset: { y: scrollY } } }],
      { useNativeDriver: false },
    ),
    [],
  );

  const topPad = insets.top + TOPBAR_H;

  return (
    <View style={s.root}>
      <Animated.ScrollView
        contentContainerStyle={[s.list, { paddingTop: topPad + 16, paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={onScroll}
      >
        {CATEGORIES.map((item) => {
          if (item.isAll) {
            return (
              <Pressable
                key={item.id}
                style={({ pressed }) => [s.card, s.allCard, pressed && s.pressed]}
                onPress={() => router.push(item.route as any)}
              >
                <Text style={s.allTitle}>{item.title}</Text>
              </Pressable>
            );
          }
          return (
            <Pressable
              key={item.id}
              style={({ pressed }) => [s.card, pressed && s.pressed]}
              onPress={() => router.push(item.route as any)}
            >
              <Text style={s.cardTitle}>{item.title}</Text>
              <View style={s.thumb}>
                {item.imageUrl ? (
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                  />
                ) : (
                  <View style={[StyleSheet.absoluteFill, s.thumbPlaceholder]} />
                )}
              </View>
            </Pressable>
          );
        })}
      </Animated.ScrollView>

      <Animated.View
        style={[s.topBar, { paddingTop: insets.top + 8, backgroundColor: topBarBg }]}
      >
        <Pressable
          style={s.searchBar}
          onPress={() => router.push('/boats' as any)}
        >
          <Search size={16} color="#8E8E8E" strokeWidth={2} />
          <Text style={s.searchText}>Поиск</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
});

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  searchText: {
    fontSize: 14,
    color: '#8E8E8E',
  },

  list: {
    paddingHorizontal: 16,
    gap: 10,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingLeft: 20,
    paddingRight: 14,
    paddingVertical: 14,
    minHeight: THUMB + 28,
  },
  allCard: {
    minHeight: 0,
    paddingVertical: 20,
  },
  pressed: {
    opacity: 0.82,
  },

  allTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.brandCyan,
  },

  cardTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: '500',
    color: '#000000',
    lineHeight: 28,
    letterSpacing: -0.1,
    paddingRight: 12,
  },

  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#D8D8D8',
  },
  thumbPlaceholder: {
    backgroundColor: '#D8D8D8',
  },
});
