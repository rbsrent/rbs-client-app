import { LinearGradient } from 'expo-linear-gradient';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { COLORS } from '@/shared/colors';
import { HeroSlide } from '@/store/useCatalogStore';

import { BannerCard } from './BannerCard';

// ─── Dimensions ───────────────────────────────────────────────────────────────

const { width: SW } = Dimensions.get('window');
const CARD_W      = SW - 32;
const CARD_H      = 172;
const AUTO_DELAY  = 4200;
// How long the forward/backward slide animation takes (platform default ~350ms).
// We wait this long before the silent bookend teleport so it's fully settled.
const ANIM_SETTLE = 420;

// ─── Placeholder slides ───────────────────────────────────────────────────────

const PLACEHOLDERS: HeroSlide[] = [
  { id: 'p1', title: 'Катера на Неве',       description: 'Почасовая аренда · Санкт-Петербург', image_url: null, cta_primary_label: null, cta_primary_url: '/boats?type=boat',  cta_secondary_url: null, position: 0 } as any,
  { id: 'p2', title: 'Ночные мосты',          description: 'Незабываемые прогулки в белые ночи', image_url: null, cta_primary_label: null, cta_primary_url: '/boats',             cta_secondary_url: null, position: 1 } as any,
  { id: 'p3', title: 'Яхты и теплоходы',      description: 'Для особых случаев и корпоративов',  image_url: null, cta_primary_label: null, cta_primary_url: '/boats?type=yacht', cta_secondary_url: null, position: 2 } as any,
  { id: 'p4', title: 'По каналам Петербурга', description: 'Авторские маршруты с гидами',         image_url: null, cta_primary_label: null, cta_primary_url: '/routes',            cta_secondary_url: null, position: 3 } as any,
];

const PLACEHOLDER_GRADS: Record<string, readonly [string, string]> = {
  p1: ['#1B3B5A', '#0D5272'],
  p2: ['#0D1B2A', '#1A3A5C'],
  p3: ['#2C1654', '#4B2CA0'],
  p4: ['#0A3320', '#155A38'],
};

// ─── Placeholder card ─────────────────────────────────────────────────────────

function PlaceholderCard({ slide }: { slide: HeroSlide }) {
  const grad = PLACEHOLDER_GRADS[slide.id] ?? ['#1B2A41', '#0D4F6B'];
  return (
    <View style={[pc.card, { width: CARD_W, height: CARD_H }]}>
      <LinearGradient colors={grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, pc.dim]} />
      <View style={pc.circle1} />
      <View style={pc.circle2} />
      <View style={pc.body}>
        {slide.title       ? <Text style={pc.title}>{slide.title}</Text>       : null}
        {slide.description ? <Text style={pc.sub} numberOfLines={1}>{slide.description}</Text> : null}
      </View>
    </View>
  );
}

