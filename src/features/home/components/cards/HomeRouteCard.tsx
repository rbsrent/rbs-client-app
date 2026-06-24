import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Clock } from 'lucide-react-native';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/shared/colors';
import { SUPABASE_URL } from '@/shared/supabase/publicClient';
import { HomeRoute } from '@/store/useHomeStore';

const BUCKET  = 'water-route-images';
const CARD_W  = 220;
const CARD_H  = 160;

function resolveImage(raw: string | null): string | null {
  if (!raw) return null;
  if (raw.startsWith('http')) return raw.replace('https://ntempzyiunijdoskroxs.supabase.co', SUPABASE_URL);
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${raw}`;
}

function durationLabel(h: number): string {
  if (h === 1) return '1 час';
  if (h < 5)  return `${h} часа`;
  return `${h} часов`;
}

export const HomeRouteCard = memo(function HomeRouteCard({ route }: { route: HomeRoute }) {
  const router   = useRouter();
  const imageUrl = resolveImage(route.map_image_url);

  return (
    <Pressable
      style={({ pressed }) => [s.card, pressed && { opacity: 0.9 }]}
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
        <View style={[StyleSheet.absoluteFill, s.placeholder]} />
      )}
      <View style={[StyleSheet.absoluteFill, s.dim]} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.82)']}
        start={{ x: 0, y: 0.35 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={s.bottom}>
        <Text style={s.name} numberOfLines={2}>{route.name}</Text>
        {route.duration_hours ? (
          <View style={s.durationRow}>
            <Clock size={11} color="rgba(255,255,255,0.8)" strokeWidth={2} />
            <Text style={s.durationTxt}>{durationLabel(route.duration_hours)}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
});

export { CARD_W as ROUTE_CARD_W, CARD_H as ROUTE_CARD_H };

const s = StyleSheet.create({
  card: {
    width: CARD_W, height: CARD_H,
    borderRadius: 16, overflow: 'hidden',
    backgroundColor: COLORS.brandNavy,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18, shadowRadius: 10,
    elevation: 4,
  },
  placeholder: { backgroundColor: '#0B1120' },
  dim:         { backgroundColor: 'rgba(0,0,0,0.18)', zIndex: 1 },
  bottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 12, paddingBottom: 12, paddingTop: 28, gap: 4,
  },
  name: {
    color: '#fff', fontSize: 13, fontWeight: '700', lineHeight: 17,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  durationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  durationTxt: { color: 'rgba(255,255,255,0.8)', fontSize: 11 },
});
