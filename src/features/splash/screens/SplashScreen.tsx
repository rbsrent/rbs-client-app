import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { getOnboardingComplete } from '@/features/onboarding/hooks/useOnboardingComplete';
import { COLORS } from '@/shared/colors';
import { Spinner } from '@/shared/components/Spinner';

const MIN_MS = 1600;

export function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    const minDelay = new Promise<void>((r) => setTimeout(r, MIN_MS));

    Promise.all([minDelay, getOnboardingComplete()]).then(([, done]) => {
      if (cancelled) return;
      router.replace(done ? '/(tabs)' : '/onboarding');
    });

    return () => { cancelled = true; };
  }, []);

  return (
    <View style={s.root}>
      <Text style={s.logo}>RBS.RENT</Text>
      <Spinner size={20} color="rgba(255,255,255,0.7)" trackColor="rgba(255,255,255,0.2)" style={s.loader} />
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.brandNavy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 2,
  },
  loader: {
    position: 'absolute',
    bottom: 64,
  },
});
