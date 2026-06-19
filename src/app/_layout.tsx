import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Stack, useRouter, useRootNavigationState, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PersistGate } from 'redux-persist/integration/react';

import { authSupabase } from '@/shared/supabase/authClient';
import { WishlistPickerProvider } from '@/shared/components/WishlistPickerContext';
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

function AuthRedirect() {
  const router = useRouter();
  const segments = useSegments();
  const navState = useRootNavigationState();
  const { session, isHydrated } = useAuthStore();

  useEffect(() => {
    if (!navState?.key || !isHydrated) return;
    const root = segments[0] as string | undefined;
    const setupRoutes = ['auth', 'onboarding', 'permissions', 'index', undefined];
    if (session && setupRoutes.includes(root)) {
      router.replace('/(tabs)');
    }
  }, [session, isHydrated, navState?.key, segments]);

  return null;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={offlineReduxStore}>
        <PersistGate loading={null} persistor={persistor}>
          <BottomSheetModalProvider>
            <WishlistPickerProvider>
            <AuthListener />
            <AuthRedirect />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" options={{ animation: 'none' }} />
              <Stack.Screen name="onboarding" options={{ animation: 'fade', gestureEnabled: false }} />
              <Stack.Screen name="permissions/location" options={{ animation: 'fade', gestureEnabled: false }} />
              <Stack.Screen name="permissions/notification" options={{ animation: 'fade', gestureEnabled: false }} />
              <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
              <Stack.Screen name="auth" options={{ presentation: 'modal', gestureEnabled: true }} />
              <Stack.Screen name="catalog" options={{ animation: 'slide_from_bottom', headerShown: false }} />
              <Stack.Screen name="booking/[boatId]" options={{ presentation: 'card', gestureEnabled: false, animation: 'slide_from_bottom' }} />
              <Stack.Screen name="booking/conditions" options={{ presentation: 'card', animation: 'slide_from_right' }} />
              <Stack.Screen name="booking/oferta" options={{ presentation: 'card', animation: 'slide_from_right' }} />
              <Stack.Screen name="bookings/[id]" options={{ presentation: 'card' }} />
              <Stack.Screen name="wishlist/routes" options={{ presentation: 'card', animation: 'slide_from_right' }} />
              <Stack.Screen name="profile/settings" options={{ presentation: 'card' }} />
              <Stack.Screen name="certificates" options={{ presentation: 'card' }} />
              <Stack.Screen name="boats/index" options={{ presentation: 'card', animation: 'slide_from_right' }} />
              <Stack.Screen name="routes/[slug]" options={{ presentation: 'card', animation: 'slide_from_right' }} />
              <Stack.Screen name="services/boat" options={{ presentation: 'card', animation: 'slide_from_right' }} />
              <Stack.Screen name="services/yacht" options={{ presentation: 'card', animation: 'slide_from_right' }} />
              <Stack.Screen name="services/cruise" options={{ presentation: 'card', animation: 'slide_from_right' }} />
            </Stack>
            </WishlistPickerProvider>
          </BottomSheetModalProvider>
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
}
