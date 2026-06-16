import { useRef } from 'react';
import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/shared/colors';
import { ScrollDots } from '@/shared/components/ScrollDots';
import { HeroSlide } from '@/store/useCatalogStore';

import { BannerCard } from './BannerCard';

const CARD_W = 287;
const CARD_H = 139;
const GAP = 12;
const INTERVAL = CARD_W + GAP;

interface Props {
  slides: HeroSlide[];
}

export function PromoBanner({ slides }: Props) {
  const scrollX = useRef(new Animated.Value(0)).current;

  if (!slides.length) {
    const placeholders = [
      { id: '1', title: 'Аренда катеров', subtitle: 'Санкт-Петербург · с 2015 года', color: COLORS.brandNavy },
      { id: '2', title: 'Яхты и теплоходы', subtitle: 'Маршруты по рекам и каналам', color: '#1A4A6B' },
    ];
    return (
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.strip}
          decelerationRate="fast"
          snapToInterval={INTERVAL}
          snapToAlignment="start"
        >
          {placeholders.map((p) => (
            <View key={p.id} style={[styles.placeholderCard, { backgroundColor: p.color }]}>
              <Text style={styles.placeholderTitle}>{p.title}</Text>
              <Text style={styles.placeholderSub}>{p.subtitle}</Text>
            </View>
          ))}
        </ScrollView>
        <View style={styles.dotsContainer}>
          <View style={styles.dotsRow}>
            {placeholders.map((_, i) => (
              <View key={i} style={[styles.dot, i === 0 && styles.dotActive]} />
            ))}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View>
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
        {slides.map((slide) => (
          <BannerCard key={slide.id} slide={slide} />
        ))}
      </Animated.ScrollView>
      <View style={styles.dotsContainer}>
        <ScrollDots count={slides.length} scrollX={scrollX} itemInterval={INTERVAL} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    gap: GAP,
    paddingRight: 16,
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
  dotActive: {
    width: 20,
    backgroundColor: COLORS.brandNavy,
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
