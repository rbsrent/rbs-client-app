import { LinearGradient } from 'expo-linear-gradient';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  View,
} from 'react-native';

import { COLORS } from '@/shared/colors';
import { HeroSlide } from '@/store/useCatalogStore';

import { BannerCard } from './BannerCard';

const { width: SW } = Dimensions.get('window');
const CARD_W     = SW - 32;
const CARD_H     = 172;
const AUTO_DELAY = 4200;
const ANIM_SETTLE = 420;

// ─── Shimmer skeleton ─────────────────────────────────────────────────────────

function BannerSkeleton() {
  const translateX = useRef(new Animated.Value(-CARD_W)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(translateX, {
        toValue: CARD_W,
        duration: 1100,
        useNativeDriver: true,
      }),
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <View style={sk.root}>
      <View style={sk.page}>
        <View style={[sk.card, { width: CARD_W, height: CARD_H }]}>
          <Animated.View
            style={[StyleSheet.absoluteFill, { transform: [{ translateX }] }]}
          >
            <LinearGradient
              colors={['transparent', 'rgba(255,255,255,0.38)', 'transparent']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>
      </View>
      <View style={sk.dots}>
        {[0, 1, 2].map((i) => <View key={i} style={sk.dot} />)}
      </View>
    </View>
  );
}

const sk = StyleSheet.create({
  root: {},
  page: { paddingHorizontal: 16 },
  card: {
    borderRadius: 18,
    backgroundColor: '#E8E8E8',
    overflow: 'hidden',
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#DDD' },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dotForIdx(rawIdx: number, n: number) {
  return ((rawIdx - 1) % n + n) % n;
}

// ─── PromoBanner ─────────────────────────────────────────────────────────────

interface Props { slides: HeroSlide[]; loading?: boolean }

export const PromoBanner = memo(function PromoBanner({ slides, loading }: Props) {
  if (loading || !slides.length) return <BannerSkeleton />;

  return <PromoBannerInner slides={slides} />;
});

// Separate inner component so hooks only run once real slides arrive
function PromoBannerInner({ slides }: { slides: HeroSlide[] }) {
  const N = slides.length;

  const bookend = useMemo(
    () => [slides[N - 1], ...slides, slides[0]],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [N],
  );

  const flatRef     = useRef<FlatList>(null);
  const curIdxRef   = useRef(1);
  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const teleportRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef  = useRef(true);
  const [dotIdx, setDotIdx] = useState(0);

  useEffect(() => () => {
    mountedRef.current = false;
    if (timerRef.current)    clearTimeout(timerRef.current);
    if (teleportRef.current) clearTimeout(teleportRef.current);
  }, []);

  const onLayout = useCallback(() => {
    flatRef.current?.scrollToOffset({ offset: SW, animated: false });
  }, []);

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

  const onScrollBeginDrag = useCallback(() => {
    if (timerRef.current)    clearTimeout(timerRef.current);
    if (teleportRef.current) clearTimeout(teleportRef.current);
  }, []);

  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!mountedRef.current) return;
      const rawIdx = Math.round(e.nativeEvent.contentOffset.x / SW);
      curIdxRef.current = rawIdx;
      setDotIdx(dotForIdx(rawIdx, N));
      if (rawIdx === 0) {
        flatRef.current?.scrollToOffset({ offset: N * SW, animated: false });
        curIdxRef.current = N;
      } else if (rawIdx === N + 1) {
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
        <BannerCard slide={item} width={CARD_W} height={CARD_H} />
      </View>
    ),
    [],
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
        {slides.map((_, i) => (
          <View key={i} style={[s.dot, i === dotIdx && s.dotActive]} />
        ))}
      </View>
    </View>
  );
}

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
  dot:       { width: 6,  height: 6, borderRadius: 3, backgroundColor: '#CCCCCC' },
  dotActive: { width: 20, height: 6, borderRadius: 3, backgroundColor: COLORS.brandNavy },
});
