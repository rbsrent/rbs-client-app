import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { memo, useCallback, useEffect, useRef } from 'react';
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  createAnimatedComponent,
  useDerivedValue,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';

import { COLORS } from '@/shared/colors';
import { ReanimatedScrollDots } from '@/shared/components/ReanimatedScrollDots';

const AnimatedFlatList = createAnimatedComponent(FlatList) as unknown as typeof FlatList;

// ─── Constants ────────────────────────────────────────────────────────────────

const { width: SW } = Dimensions.get('window');
const CARD_H      = 172;
const AUTO_DELAY  = 4200;
const TELEPORT_MS = 60; // ms to let silent scroll settle before animated scroll

// ─── Slide data ───────────────────────────────────────────────────────────────

interface Slide {
  id: string;
  tag: string;
  title: string;
  sub: string;
  grad: readonly [string, string];
  route: string;
}

const SLIDES: Slide[] = [
  {
    id: '1',
    tag: 'Аренда',
    title: 'Катера на Неве',
    sub: 'Почасовая аренда · Санкт-Петербург',
    grad: ['#1B3B5A', '#0D5272'],
    route: '/boats?type=boat',
  },
  {
    id: '2',
    tag: 'Белые ночи',
    title: 'Ночные мосты',
    sub: 'Незабываемые прогулки в белые ночи',
    grad: ['#0D1B2A', '#1A3A5C'],
    route: '/boats',
  },
  {
    id: '3',
    tag: 'Премиум',
    title: 'Яхты и теплоходы',
    sub: 'Для особых случаев и корпоративов',
    grad: ['#2C1654', '#4B2CA0'],
    route: '/boats?type=yacht',
  },
  {
    id: '4',
    tag: 'Маршруты',
    title: 'По каналам Петербурга',
    sub: 'Авторские маршруты с опытными гидами',
    grad: ['#0A3320', '#155A38'],
    route: '/routes',
  },
];

const N = SLIDES.length;

// Triple the data so we have a left/middle/right copy for seamless loop.
// The FlatList starts in the middle copy (index N).
const TRIPLED = [...SLIDES, ...SLIDES, ...SLIDES];

// ─── SlideCard ────────────────────────────────────────────────────────────────

const SlideCard = memo(function SlideCard({ slide }: { slide: Slide }) {
  const router = useRouter();
  return (
    <Pressable
      style={c.page}
      onPress={() => router.push(slide.route as any)}
      android_ripple={null}
    >
      <View style={c.card}>
        <LinearGradient
          colors={slide.grad}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Decorative circles for depth */}
        <View style={c.circle1} />
        <View style={c.circle2} />

        <View style={c.cardBody}>
          <View style={c.tag}>
            <Text style={c.tagTxt}>{slide.tag}</Text>
          </View>
          <Text style={c.title}>{slide.title}</Text>
          <Text style={c.sub} numberOfLines={1}>{slide.sub}</Text>
        </View>
      </View>
    </Pressable>
  );
});

// ─── HomeCarousel ─────────────────────────────────────────────────────────────