const pc = StyleSheet.create({
  card:    { borderRadius: 18, overflow: 'hidden', justifyContent: 'flex-end' },
  dim:     { backgroundColor: 'rgba(0,0,0,0.38)' },
  circle1: {
    position: 'absolute',
    width: CARD_W * 0.65, height: CARD_W * 0.65, borderRadius: CARD_W * 0.325,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -(CARD_W * 0.28), right: -(CARD_W * 0.15),
  },
  circle2: {
    position: 'absolute',
    width: CARD_W * 0.38, height: CARD_W * 0.38, borderRadius: CARD_W * 0.19,
    backgroundColor: 'rgba(255,255,255,0.09)',
    top: -(CARD_W * 0.04), right: CARD_W * 0.06,
  },
  body:  { padding: 18, gap: 4 },
  title: { color: COLORS.white, fontSize: 22, fontWeight: '800', lineHeight: 27 },
  sub:   { color: 'rgba(255,255,255,0.65)', fontSize: 13, lineHeight: 18 },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Bookend layout:  [slides[N-1], slide0, slide1, ..., slideN-1, slides[0]]
// indices:              0           1      2    ...     N          N+1
//
// Real slides live at indices 1..N.
// Index 0   = clone of last  → user swipes back  from first → sees last  → teleport to N
// Index N+1 = clone of first → user swipes ahead from last  → sees first → teleport to 1
//
// This means the "loop jump" is always between identical frames → invisible.

function dotForIdx(rawIdx: number, n: number) {
  // index 0 → dot n-1,  index 1 → dot 0, ..., index N+1 → dot 0
  return ((rawIdx - 1) % n + n) % n;
}

// ─── PromoBanner ─────────────────────────────────────────────────────────────

interface Props { slides: HeroSlide[] }

export const PromoBanner = memo(function PromoBanner({ slides }: Props) {
  const data         = slides.length ? slides : PLACEHOLDERS;
  const isPlaceholder = !slides.length;
  const N            = data.length;

  // Bookend: clone first/last so loop transition is always between identical frames
  const bookend = useMemo(
    () => [data[N - 1], ...data, data[0]],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [N],
  );

  const flatRef     = useRef<FlatList>(null);
  const curIdxRef   = useRef(1);          // start at first real slide (index 1)
  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const teleportRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef  = useRef(true);
  const [dotIdx, setDotIdx] = useState(0);

  useEffect(() => () => {
    mountedRef.current = false;
    if (timerRef.current)    clearTimeout(timerRef.current);
    if (teleportRef.current) clearTimeout(teleportRef.current);
  }, []);

  // Position at first real slide without animation on mount
  const onLayout = useCallback(() => {
    flatRef.current?.scrollToOffset({ offset: SW, animated: false });
  }, []);

  // ── schedule / advance (refs to avoid circular deps) ──────────────────────

  const scheduleRef = useRef<() => void>(() => {});
  const advanceRef  = useRef<() => void>(() => {});

  scheduleRef.current = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => advanceRef.current(), AUTO_DELAY);
  };

  advanceRef.current = () => {
    if (!mountedRef.current) return;
    if (teleportRef.current) clearTimeout(teleportRef.current);

    const next = curIdxRef.current + 1;
    flatRef.current?.scrollToOffset({ offset: next * SW, animated: true });
    curIdxRef.current = next;
    setDotIdx(dotForIdx(next, N));

    // If we just scrolled to the last bookend (clone of first slide),
    // silently teleport to the real first slide after the animation settles.
    // Both positions show identical content → no visual flash.
    if (next === N + 1) {
      teleportRef.current = setTimeout(() => {
        if (!mountedRef.current) return;
        flatRef.current?.scrollToOffset({ offset: SW, animated: false });
        curIdxRef.current = 1;
      }, ANIM_SETTLE);
    }

    scheduleRef.current();
  };

  useEffect(() => { scheduleRef.current(); }, []);

  // Pause while user drags
  const onScrollBeginDrag = useCallback(() => {
    if (timerRef.current)    clearTimeout(timerRef.current);
    if (teleportRef.current) clearTimeout(teleportRef.current);
  }, []);

  // After manual swipe settles: update dot, teleport at bookend if needed
  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!mountedRef.current) return;
      const rawIdx = Math.round(e.nativeEvent.contentOffset.x / SW);
      curIdxRef.current = rawIdx;
      setDotIdx(dotForIdx(rawIdx, N));

      // Teleport from bookend clone back to the real equivalent slide
      if (rawIdx === 0) {
        // Swiped back past first → jumped to clone of last → teleport to real last
        flatRef.current?.scrollToOffset({ offset: N * SW, animated: false });
        curIdxRef.current = N;
      } else if (rawIdx === N + 1) {
        // Swiped forward past last → jumped to clone of first → teleport to real first
        flatRef.current?.scrollToOffset({ offset: SW, animated: false });
        curIdxRef.current = 1;
      }

      scheduleRef.current();
    },
    [N],
  );

  const getItemLayout = useCallback(
    (_: any, index: number) => ({ length: SW, offset: index * SW, index }),
    [],
  );

  const renderItem = useCallback(
    ({ item }: { item: HeroSlide }) => (
      <View style={s.page}>
        {isPlaceholder
          ? <PlaceholderCard slide={item} />
          : <BannerCard slide={item} width={CARD_W} height={CARD_H} />}
      </View>
    ),
    [isPlaceholder],
  );

  const keyExtractor = useCallback((_: HeroSlide, i: number) => String(i), []);

  return (
    <View style={s.root}>
      <FlatList
        ref={flatRef}
        data={bookend}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        getItemLayout={getItemLayout}
        // Keep all N+2 items rendered — critical so bookend frames are
        // always ready and never blank when the teleport fires.
        removeClippedSubviews={false}
        initialNumToRender={N + 2}
        maxToRenderPerBatch={N + 2}
        windowSize={N + 2}
        bounces={false}
        overScrollMode="never"
        scrollEventThrottle={32}
        onLayout={onLayout}
        onScrollBeginDrag={onScrollBeginDrag}
        onMomentumScrollEnd={onMomentumScrollEnd}
      />

      <View style={s.dots}>
        {data.map((_, i) => (
          <View key={i} style={[s.dot, i === dotIdx && s.dotActive]} />
        ))}
      </View>
    </View>
  );
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: {},
  page: { width: SW, paddingHorizontal: 16 },

  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  dot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: '#CCCCCC',
  },
  dotActive: {
    width: 20, height: 6, borderRadius: 3,
    backgroundColor: COLORS.brandNavy,
  },
});
