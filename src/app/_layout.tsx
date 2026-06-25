import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import { Stack, useRouter, useRootNavigationState, useSegments } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Provider } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PersistGate } from 'redux-persist/integration/react';

import { authSupabase } from '@/shared/supabase/authClient';
import { PendingPaymentProvider } from '@/shared/context/PendingPaymentContext';
import { WishlistToastProvider } from '@/shared/context/WishlistToastContext';
import { PendingPaymentOverlay } from '@/shared/components/PendingPaymentOverlay';
import { WishlistToast } from '@/shared/components/WishlistToast';
import { WishlistPickerProvider } from '@/shared/components/WishlistPickerContext';
import { RouteWishlistPickerProvider } from '@/shared/components/RouteWishlistPickerContext';
import { registerPushToken } from '@/shared/registerPushToken';
import { offlineReduxStore, persistor } from '@/store/offlineStore';
import { useAuthStore } from '@/store/useAuthStore';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

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

function PushRegistrar() {
  const { session } = useAuthStore();

  useEffect(() => {
    if (!session) return;
    registerPushToken();
  }, [session?.user.id]);

  return null;
}

function NotificationColdStart() {
  const router = useRouter();
  const navState = useRootNavigationState();
  const handled = useRef(false);

  useEffect(() => {
    if (!navState?.key || handled.current) return;
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      handled.current = true;
      const raw = response.notification.request.content.data?.url as string | undefined;
      if (!raw) return;
      const route = resolveNotifUrl(raw);
      if (route) router.push(route as any);
    });
  }, [navState?.key]);

  return null;
}

function resolveNotifUrl(url: string): string | null {
  // path-based already (e.g. "/bookings/123")
  if (url.startsWith('/')) return url;
  // deep link scheme (e.g. "rbsrent://bookings/123")
  const { path, queryParams } = Linking.parse(url);
  if (!path) return null;
  const route = path.startsWith('/') ? path : `/${path}`;
  if (queryParams && Object.keys(queryParams).length > 0) {
    const qs = new URLSearchParams(queryParams as Record<string, string>).toString();
    return `${route}?${qs}`;
  }
  return route;
}

function NotificationNavigator() {
  const router = useRouter();
  const navState = useRootNavigationState();
  const listenerRef = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    listenerRef.current = Notifications.addNotificationResponseReceivedListener((response) => {
      if (!navState?.key) return;
      const raw = response.notification.request.content.data?.url as string | undefined;
      if (!raw) return;
      const route = resolveNotifUrl(raw);
      if (route) router.push(route as any);
    });
    return () => listenerRef.current?.remove();
  }, [navState?.key]);

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
    // 'permissions' prefix covers location, notification, and auth-gate sub-routes
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
            <WishlistToastProvider>
          <PendingPaymentProvider>
            <WishlistPickerProvider>
            <RouteWishlistPickerProvider>
            <AuthListener />
            <AuthRedirect />
            <PushRegistrar />
            <NotificationColdStart />
            <NotificationNavigator />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" options={{ animation: 'none' }} />
              <Stack.Screen name="onboarding" options={{ animation: 'fade', gestureEnabled: false }} />
              <Stack.Screen name="permissions/location" options={{ animation: 'fade', gestureEnabled: false }} />
              <Stack.Screen name="permissions/notification" options={{ animation: 'fade', gestureEnabled: false }} />
              <Stack.Screen name="permissions/auth-gate" options={{ animation: 'fade', gestureEnabled: false }} />
              <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
              <Stack.Screen name="auth" options={{ presentation: 'modal', gestureEnabled: true }} />
              <Stack.Screen name="catalog" options={{ animation: 'slide_from_bottom', headerShown: false }} />
              <Stack.Screen name="booking/[boatId]" options={{ presentation: 'card', gestureEnabled: false, animation: 'slide_from_bottom' }} />
              <Stack.Screen name="booking/conditions" options={{ presentation: 'card', animation: 'slide_from_right' }} />
              <Stack.Screen name="booking/oferta" options={{ presentation: 'card', animation: 'slide_from_right' }} />
              <Stack.Screen name="bookings/index" options={{ presentation: 'card', animation: 'slide_from_right' }} />
              <Stack.Screen name="bookings/[id]" options={{ presentation: 'card', gestureEnabled: false }} />
              <Stack.Screen name="wishlist/routes" options={{ presentation: 'card', animation: 'slide_from_right' }} />
              <Stack.Screen name="wishlist/route/[id]" options={{ presentation: 'card', animation: 'slide_from_right' }} />
              <Stack.Screen name="profile/settings" options={{ presentation: 'card', animation: 'slide_from_right' }} />
              <Stack.Screen name="profile/notifications" options={{ presentation: 'card', animation: 'slide_from_right' }} />
              <Stack.Screen name="certificates" options={{ presentation: 'card', animation: 'slide_from_right' }} />
              <Stack.Screen name="gift-cert" options={{ presentation: 'card', animation: 'slide_from_right' }} />
              <Stack.Screen name="boats/index" options={{ presentation: 'card', animation: 'slide_from_right' }} />
              <Stack.Screen name="boats/search" options={{ presentation: 'card', animation: 'slide_from_right' }} />
              <Stack.Screen name="routes/[slug]" options={{ presentation: 'card', animation: 'slide_from_right' }} />
              <Stack.Screen name="services/boat" options={{ presentation: 'card', animation: 'slide_from_right' }} />
              <Stack.Screen name="services/yacht" options={{ presentation: 'card', animation: 'slide_from_right' }} />
              <Stack.Screen name="services/cruise" options={{ presentation: 'card', animation: 'slide_from_right' }} />
              <Stack.Screen name="services/teplokhod" options={{ presentation: 'card', animation: 'slide_from_right' }} />
              <Stack.Screen name="piers" options={{ presentation: 'card', animation: 'slide_from_right', headerShown: false }} />
              <Stack.Screen name="booking/date-select" options={{ presentation: 'card', animation: 'slide_from_right', headerShown: false }} />
              <Stack.Screen name="booking/edit-trip" options={{ presentation: 'card', animation: 'slide_from_right', headerShown: false }} />
              <Stack.Screen name="ai-chat" options={{ presentation: 'modal', animation: 'slide_from_bottom', gestureEnabled: true }} />
            </Stack>
            <WishlistToast />
            <PendingPaymentOverlay />
            </RouteWishlistPickerProvider>
            </WishlistPickerProvider>
            </PendingPaymentProvider>
          </WishlistToastProvider>
          </BottomSheetModalProvider>
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
}