export const HomeCarousel = memo(function HomeCarousel() {
  const flatRef    = useRef<FlatList<Slide>>(null);
  const curIdxRef  = useRef(N);
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const scrollXSv  = useSharedValue(N * SW);
  const onScrollAnim = useAnimatedScrollHandler({
    onScroll: (e) => { scrollXSv.value = e.contentOffset.x; },
  });
  // Map tripled-space offset → [0, N*SW) for dot interpolation
  const normalizedX = useDerivedValue(() => {
    const raw = scrollXSv.value - N * SW;
    return ((raw % (N * SW)) + N * SW) % (N * SW);
  });

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // scheduleNext and advance reference each other, so use refs to avoid circular deps
  const scheduleRef = useRef<() => void>(() => {});
  const advanceRef  = useRef<() => void>(() => {});

  scheduleRef.current = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => advanceRef.current(), AUTO_DELAY);
  };

  advanceRef.current = () => {
    if (!mountedRef.current) return;
    let idx = curIdxRef.current;

    // If we drifted into the last copy, silently teleport to middle-copy equivalent
    // then animate to next item on next tick so there's no scroll conflict
    if (idx >= N * 2) {
      const midEquiv = idx - N;
      flatRef.current?.scrollToOffset({ offset: midEquiv * SW, animated: false });
      curIdxRef.current = midEquiv;

      setTimeout(() => {
        if (!mountedRef.current) return;
        const next = curIdxRef.current + 1;
        flatRef.current?.scrollToOffset({ offset: next * SW, animated: true });
        curIdxRef.current = next;
        scheduleRef.current();
      }, TELEPORT_MS);
      return;
    }

    const next = idx + 1;
    flatRef.current?.scrollToOffset({ offset: next * SW, animated: true });
    curIdxRef.current = next;
    scheduleRef.current();
  };

  // Start auto-scroll once
  useEffect(() => {
    scheduleRef.current();
  }, []);

  // Pause timer while user is dragging
  const onScrollBeginDrag = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  // On settle: handle boundaries, restart timer
  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!mountedRef.current) return;
      const rawIdx = Math.round(e.nativeEvent.contentOffset.x / SW);
      curIdxRef.current = rawIdx;

      // Teleport silently to middle copy if at a boundary copy
      if (rawIdx < N) {
        const target = rawIdx + N;
        flatRef.current?.scrollToOffset({ offset: target * SW, animated: false });
        curIdxRef.current = target;
      } else if (rawIdx >= N * 2) {
        const target = rawIdx - N;
        flatRef.current?.scrollToOffset({ offset: target * SW, animated: false });
        curIdxRef.current = target;
      }

      scheduleRef.current();
    },
    [],
  );

  const getItemLayout = useCallback(
    (_: any, index: number) => ({ length: SW, offset: index * SW, index }),
    [],
  );

  const renderItem = useCallback(
    ({ item }: { item: Slide }) => <SlideCard slide={item} />,
    [],
  );

  const keyExtractor = useCallback((_: Slide, i: number) => String(i), []);

  return (
    <View style={c.root}>
      <AnimatedFlatList
        ref={flatRef}
        data={TRIPLED}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        getItemLayout={getItemLayout}
        initialScrollIndex={N}
        removeClippedSubviews={false}
        maxToRenderPerBatch={12}
        windowSize={21}
        initialNumToRender={12}
        bounces={false}
        overScrollMode="never"
        scrollEventThrottle={16}
        decelerationRate="fast"
        onScroll={onScrollAnim}
        onScrollBeginDrag={onScrollBeginDrag}
        onMomentumScrollEnd={onMomentumScrollEnd}
      />

      <View style={c.dots}>
        <ReanimatedScrollDots count={N} scrollX={normalizedX} itemInterval={SW} />
      </View>
    </View>
  );
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const CARD_R = 18; // border radius

const c = StyleSheet.create({
  root: { marginTop: 20 },

  // Each FlatList page = full screen width (pagingEnabled)
  page: { width: SW, paddingHorizontal: 16 },

  card: {
    height: CARD_H,
    borderRadius: CARD_R,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },

  cardBody: {
    padding: 18,
    gap: 3,
  },

  // Decorative translucent circles
  circle1: {
    position: 'absolute',
    width: SW * 0.65,
    height: SW * 0.65,
    borderRadius: SW * 0.325,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -(SW * 0.28),
    right: -(SW * 0.15),
  },
  circle2: {
    position: 'absolute',
    width: SW * 0.38,
    height: SW * 0.38,
    borderRadius: SW * 0.19,
    backgroundColor: 'rgba(255,255,255,0.09)',
    top: -(SW * 0.04),
    right: SW * 0.06,
  },

  tag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 6,
  },
  tagTxt: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },

  title: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 27,
  },
  sub: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },

  dots: {
    alignItems: 'center',
    marginTop: 10,
  },
});
