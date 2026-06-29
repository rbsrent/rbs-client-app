import { useLocalSearchParams, useRootNavigationState, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

// Handles /boats/<uuid>/<slug> and any deeper sub-paths from share URLs
export default function BoatAliasWithSlug() {
  const { id } = useLocalSearchParams<{ id: string; rest: string[] }>();
  const router = useRouter();

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
