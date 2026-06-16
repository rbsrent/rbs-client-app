import { useRouter } from 'expo-router';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { COLORS } from '@/shared/colors';

export function FilterChips() {
  const router = useRouter();
  const chips = [
    { label: 'Рядом с вами', onPress: () => router.push('/catalog' as any) },
    { label: 'Популярные', onPress: () => router.push('/catalog' as any) },
  ];
  return (
    <View style={styles.filterRow}>
      {chips.map((c) => (
        <Pressable key={c.label} style={styles.filterChip} onPress={c.onPress}>
          <Text style={styles.filterChipText}>{c.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: 'row',
    gap: 10,
  },
  filterChip: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1D1D1D',
  },
});
