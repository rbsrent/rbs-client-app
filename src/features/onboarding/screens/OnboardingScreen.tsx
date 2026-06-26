import { useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { X } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '@/shared/colors';
import { Spinner } from '@/shared/components/Spinner';

import { ONBOARDING_SLIDES } from '../data/slides';

const SLIDE_DURATION = 4500;
const COUNT          = ONBOARDING_SLIDES.length;
const DUR            = (ms: number) => ({ duration: ms, easing: Easing.out(Easing.ease) });

type Phase = 'slides' | 'end';

export function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [phase, setPhase]           = useState<Phase>('slides');
  const [active, setActive]         = useState(0);
  const [videoReady, setVideoReady] = useState(false);

  // Text (Reanimated — UI thread, no JS bridge)
  const textOpacity    = useSharedValue(1);
  const textTranslateY = useSharedValue(0);

  // End phase
  const darkBgOpacity = useSharedValue(0);
  const brandOpacity  = useSharedValue(0);
  const brandScale    = useSharedValue(0.88);
  const btnOpacity    = useSharedValue(0);
  const btnTranslateY = useSharedValue(24);

  const player = useVideoPlayer(require('../../../../assets/videos/onboarding.mp4'), (p) => {
    p.loop  = false;
    p.muted = true;
    p.play();
  });

  const proceed = useCallback(() => {
    router.replace('/permissions/location' as any);
  }, [router]);

  useEffect(() => {
    const sub = player.addListener('statusChange', ({ status }) => {
      if (status === 'readyToPlay') setVideoReady(true);
    });
    return () => sub.remove();
  }, [player]);

  useEffect(() => {
    const sub = player.addListener('playToEnd', () => setPhase('end'));
    return () => sub.remove();
  }, [player]);

  // End phase — dark overlay covers video (no VideoView opacity anim = better Android perf)
  useEffect(() => {
    if (phase !== 'end') return;
    darkBgOpacity.value = withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) });
    brandOpacity.value  = withDelay(400, withTiming(1, DUR(500)));
    brandScale.value    = withDelay(400, withTiming(1, DUR(500)));
    btnOpacity.value    = withDelay(600, withTiming(1, DUR(400)));
    btnTranslateY.value = withDelay(600, withTiming(0, DUR(400)));
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const animateTextIn = useCallback(() => {
    textOpacity.value    = 0;
    textTranslateY.value = 16;
    textOpacity.value    = withTiming(1, DUR(320));
    textTranslateY.value = withTiming(0, DUR(320));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Slide timer — plain setTimeout, no Animated overhead
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goToSlide = useCallback((index: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setActive(index);
    animateTextIn();
    timerRef.current = setTimeout(() => {
      if (index < COUNT - 1) goToSlide(index + 1);
    }, SLIDE_DURATION);
  }, [animateTextIn]);

  useEffect(() => {
    goToSlide(0);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const darkBgStyle = useAnimatedStyle(() => ({ opacity: darkBgOpacity.value }));
  const textStyle   = useAnimatedStyle(() => ({
    opacity:   textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));
  const brandStyle  = useAnimatedStyle(() => ({
    opacity:   brandOpacity.value,
    transform: [{ scale: brandScale.value }],
  }));
  const btnStyle = useAnimatedStyle(() => ({
    opacity:   btnOpacity.value,
    transform: [{ translateY: btnTranslateY.value }],
  }));

  const current = ONBOARDING_SLIDES[active];

  return (
    <View style={s.root}>
      {/* Video — always rendered, covered by darkBg on end */}
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
      />
      <View style={s.videoOverlay} />

      {/* Dark end-phase cover */}
      <Animated.View style={[StyleSheet.absoluteFill, s.darkBg, darkBgStyle]} />

      {/* Spinner while buffering */}
      {!videoReady && (
        <View style={s.spinnerWrap}>
          <Spinner size={36} color="#fff" />
        </View>
      )}

      {/* Skip */}
      {phase === 'slides' && (
        <Pressable
          style={[s.skipBtn, { top: insets.top + 14 }]}
          onPress={proceed}
          hitSlop={12}
        >
          <X size={20} color={COLORS.white} strokeWidth={2.5} />
        </Pressable>
      )}

      {/* Tap to advance */}
      {phase === 'slides' && (
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => { if (active < COUNT - 1) goToSlide(active + 1); }}
        />
      )}

      {/* Slide text */}
      {phase === 'slides' && (
        <View style={s.center} pointerEvents="none">
          <Animated.View style={[s.textBlock, textStyle]}>
            <Text style={s.title}>{current.title}</Text>
            <Text style={s.subtitle}>{current.subtitle}</Text>
          </Animated.View>
        </View>
      )}

      {/* End — brand */}
      {phase === 'end' && (
        <View style={s.center} pointerEvents="none">
          <Animated.View style={[s.brandBlock, brandStyle]}>
            <Text style={s.brandText}>RBS.RENT</Text>
            <Text style={s.brandSub}>Аренда катеров и яхт</Text>
          </Animated.View>
        </View>
      )}

      {/* End — CTA */}
      {phase === 'end' && (
        <Animated.View style={[s.cta, { paddingBottom: insets.bottom + 32 }, btnStyle]}>
          <Pressable
            style={({ pressed }) => [s.btn, pressed && { opacity: 0.85 }]}
            onPress={proceed}
          >
            <Text style={s.btnTxt}>Далее</Text>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0D1421' },

  videoOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(10,18,35,0.30)',
  },

  darkBg: { backgroundColor: '#0D1421' },

  spinnerWrap: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },

  skipBtn: {
    position: 'absolute',
    right: 18,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },

  center: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },

  textBlock: { alignItems: 'center', gap: 12 },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 42,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.72)',
    lineHeight: 24,
    fontWeight: '400',
    textAlign: 'center',
  },

  brandBlock: { alignItems: 'center', gap: 10 },
  brandText: {
    fontSize: 38,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 4,
  },
  brandSub: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.50)',
    fontWeight: '400',
    letterSpacing: 0.5,
  },

  cta: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
  },
  btn: {
    width: '100%',
    height: 54,
    borderRadius: 16,
    backgroundColor: COLORS.brandNavy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnTxt: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.2,
  },
});
