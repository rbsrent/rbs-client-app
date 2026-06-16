import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/shared/colors';
import { HeroSlide } from '@/store/useCatalogStore';

import { BannerCard } from './BannerCard';

const CARD_W = 287;
const CARD_H = 139;

interface Props {
  slides: HeroSlide[];
}

export function PromoBanner({ slides }: Props) {
  if (!slides.length) {
    // Placeholder cards when no data
    const placeholders = [
      { id: '1', title: 'Аренда катеров', subtitle: 'Санкт-Петербург · с 2015 года', color: COLORS.brandNavy },
      { id: '2', title: 'Яхты и теплоходы', subtitle: 'Маршруты по рекам и каналам', color: '#1A4A6B' },
    ];
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.strip}
        decelerationRate="fast"
        snapToInterval={CARD_W + 12}
        snapToAlignment="start"
      >
        {placeholders.map((p) => (
          <View key={p.id} style={[styles.placeholderCard, { backgroundColor: p.color }]}>
            <Text style={styles.placeholderTitle}>{p.title}</Text>
            <Text style={styles.placeholderSub}>{p.subtitle}</Text>
          </View>
        ))}
      </ScrollView>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.strip}
      decelerationRate="fast"
      snapToInterval={CARD_W + 12}
      snapToAlignment="start"
    >
      {slides.map((slide) => (
        <BannerCard key={slide.id} slide={slide} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  strip: {
    gap: 12,
    paddingRight: 16,
  },
  placeholderCard: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: 14,
  },
  placeholderTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 20,
  },
  placeholderSub: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    marginTop: 3,
  },
});
