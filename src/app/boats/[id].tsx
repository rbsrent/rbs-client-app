import { useLocalSearchParams, useRootNavigationState, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

export default function BoatAlias() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // Check if the screen below us is already catalog/[id] with the same id
  // (DeepLinkHandler pushes catalog before Expo Router routes here, so we just go back).
  // If not, replace self with catalog directly.
  const navState = useRootNavigationState();
  const routes = navState?.routes;
  const prevRoute = routes && routes.length >= 2 ? routes[routes.length - 2] : null;

  useEffect(() => {
    if (prevRoute?.name === 'catalog/[id]' && (prevRoute.params as any)?.id === id) {
      router.back();
    } else {
      router.replace(`/catalog/${id}` as any);
    }
  }, []);

  return <View style={{ flex: 1, backgroundColor: '#0D1421' }} />;
}
