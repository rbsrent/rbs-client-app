import { useLocalSearchParams, useRootNavigationState, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

// Handles /routes/<slug>/<sub-path> from share URLs (e.g. /routes/<uuid>/<name-slug>)
export default function RouteAliasWithSlug() {
  const { slug } = useLocalSearchParams<{ slug: string; rest: string[] }>();
  const router = useRouter();

  const navState = useRootNavigationState();
  const routes = navState?.routes;
  const prevRoute = routes && routes.length >= 2 ? routes[routes.length - 2] : null;

  useEffect(() => {
    if (prevRoute?.name === 'routes/[slug]' && (prevRoute.params as any)?.slug === slug) {
      router.back();
    } else {
      router.replace(`/routes/${slug}` as any);
    }
  }, []);

  return <View style={{ flex: 1, backgroundColor: '#0D1421' }} />;
}
