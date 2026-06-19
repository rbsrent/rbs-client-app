import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Clock } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { COLORS } from '@/shared/colors';
import { ScrollDots } from '@/shared/components/ScrollDots';
import { SectionHeader } from '@/shared/components/SectionHeader';
import { publicSupabase, SUPABASE_URL } from '@/shared/supabase/publicClient';
import { Spinner } from '@/shared/components/Spinner';

const BUCKET = 'water-route-images';

interface RoutePreview {
  id: string;
  name: string;
  map_image_url: string | null;
  duration_hours: number | null;
  seo_slug: string | null;
}

function resolveImage(raw: string | null): string | null {
  if (!raw) return null;
  if (raw.startsWith('http')) return raw;
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${raw}`;
}

const CARD_W = 220;
const CARD_H = 160;
const GAP = 10;
const INTERVAL = CARD_W + GAP;

function RoutePreviewCard({ route }: { route: RoutePreview }) {
  const router = useRouter();
  const imageUrl = resolveImage(route.map_image_url);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
      onPress={() => router.push(`/routes/${route.seo_slug ?? route.id}` as any)}
    >
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.placeholder]} />
      )}
      {/* dim overlay */}
      <View style={[StyleSheet.absoluteFill, styles.dimOverlay]} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.82)']}
        start={{ x: 0, y: 0.35 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.cardBottom}>
        <Text style={styles.cardName} numberOfLines={2}>{route.name}</Text>
        {route.duration_hours ? (
          <View style={styles.durationRow}>
            <Clock size={11} color="rgba(255,255,255,0.8)" strokeWidth={2} />
            <Text style={styles.durationText}>
              {route.duration_hours} {route.duration_hours === 1 ? 'час' : route.duration_hours < 5 ? 'часа' : 'часов'}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}


export function RoutesPreview() {
  const router = useRouter();
  const [routes, setRoutes] = useState<RoutePreview[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await publicSupabase
        .from('water_routes')
        .select('id,name,map_image_url,duration_hours,seo_slug')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .limit(5);
      if (!cancelled) {
        setRoutes((data as RoutePreview[]) ?? []);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (!loading && routes.length === 0) return null;

  return (
    <View style={styles.root}>
      <View style={styles.headerWrap}>
        <SectionHeader
          title="Куда отправиться"
          sub="в сезон 2026"
          seeAllLabel="Все маршруты"
          onSeeAll={() => router.push('/(tabs)/routes' as any)}
        />
      </View>

      {loading ? (
        <View style={styles.loader}>
          <Spinner />
        </View>
      ) : (
        <>
          <Animated.ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.strip}
            decelerationRate="fast"
            snapToInterval={INTERVAL}
            snapToAlignment="start"
            scrollEventThrottle={1}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: false },
            )}
          >
            {routes.map((r) => (
              <RoutePreviewCard key={r.id} route={r} />
            ))}
          </Animated.ScrollView>
          <View style={styles.dotsContainer}>
            <ScrollDots count={routes.length} scrollX={scrollX} itemInterval={INTERVAL} />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { marginTop: 24 },
  headerWrap: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  loader: {
    height: CARD_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  strip: {
    paddingLeft: 16,
    paddingRight: 8,
    gap: GAP,
  },
  dotsContainer: {
    paddingLeft: 16,
    paddingTop: 10,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C0C0C0',
  },
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.brandNavy,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  placeholder: {
    backgroundColor: '#0B1120',
  },
  dimOverlay: {
    backgroundColor: 'rgba(0,0,0,0.18)',
    zIndex: 1,
  },
  cardBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 28,
    gap: 4,
  },
  cardName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 17,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  durationText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
  },
});
