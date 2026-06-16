import { ChevronRight } from 'lucide-react-native';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { COLORS } from '@/shared/colors';

export interface MenuItem {
  key: string;
  Icon: React.ComponentType<any>;
  label: string;
  sub?: string;
  badge?: string;
  onPress: () => void;
  danger?: boolean;
}

export function MenuRow({ item, last }: { item: MenuItem; last: boolean }) {
  const color = item.danger ? COLORS.error : COLORS.text1;
  const iconColor = item.danger ? COLORS.error : '#343434';

  return (
    <Pressable
      style={({ pressed }) => [styles.menuRow, pressed && { backgroundColor: COLORS.muted }]}
      onPress={item.onPress}
    >
      <View style={styles.menuIconWrap}>
        <item.Icon size={20} color={iconColor} strokeWidth={1.8} />
      </View>

      <View style={styles.menuMid}>
        <Text style={[styles.menuLabel, { color }]}>{item.label}</Text>
        {item.sub ? <Text style={styles.menuSub}>{item.sub}</Text> : null}
      </View>

      {item.badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.badge}</Text>
        </View>
      ) : null}

      <ChevronRight size={16} color={item.danger ? COLORS.error : '#4A4A4A'} strokeWidth={2} />

      {!last && <View style={styles.rowDivider} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
    position: 'relative',
  },
  menuIconWrap: {
    width: 24,
    alignItems: 'center',
  },
  menuMid: {
    flex: 1,
    gap: 2,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.01,
  },
  menuSub: {
    fontSize: 12,
    color: COLORS.text3,
    fontWeight: '300',
  },
  badge: {
    backgroundColor: COLORS.success,
    borderRadius: 30,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },
  rowDivider: {
    position: 'absolute',
    bottom: 0,
    left: 52,
    right: 0,
    height: 0.5,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
});
