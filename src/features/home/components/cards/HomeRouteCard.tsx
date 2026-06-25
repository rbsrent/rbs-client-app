import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { memo, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/shared/colors';
import { SUPABASE_URL } from '@/shared/supabase/publicClient';
import { HomeRoute } from '@/store/useHomeStore';

const BUCKET  = 'water-route-images';
const SCREEN  = Dimensions.get('window').width;
const CARD_W  = SCREEN - 80;
const CARD_H  = 300;

function toWebp(url: string): string {
  return url.replace(/\.[^/.]+$/, '') + '_large.webp';
}

function resolveImage(raw: string | null): string | null {
  if (!raw) return null;
  if (raw.startsWith('http')) {
    const normalized = raw
      .replace('https://ntempzyiunijdoskroxs.supabase.co', SUPABASE_URL)
      .replace('https://proxy.rbs.rent', SUPABASE_URL);
    return toWebp(normalized);
  }
  return toWebp(`${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${raw}`);
}

function durationLabel(h: number): string {
  if (h === 1) return '1 час';
  if (h < 5)  return `${h} часа`;
  return `${h} часов`;
}

export const HomeRouteCard = memo(function HomeRouteCard({ route }: { route: HomeRoute }) {
  const router   = useRouter();
  const imageUrl = resolveImage(route.map_image_url);
  const [imgErr, setImgErr] = useState(false);

  return (
    <Pressable
      style={({ pressed }) => [s.card, pressed && { opacity: 0.92 }]}
      onPress={() => router.push(`/routes/${route.seo_slug ?? route.id}` as any)}
    >
      {imageUrl && !imgErr ? (
        <Image
          source={{ uri: imageUrl }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy="memory-disk"
          onError={() => setImgErr(true)}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, s.placeholder]} />
      )}

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.72)']}
        start={{ x: 0, y: 0.45 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View style={s.bottom}>
        <Text style={s.name} numberOfLines={2}>{route.name}</Text>
        {/* {route.duration_hours ? (
          <View style={s.durationRow}>
            <Clock size={12} color="rgba(255,255,255,0.85)" strokeWidth={2} />
            <Text style={s.durationTxt}>{durationLabel(route.duration_hours)}</Text>
          </View>
        ) : null} */}
      </View>
    </Pressable>
  );
});

export { CARD_H as ROUTE_CARD_H, CARD_W as ROUTE_CARD_W };

const s = StyleSheet.create({
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: COLORS.brandNavy,
  },
  placeholder: { backgroundColor: '#0B1120' },
  bottom: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 40,
    gap: 5,
  },
  name: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 21,
  },
  durationRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  durationTxt: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '500' },
});
