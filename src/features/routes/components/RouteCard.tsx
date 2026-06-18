import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Clock, MapPin } from 'lucide-react-native';
import { memo } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/shared/colors';

import { setRoutePreview } from '../store';
import { DIFFICULTY, resolveRouteImage, WaterRoute } from '../types';

const { width: W } = Dimensions.get('window');
const IMG_H = 220;

function durationLabel(h: number) {
  if (h === 1) return '1 час';
  if (h < 5)   return `${h} часа`;
  return `${h} часов`;
}

export const RouteCard = memo(function RouteCard({ route }: { route: WaterRoute }) {
  const router   = useRouter();
  const imageUrl = resolveRouteImage(route.map_image_url);
  const diff     = DIFFICULTY[route.difficulty_level] ?? { label: route.difficulty_level, color: COLORS.text3 };
  const points   = (route.route_points ?? []).map((p) => p.name).filter(Boolean);
  const slug     = route.seo_slug ?? route.id;

  const handlePress = () => {
    setRoutePreview({ slug, name: route.name, imageUrl });
    router.push(`/routes/${slug}` as any);
  };

  return (
    <Pressable
      style={({ pressed }) => [s.card, pressed && { opacity: 0.93 }]}
      onPress={handlePress}
    >
      {/* ── image ── */}
      <View style={s.imgWrap}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={{ duration: 180, effect: 'cross-dissolve' }}
          />
        ) : (
          <LinearGradient
            colors={[COLORS.brandNavy, COLORS.brandCyan]}
            style={StyleSheet.absoluteFill}
          />
        )}

        {/* gradient overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.72)']}
          style={[StyleSheet.absoluteFill, { top: IMG_H * 0.35 }]}
          pointerEvents="none"
        />

        {/* difficulty dot — top right */}
        <View style={[s.diffPill, { backgroundColor: diff.color }]}>
          <Text style={s.diffTxt}>{diff.label}</Text>
        </View>

        {/* name + meta on image bottom */}
        <View style={s.overlay}>
          <Text style={s.name} numberOfLines={2}>{route.name}</Text>
          <View style={s.metaRow}>
            <View style={s.metaItem}>
              <Clock size={12} color="rgba(255,255,255,0.8)" strokeWidth={2} />
              <Text style={s.metaTxt}>{durationLabel(route.duration_hours)}</Text>
            </View>
            {points.length > 0 && (
              <View style={s.metaItem}>
                <MapPin size={12} color="rgba(255,255,255,0.8)" strokeWidth={2} />
                <Text style={s.metaTxt}>{points.length} точки маршрута</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* ── info strip below image ── */}
      {(points.length > 0 || (route.highlights?.length ?? 0) > 0) && (
        <View style={s.strip}>
          {points.length > 0 && (
            <Text style={s.pointsTxt} numberOfLines={1}>
              {points.slice(0, 3).join('  →  ')}
            </Text>
          )}
          {route.highlights && route.highlights.length > 0 && (
            <View style={s.chips}>
              {route.highlights.slice(0, 3).map((h, i) => (
                <View key={i} style={s.chip}>
                  <Text style={s.chipTxt}>{h}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </Pressable>
  );
});

const s = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },

  imgWrap: { height: IMG_H, width: '100%', backgroundColor: COLORS.muted },

  diffPill: {
    position: 'absolute',
    top: 12, right: 12,
    borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  diffTxt: { fontSize: 11, fontWeight: '700', color: '#fff' },

  overlay: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    padding: 16, gap: 6,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    lineHeight: 24,
  },
  metaRow:  { flexDirection: 'row', gap: 14 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaTxt:  { fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: '500' },

  strip:     { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  pointsTxt: { fontSize: 12, color: COLORS.text3, fontWeight: '500', letterSpacing: 0.2 },

  chips:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    backgroundColor: COLORS.muted,
    borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  chipTxt: { fontSize: 11, color: COLORS.text2, fontWeight: '500' },
});
