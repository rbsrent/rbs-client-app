import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { getOnboardingComplete } from '@/features/onboarding/hooks/useOnboardingComplete';
import { Spinner } from '@/shared/components/Spinner';

const { width: SW } = Dimensions.get('window');
const LOGO_SIZE = SW * 0.28;
const GLOW_SIZE = LOGO_SIZE * 2.8;
const MIN_MS    = 1800;

export function SplashScreen() {
  const router = useRouter();

  const glowOpacity = useSharedValue(0);
  const glowScale   = useSharedValue(0.6);
  const logoOpacity = useSharedValue(0);
  const logoScale   = useSharedValue(0.72);
  const textOpacity    = useSharedValue(0);
  const textTranslateY = useSharedValue(12);

  useEffect(() => {
    glowOpacity.value = withTiming(0.55, { duration: 900, easing: Easing.out(Easing.ease) });
    glowScale.value   = withSequence(
      withTiming(1.05, { duration: 900, easing: Easing.out(Easing.ease) }),
      withTiming(1.0,  { duration: 600, easing: Easing.inOut(Easing.ease) }),
    );

    logoOpacity.value = withDelay(100, withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) }));
    logoScale.value   = withDelay(100, withSpring(1, { damping: 14, stiffness: 120 }));

    textOpacity.value    = withDelay(420, withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) }));
    textTranslateY.value = withDelay(420, withTiming(0, { duration: 400, easing: Easing.out(Easing.ease) }));

    let cancelled = false;
    const minDelay = new Promise<void>((r) => setTimeout(r, MIN_MS));
    Promise.all([minDelay, getOnboardingComplete()]).then(([, done]) => {
      if (cancelled) return;
      router.replace(done ? '/(tabs)' : '/onboarding');
    });
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const glowStyle = useAnimatedStyle(() => ({
    opacity:   glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));
  const logoStyle = useAnimatedStyle(() => ({
    opacity:   logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));
  const textStyle = useAnimatedStyle(() => ({
    opacity:   textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  return (
    <View style={s.root}>
      {/* Blue glow behind logo */}
      <Animated.View style={[s.glowWrap, glowStyle]}>
        <Image
          source={require('../../../../assets/images/logo-glow.png')}
          style={{ width: GLOW_SIZE, height: GLOW_SIZE }}
          contentFit="contain"
        />
      </Animated.View>

      {/* Logo icon */}
      <Animated.View style={logoStyle}>
        <Image
          source={require('../../../../assets/images/icon-rbs.png')}
          style={{ width: LOGO_SIZE, height: LOGO_SIZE }}
          contentFit="contain"
        />
      </Animated.View>

      {/* Brand name + tagline */}
      <Animated.View style={[s.textWrap, textStyle]}>
        <Text style={s.brand}>RBS.RENT</Text>
        <Text style={s.tagline}>Аренда катеров и яхт</Text>
      </Animated.View>

      {/* Subtle loader */}
      <Spinner
        size={20}
        color="rgba(255,255,255,0.45)"
        trackColor="rgba(255,255,255,0.12)"
        style={s.loader}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0D1421',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    marginTop: 24,
    alignItems: 'center',
    gap: 6,
  },
  brand: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 4,
  },
  tagline: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.40)',
    letterSpacing: 0.5,
    fontWeight: '400',
  },
  loader: {
    position: 'absolute',
    bottom: 56,
  },
});
