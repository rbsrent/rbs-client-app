import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
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

import { COLORS } from '@/shared/colors';

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
  const flatRef      = useRef<FlatList>(null);
  const curIdxRef    = useRef(N);           // current absolute index in TRIPLED
  const timerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef   = useRef(true);
  const [dotIdx, setDotIdx] = useState(0); // display index 0..N-1

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Scroll to middle copy on first layout (avoids flash of wrong position)
  const onLayout = useCallback(() => {
    flatRef.current?.scrollToOffset({ offset: N * SW, animated: false });
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
        if (mountedRef.current) setDotIdx(next % N);
        scheduleRef.current();
      }, TELEPORT_MS);
      return;
    }

    const next = idx + 1;
    flatRef.current?.scrollToOffset({ offset: next * SW, animated: true });
    curIdxRef.current = next;
    setDotIdx(next % N);
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

  // On settle: update dot, handle boundaries, restart timer
  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!mountedRef.current) return;
      const rawIdx = Math.round(e.nativeEvent.contentOffset.x / SW);
      curIdxRef.current = rawIdx;

      const display = ((rawIdx % N) + N) % N;
      setDotIdx(display);

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
      <FlatList
        ref={flatRef}
        data={TRIPLED}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        getItemLayout={getItemLayout}
        // Performance
        removeClippedSubviews
        maxToRenderPerBatch={3}
        windowSize={3}
        initialNumToRender={3}
        // Scroll behaviour
        bounces={false}
        overScrollMode="never"
        scrollEventThrottle={32}
        decelerationRate="fast"
        // Event handlers
        onLayout={onLayout}
        onScrollBeginDrag={onScrollBeginDrag}
        onMomentumScrollEnd={onMomentumScrollEnd}
      />

      {/* ── Dot indicators ── */}
      <View style={c.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[c.dot, i === dotIdx && c.dotActive]} />
        ))}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CCCCCC',
  },
  dotActive: {
    width: 20,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.brandNavy,
  },
});
