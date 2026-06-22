import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

const { width: W } = Dimensions.get('window');
const SKEL = '#E8E8E8';

// Shared shimmer — each block gets its own translateX driven by same pattern
function S({ w, h, style }: { w: number | string; h: number; style?: object }) {
  const tx = useSharedValue(-W);
  useEffect(() => {
    tx.value = withRepeat(
      withTiming(W, { duration: 1100, easing: Easing.linear }),
      -1,
    );
  }, []);
  const anim = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value }] }));
  return (
    <View style={[{ width: w as number, height: h, backgroundColor: SKEL, overflow: 'hidden' }, style]}>
      <Animated.View style={[StyleSheet.absoluteFill, anim]}>
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.52)', 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

function Divider() {
  return <View style={sk.divider} />;
}

export function BoatDetailSkeleton() {
  return (
    <View>
      {/* Host row — mirrors s.hostRow: paddingHorizontal:24, paddingVertical:20, gap:16 */}
      <View style={sk.hostRow}>
        <S w={40} h={40} style={sk.r20} />
        <View style={{ gap: 6 }}>
          <S w={100} h={14} style={sk.r4} />
          <S w={140} h={13} style={sk.r4} />
        </View>
      </View>

      <Divider />

      {/* Features — mirrors block: paddingHorizontal:24, paddingVertical:20, gap:20 */}
      <View style={sk.featuresBlock}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={sk.featRow}>
            {/* iconWrap: 40x40 */}
            <S w={40} h={40} style={sk.r8} />
            <View style={{ flex: 1, gap: 6 }}>
              {/* title: fontSize 14, lineHeight 21 */}
              <S w={W * 0.42} h={14} style={sk.r4} />
              {/* desc: fontSize 14, lineHeight 21 */}
              <S w={W * 0.58} h={13} style={sk.r4} />
            </View>
          </View>
        ))}
      </View>

      <Divider />

      {/* Description — 3 lines */}
      <View style={sk.descBlock}>
        <S w={W - 48} h={14} style={sk.r4} />
        <S w={W - 48} h={14} style={[sk.r4, { marginTop: 8 }]} />
        <S w={(W - 48) * 0.62} h={14} style={[sk.r4, { marginTop: 8 }]} />
      </View>

      <Divider />

      {/* Amenities — mirrors block: paddingHorizontal:24, paddingVertical:20, gap:14 */}
      <View style={sk.amenBlock}>
        {/* title: fontSize 18 */}
        <S w={120} h={18} style={sk.r4} />
        <View style={sk.amenList}>
          {[120, 140, 110, 130, 100].map((w, i) => (
            <View key={i} style={sk.amenRow}>
              {/* icon: 20x20 */}
              <S w={20} h={20} style={sk.r10} />
              <S w={w} h={14} style={sk.r4} />
            </View>
          ))}
        </View>
      </View>

      <Divider />

      {/* Reviews header stub */}
      <View style={sk.reviewsBlock}>
        <S w={160} h={18} style={sk.r4} />
        <View style={{ gap: 12, marginTop: 16 }}>
          {[1, 2].map((i) => (
            <View key={i} style={sk.reviewRow}>
              <S w={36} h={36} style={sk.r18} />
              <View style={{ flex: 1, gap: 6 }}>
                <S w={W * 0.35} h={13} style={sk.r4} />
                <S w={W * 0.55} h={12} style={sk.r4} />
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const sk = StyleSheet.create({
  // radius helpers
  r3:  { borderRadius: 3 },
  r4:  { borderRadius: 4 },
  r8:  { borderRadius: 8 },
  r10: { borderRadius: 10 },
  r18: { borderRadius: 18 },
  r20: { borderRadius: 20 },

  // divider mirrors s.divider
  divider: { height: 1, backgroundColor: '#DDDDDD', marginHorizontal: 24 },

  // stats — mirrors s.statsRow
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  statsCell: { flex: 1, alignItems: 'center', gap: 0 },
  vSep: { width: 1, height: 32, backgroundColor: '#DDDDDD', marginHorizontal: 4 },

  // host — mirrors s.hostRow
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },

  // features — mirrors s.block in BoatDetailFeatures
  featuresBlock: { paddingHorizontal: 24, paddingVertical: 20, gap: 20 },
  featRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },

  // description
  descBlock: { paddingHorizontal: 24, paddingVertical: 20 },

  // amenities — mirrors s.block in BoatDetailAmenities
  amenBlock: { paddingHorizontal: 24, paddingVertical: 20, gap: 14 },
  amenList:  { gap: 4 },
  amenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },

  // reviews stub
  reviewsBlock: { paddingHorizontal: 24, paddingVertical: 20 },
  reviewRow:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
