import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Anchor, Clock, Ship } from 'lucide-react-native';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { COLORS } from '@/shared/colors';

import { DIFFICULTY, resolveRouteImage, WaterRoute } from '../types';

export function RouteCard({ route }: { route: WaterRoute }) {
  const router = useRouter();
  const imageUrl = resolveRouteImage(route.map_image_url);
  const diff = DIFFICULTY[route.difficulty_level] ?? { label: route.difficulty_level, color: COLORS.text3 };
  const points = (route.route_points ?? []).slice(0, 3).map((p) => p.name).filter(Boolean);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
      onPress={() => router.push(`/routes/${route.seo_slug ?? route.id}` as any)}
    >
      <View style={styles.cardImage}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.imagePlaceholder]} />
        )}
        <View style={styles.imageBadgeRow}>
          <View style={[styles.diffBadge, { backgroundColor: diff.color }]}>
            <Text style={styles.diffText}>{diff.label}</Text>
          </View>
          {route.vessel_type === 'boat' && (
            <View style={styles.vesselBadge}>
              <Ship size={11} color={COLORS.white} strokeWidth={2} />
              <Text style={styles.vesselText}>Катер</Text>
            </View>
          )}
          {route.vessel_type === 'yacht' && (
            <View style={styles.vesselBadge}>
              <Anchor size={11} color={COLORS.white} strokeWidth={2} />
              <Text style={styles.vesselText}>Яхта</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={2}>{route.name}</Text>

        <View style={styles.durationRow}>
          <Clock size={13} color={COLORS.text3} strokeWidth={1.8} />
          <Text style={styles.durationText}>
            {route.duration_hours} {route.duration_hours === 1 ? 'час' : route.duration_hours < 5 ? 'часа' : 'часов'}
          </Text>
        </View>

        {points.length > 0 && (
          <Text style={styles.points} numberOfLines={1}>
            {points.join(' → ')}
          </Text>
        )}

        {route.highlights && route.highlights.length > 0 && (
          <View style={styles.highlights}>
            {route.highlights.slice(0, 2).map((h, i) => (
              <View key={i} style={styles.chip}>
                <Text style={styles.chipText} numberOfLines={1}>{h}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardImage: {
    height: 168,
    backgroundColor: COLORS.muted,
  },
  imagePlaceholder: {
    backgroundColor: COLORS.brandNavy,
    opacity: 0.15,
  },
  imageBadgeRow: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    gap: 6,
  },
  diffBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  diffText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
  },
  vesselBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  vesselText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.white,
  },

  cardBody: { padding: 14, gap: 6 },
  cardName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text1,
    lineHeight: 22,
  },
  durationRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  durationText: { fontSize: 13, color: COLORS.text2 },
  points: { fontSize: 12, color: COLORS.text3 },

  highlights: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 2 },
  chip: {
    backgroundColor: COLORS.muted,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chipText: { fontSize: 11, color: COLORS.text2, fontWeight: '500' },
});
