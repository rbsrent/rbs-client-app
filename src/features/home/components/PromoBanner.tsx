import { LinearGradient } from 'expo-linear-gradient';
import { memo, useCallback, useEffect, useRef } from 'react';
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Animated as RNAnimated,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';

import { ReanimatedScrollDots } from '@/shared/components/ReanimatedScrollDots';
import { HeroSlide } from '@/store/useCatalogStore';

import { BannerCard } from './BannerCard';

const { width: SW } = Dimensions.get('window');
const CARD_W     = SW - 32;
const CARD_H     = 172;
const AUTO_DELAY = 4200;

function BannerSkeleton() {
  const translateX = useRef(new RNAnimated.Value(-CARD_W)).current;

  useEffect(() => {
    const anim = RNAnimated.loop(
      RNAnimated.timing(translateX, {
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
          <RNAnimated.View
            style={[StyleSheet.absoluteFill, { transform: [{ translateX }] }]}
          >
            <LinearGradient
              colors={['transparent', 'rgba(255,255,255,0.38)', 'transparent']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
          </RNAnimated.View>
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
  card: { borderRadius: 18, backgroundColor: '#E8E8E8', overflow: 'hidden' },
  dots: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10 },
  dot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: '#DDD' },
});

interface Props { slides: HeroSlide[]; loading?: boolean }

export const PromoBanner = memo(function PromoBanner({ slides, loading }: Props) {
  if (loading || !slides.length) return <BannerSkeleton />;
  return <PromoBannerInner slides={slides} />;
});

function PromoBannerInner({ slides }: { slides: HeroSlide[] }) {
  const N          = slides.length;
  const flatRef    = useRef<FlatList<HeroSlide>>(null);
  const curIdxRef  = useRef(0);
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const scrollXSv    = useSharedValue(0);
  const onScrollAnim = useAnimatedScrollHandler({
    onScroll: (e) => { scrollXSv.value = e.contentOffset.x; },
  });

  useEffect(() => () => {
    mountedRef.current = false;
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const scheduleRef = useRef<() => void>(() => {});
  const advanceRef  = useRef<() => void>(() => {});

  scheduleRef.current = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => advanceRef.current(), AUTO_DELAY);
  };

  advanceRef.current = () => {
    if (!mountedRef.current) return;
    const next = (curIdxRef.current + 1) % N;
    // wrap: jump silently to first, user won't notice during the 4.2s gap
    flatRef.current?.scrollToOffset({ offset: next * SW, animated: next !== 0 });
    curIdxRef.current = next;
    scheduleRef.current();
  };

  useEffect(() => { scheduleRef.current(); }, []);

  const onScrollBeginDrag = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!mountedRef.current) return;
      curIdxRef.current = Math.max(0, Math.min(N - 1, Math.round(e.nativeEvent.contentOffset.x / SW)));
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
      <Animated.FlatList
        ref={flatRef as any}
        data={slides}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        getItemLayout={getItemLayout}
        removeClippedSubviews={false}
        initialNumToRender={N}
        maxToRenderPerBatch={N}
        windowSize={N + 1}
        bounces
        overScrollMode="always"
        scrollEventThrottle={16}
        decelerationRate="fast"
        onScroll={onScrollAnim}
        onScrollBeginDrag={onScrollBeginDrag}
        onMomentumScrollEnd={onMomentumScrollEnd}
      />
      <View style={s.dots}>
        <ReanimatedScrollDots count={N} scrollX={scrollXSv} itemInterval={SW} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {},
  page: { width: SW, paddingHorizontal: 16 },
  dots: { alignItems: 'center', marginTop: 10 },
});
