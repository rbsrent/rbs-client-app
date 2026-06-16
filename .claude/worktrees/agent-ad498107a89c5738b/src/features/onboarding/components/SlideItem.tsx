import { Dimensions, StyleSheet, Text, View } from 'react-native';

import { Slide } from '../data/slides';
import { SlideIcon } from './SlideIcon';

const { width: W } = Dimensions.get('window');

export function SlideItem({ item }: { item: Slide }) {
  return (
    <View style={[styles.slide, { width: W }]}>
      <View style={[styles.circle, { backgroundColor: item.iconBg }]}>
        <SlideIcon icon={item.icon} color={item.iconColor} />
      </View>
      <Text style={styles.headline}>{item.headline}</Text>
      <Text style={styles.subtitle}>{item.subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 24,
  },
  circle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  headline: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1D1D1D',
    textAlign: 'center',
    lineHeight: 34,
    letterSpacing: 0.2,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#484848',
    textAlign: 'center',
    lineHeight: 20,
  },
});
