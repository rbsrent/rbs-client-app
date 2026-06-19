import { StyleSheet, View } from 'react-native';

interface Props {
  count: number;
  active: number;
}

export function OnboardingDots({ count, active }: Props) {
  return (
    <View style={s.row}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={[s.dot, i === active && s.active]} />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  active: {
    width: 22,
    backgroundColor: '#fff',
  },
});
