import { Dimensions, StyleSheet, Text, View } from 'react-native';

import { OnboardingSlide as SlideType } from '../data/slides';

const { width: SW, height: SH } = Dimensions.get('window');

interface Props {
  item: SlideType;
}

export function OnboardingSlide({ item }: Props) {
  return (
    <View style={s.root}>
      <View style={s.mediaArea} />
      <View style={s.textBlock}>
        <Text style={s.title}>{item.title}</Text>
        <Text style={s.subtitle}>{item.subtitle}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    width: SW,
    height: SH,
    backgroundColor: '#0D1421',
  },
  mediaArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SH * 0.62,
    backgroundColor: '#141D2E',
  },
  textBlock: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 28,
    paddingBottom: 148,
    gap: 10,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 44,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 23,
  },
});
