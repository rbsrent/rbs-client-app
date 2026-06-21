import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '@/shared/colors';
import { ScrollDots } from '@/shared/components/ScrollDots';

import { ONBOARDING_SLIDES } from '../data/slides';

const { width: SW, height: SH } = Dimensions.get('window');

// ─── Screen ───────────────────────────────────────────────────────────────────

export function OnboardingScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const [active, setActive] = useState(0);
  const listRef   = useRef<FlatList>(null);
  const scrollX   = useRef(new Animated.Value(0)).current;

  // Animated values for text transition
  const opacity    = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const animateIn = useCallback(() => {
    opacity.setValue(0);
    translateY.setValue(14);
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [opacity, translateY]);

  // Track previous active to trigger animation only on change
  const prevActive = useRef(-1);

  const onViewable = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const idx = viewableItems[0]?.index;
      if (idx != null && idx !== prevActive.current) {
        prevActive.current = idx;
        setActive(idx);
      }
    },
    [],
  );

  useEffect(() => {
    animateIn();
  }, [active, animateIn]);

  const proceed = useCallback(() => {
    router.replace('/permissions/location' as any);
  }, [router]);

  const goNext = useCallback(() => {
    const isLast = active === ONBOARDING_SLIDES.length - 1;
    if (isLast) {
      proceed();
    } else {
      listRef.current?.scrollToIndex({ index: active + 1, animated: true });
    }
  }, [active, proceed]);

  const current = ONBOARDING_SLIDES[active];

  return (
    <View style={s.root}>
      {/* Background image */}
      <Image
        source={require('../../../../assets/images/yacht.jpeg')}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        cachePolicy="memory-disk"
      />

      {/* Dark overlay */}
      <View style={s.overlay} />

      {/* Skip */}
      <Pressable
        style={[s.skipBtn, { top: insets.top + 14 }]}
        onPress={proceed}
        hitSlop={12}
      >
        <X size={18} color={COLORS.brandNavy} strokeWidth={2.5} />
      </Pressable>

      {/* Invisible full-screen FlatList — swipe gesture only */}
      <FlatList
        ref={listRef}
        data={ONBOARDING_SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={() => <View style={{ width: SW, height: SH }} />}
        onViewableItemsChanged={onViewable}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        getItemLayout={(_, i) => ({ length: SW, offset: SW * i, index: i })}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
        bounces={false}
        removeClippedSubviews={false}
        style={StyleSheet.absoluteFill}
      />

      {/* Bottom: text → dots → button */}
      <View style={[s.bottom, { paddingBottom: insets.bottom + 36 }]}>
        {/* Animated text block */}
        <Animated.View style={[s.textBlock, { opacity, transform: [{ translateY }] }]}>
          <Text style={s.title}>{current.title}</Text>
          <Text style={s.subtitle}>{current.subtitle}</Text>
        </Animated.View>

        <ScrollDots
          count={ONBOARDING_SLIDES.length}
          scrollX={scrollX}
          itemInterval={SW}
          activeColor="#fff"
          inactiveColor="rgba(255,255,255,0.3)"
        />

        <Pressable
          style={({ pressed }) => [s.btn, pressed && { opacity: 0.85 }]}
          onPress={goNext}
        >
          <Text style={s.btnTxt}>
            {active === ONBOARDING_SLIDES.length - 1 ? 'Начать' : 'Далее'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0D1421' },

  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(10, 18, 35, 0.52)',
  },

  skipBtn: {
    position: 'absolute',
    right: 18,
    width: 36,
    height: 36,
    borderRadius: 18,
    // backgroundColor: 'rgba(255,255,255,0.1)',
    backgroundColor: COLORS.greyLight2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },

  bottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    gap: 20,
    alignItems: 'flex-start',
  },

  textBlock: {
    gap: 10,
    alignSelf: 'stretch',
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 42,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.72)',
    lineHeight: 24,
    fontWeight: '400',
  },

  btn: {
    width: '100%',
    height: 54,
    borderRadius: 16,
    backgroundColor: COLORS.brandNavy,
    alignItems: 'center',
    justifyContent: 'center',
    // borderWidth: 1,
    // borderColor: 'rgba(255,255,255,0.12)',
  },
  btnTxt: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.2,
  },
});
