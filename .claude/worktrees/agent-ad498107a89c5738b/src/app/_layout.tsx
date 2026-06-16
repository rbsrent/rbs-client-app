import { Stack, useRouter, useRootNavigationState, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import { authSupabase } from '@/shared/supabase/authClient';
import { offlineReduxStore, persistor } from '@/store/offlineStore';
import { useAuthStore } from '@/store/useAuthStore';

function AuthListener() {
  const { setSession, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
    const { data: { subscription } } = authSupabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  return null;
}

const AUTH_SCREENS = new Set(['onboarding', 'auth']);

function AuthRedirect() {
  const router = useRouter();
  const segments = useSegments();
  const navState = useRootNavigationState();
  const { session, isHydrated } = useAuthStore();

  useEffect(() => {
    if (!navState?.key || !isHydrated) return;

    const root = segments[0] as string | undefined;
    const inAuthFlow = root ? AUTH_SCREENS.has(root) : false;

    if (!session && !inAuthFlow) {
      router.replace('/onboarding');
    } else if (session && inAuthFlow) {
      router.replace('/(tabs)');
    }
  }, [session, isHydrated, navState?.key, segments]);

  return null;
}

export default function RootLayout() {
  return (
    <Provider store={offlineReduxStore}>
      <PersistGate loading={null} persistor={persistor}>
        <AuthListener />
        <AuthRedirect />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="auth" options={{ presentation: 'card', animation: 'slide_from_right' }} />
          <Stack.Screen name="catalog/[id]" options={{ presentation: 'card', animation: 'slide_from_right' }} />
          <Stack.Screen name="booking/[boatId]" options={{ presentation: 'card' }} />
          <Stack.Screen name="bookings/[id]" options={{ presentation: 'card' }} />
          <Stack.Screen name="profile/settings" options={{ presentation: 'card' }} />
          <Stack.Screen name="certificates" options={{ presentation: 'card' }} />
        </Stack>
      </PersistGate>
    </Provider>
  );
}
