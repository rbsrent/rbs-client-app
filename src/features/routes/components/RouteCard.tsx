import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Clock, Heart, MapPin } from 'lucide-react-native';
import { memo, useEffect, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { COLORS } from '@/shared/colors';
import { useRouteWishlistPicker } from '@/shared/components/RouteWishlistPickerContext';
import { useWishlistToast } from '@/shared/context/WishlistToastContext';
import { removeRouteFromAllGroups } from '@/shared/wishlist';
import { useRouteSavedStore } from '@/store/useRouteSavedStore';

import { setRoutePreview } from '../store';
import { resolveRouteImage, WaterRoute } from '../types';

const { width: W } = Dimensions.get('window');
const IMG_H = Math.round(W * 0.6);

const AnimPressable = Animated.createAnimatedComponent(Pressable);

function durationLabel(h: number) {
  if (h === 1) return '1 час';
  if (h < 5)   return `${h} часа`;
  return `${h} часов`;
}

function HeartBtn({ route }: { route: WaterRoute }) {
  const hydrate             = useRouteSavedStore((s) => s.hydrate);
  const isSaved             = useRouteSavedStore((s) => s.savedIds.has(route.id));
  const refresh             = useRouteSavedStore((s) => s.refresh);
  const { openRoutePicker } = useRouteWishlistPicker();
  const { show: showToast, dismiss: dismissToast } = useWishlistToast();
  const scale               = useSharedValue(1);

  useEffect(() => { hydrate(); }, []);

  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = async () => {
    dismissToast();
    scale.value = withSequence(
      withTiming(0.82, { duration: 90 }),
      withTiming(1,    { duration: 90 }),
    );
    if (isSaved) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await removeRouteFromAllGroups(route.id);
      await refresh(route.id);
      showToast({ type: 'deleted', listName: 'Маршруты', imageUrl: route.map_image_url });
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      openRoutePicker({
        route_id:       route.id,
        name:           route.name,
        map_image_url:  route.map_image_url,
        duration_hours: route.duration_hours,
      });
    }
  };

  return (
    <AnimPressable style={[s.heartBtn, anim]} onPress={handlePress} hitSlop={12}>
      <Heart
        size={18}
        color={isSaved ? COLORS.error : 'rgba(255,255,255,0.95)'}
        fill={isSaved ? COLORS.error : 'transparent'}
        strokeWidth={2}
      />
    </AnimPressable>
  );
}

export const RouteCard = memo(function RouteCard({ route }: { route: WaterRoute }) {
  const router    = useRouter();
  const imageUrl  = resolveRouteImage(route.map_image_url);
  const [imgErr, setImgErr] = useState(false);
  const points    = (route.route_points ?? []).map((p) => p.name).filter(Boolean);
  const slug      = route.seo_slug ?? route.id;

  const handlePress = () => {
    setRoutePreview({ slug, name: route.name, imageUrl });
    router.push(`/routes/${slug}` as any);
  };

  return (
    <Pressable
      style={({ pressed }) => [s.card, pressed && { opacity: 0.94 }]}
      onPress={handlePress}
    >
      <View style={s.imgWrap}>
        {imageUrl && !imgErr ? (
          <Image
            source={{ uri: imageUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={{ duration: 180, effect: 'cross-dissolve' }}
            onError={() => setImgErr(true)}
          />
        ) : (
          <LinearGradient
            colors={[COLORS.brandNavy, COLORS.brandCyan]}
            style={StyleSheet.absoluteFill}
          />
        )}

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.55)']}
          style={s.gradient}
          pointerEvents="none"
        />

        <HeartBtn route={route} />

        <View style={s.bottomRow}>
          <View style={s.durationPill}>
            <Clock size={11} color={COLORS.text1} strokeWidth={2.5} />
            <Text style={s.durationTxt}>{durationLabel(route.duration_hours)}</Text>
          </View>
        </View>
      </View>

      <View style={s.info}>
        <Text style={s.name} numberOfLines={3}>{route.name}</Text>
        {points.length > 0 && (
          <View style={s.metaRow}>
            <MapPin size={12} color={COLORS.text3} strokeWidth={2} />
            <Text style={s.metaTxt} numberOfLines={1}>
              {points.slice(0, 3).join(' → ')}
            </Text>
          </View>
        )}
        {route.highlights && route.highlights.length > 0 && (
          <Text style={s.metaTxt} numberOfLines={1}>
            {route.highlights.slice(0, 2).join('  ·  ')}
          </Text>
        )}
      </View>
    </Pressable>
  );
});

const s = StyleSheet.create({
  card: {},

  imgWrap: {
    height: IMG_H,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.muted,
  },

  gradient: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: IMG_H * 0.45,
  },

  heartBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  bottomRow: {
    position: 'absolute',
    bottom: 12,
    left: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  durationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  durationTxt: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text1,
  },

  info: {
    paddingTop: 12,
    gap: 4,
  },
  name: {
    fontSize: 19,
    fontWeight: '700',
    color: COLORS.text1,
    lineHeight: 25,
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaTxt: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text3,
    lineHeight: 18,
  },
});
