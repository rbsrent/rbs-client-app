import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/shared/colors';

interface Props {
  title: string;
  sub?: string;
  seeAllLabel?: string;
  onSeeAll?: () => void;
}

export function SectionHeader({ title, sub, seeAllLabel = 'Все', onSeeAll }: Props) {
  return (
    <View style={styles.row}>
      <View>
        <Text style={styles.title}>{title}</Text>
        {sub ? <Text style={styles.sub}>{sub}</Text> : null}
      </View>
      {onSeeAll ? (
        <Pressable
          style={({ pressed }) => [styles.seeAll, pressed && { opacity: 0.6 }]}
          onPress={onSeeAll}
          hitSlop={8}
        >
          <Text style={styles.seeAllText}>{seeAllLabel}</Text>
          {/* <ArrowRight size={14} color={COLORS.brandCyan} strokeWidth={2.5} /> */}
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 17,
    fontWeight: '500',
    color: COLORS.text1,
    letterSpacing: 0.1,
  },
  sub: {
    fontSize: 13,
    color: COLORS.text3,
    marginTop: 2,
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingTop: 2,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.brandBlue,
  },
});
