import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/shared/colors';
import { HeroSlide } from '@/store/useCatalogStore';

const WEB_BASE = 'https://rbs.rent';

function resolveUrl(raw: string): string {
  if (!raw) return '';
  if (raw.startsWith('http')) return raw;
  if (raw.startsWith('/')) return `${WEB_BASE}${raw}`;
  return raw;
}

interface Props {
  slide: HeroSlide;
  width: number;
  height: number;
}

export function BannerCard({ slide, width, height }: Props) {
  const router   = useRouter();
  const imageUrl = resolveUrl(slide.image_url ?? '');
  const ctaUrl   = slide.cta_primary_url || slide.cta_secondary_url;
  const hasText  = !!(slide.title || slide.description);

  return (
    <Pressable
      style={[styles.card, { width, height }]}
      onPress={() => ctaUrl && router.push(ctaUrl as any)}
      android_ripple={null}
    >
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.brandNavy }]} />
      )}
      <View style={[StyleSheet.absoluteFill, styles.dimOverlay]} />

      {hasText && (
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.65)']}
          style={styles.overlay}
        >
          {slide.title ? (
            <Text style={styles.cardTitle} numberOfLines={2}>{slide.title}</Text>
          ) : null}
          {slide.description ? (
            <Text style={styles.cardDesc} numberOfLines={1}>{slide.description}</Text>
          ) : null}
          {slide.cta_primary_label ? (
            <View style={styles.ctaTag}>
              <Text style={styles.ctaTagText}>{slide.cta_primary_label}</Text>
            </View>
          ) : null}
        </LinearGradient>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: COLORS.muted,
    justifyContent: 'flex-end',
  },
  dimOverlay: {
    backgroundColor: 'rgba(0,0,0,0.38)',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'flex-end',
    padding: 16,
    gap: 3,
  },
  cardTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 25,
  },
  cardDesc: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 13,
    lineHeight: 18,
  },
  ctaTag: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 6,
  },
  ctaTagText: {
    color: COLORS.brandNavy,
    fontSize: 11,
    fontWeight: '700',
  },
});
