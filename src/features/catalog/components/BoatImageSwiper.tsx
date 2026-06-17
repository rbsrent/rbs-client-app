import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Heart, Maximize2, Share2, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '@/shared/colors';
import { useWishlistStore } from '@/store/useWishlistStore';
import { BoatData } from '@/shared/wishlist';
import { useWishlistPicker } from '@/shared/components/WishlistPickerContext';

const { width: W } = Dimensions.get('window');
const IMG_H = 300;

const viewConfig = { viewAreaCoveragePercentThreshold: 50 };

const SlideItem = React.memo(function SlideItem({ uri }: { uri: string }) {
  return (
    <Image
      source={{ uri }}
      style={{ width: W, height: IMG_H }}
      contentFit="cover"
      cachePolicy="memory-disk"
    />
  );
});

const FullSlideItem = React.memo(function FullSlideItem({ uri }: { uri: string }) {
  return (
    <View style={{ width: W, flex: 1, justifyContent: 'center' }}>
      <Image
        source={{ uri }}
        style={{ width: W, height: W }}
        contentFit="contain"
        cachePolicy="memory-disk"
      />
    </View>
  );
});

const renderSlide = ({ item }: { item: string }) => <SlideItem uri={item} />;
const renderFullSlide = ({ item }: { item: string }) => <FullSlideItem uri={item} />;
const keyExt = (_: any, i: number) => String(i);

function Dot({ active }: { active: boolean }) {
  const w = useSharedValue(active ? 18 : 6);
  useEffect(() => {
    w.value = withSpring(active ? 18 : 6, { damping: 18, stiffness: 280 });
  }, [active]);
  const style = useAnimatedStyle(() => ({ width: w.value }));
  return (
    <Animated.View
      style={[s.dot, active ? s.dotActive : s.dotInactive, style]}
    />
  );
}

export interface BoatImageSwiperProps {
  images: string[];
  boatName: string;
  onBack: () => void;
  boat?: BoatData | null;
}

export default function BoatImageSwiper({ images, boatName, onBack, boat }: BoatImageSwiperProps) {
  const insets = useSafeAreaInsets();
  const [activeIdx, setActiveIdx] = useState(0);
  const [fsVisible, setFsVisible] = useState(false);

  const { openPicker }      = useWishlistPicker();
  const saved               = useWishlistStore((s) => boat ? (s.saved[boat.boat_id] ?? false) : false);
  const checkBoat           = useWishlistStore((s) => s.checkBoat);
  const removeBoatFromAll   = useWishlistStore((s) => s.removeBoatFromAll);
  const refreshBoat         = useWishlistStore((s) => s.refreshBoat);

  useEffect(() => {
    if (boat && useWishlistStore.getState().saved[boat.boat_id] === undefined) {
      checkBoat(boat.boat_id);
    }
  }, [boat?.boat_id]);

  const handleHeart = async () => {
    if (!boat) return;
    if (saved) {
      await removeBoatFromAll(boat.boat_id);
    } else {
      openPicker(boat, () => refreshBoat(boat.boat_id));
    }
  };

  const fsOpacity = useSharedValue(0);
  const fsStyle = useAnimatedStyle(() => ({ opacity: fsOpacity.value }));

  const openFs = useCallback(() => {
    fsOpacity.value = 0;
    setFsVisible(true);
    fsOpacity.value = withTiming(1, { duration: 150 });
  }, []);

  const closeFs = useCallback(() => {
    fsOpacity.value = withTiming(0, { duration: 120 }, (done) => {
      if (done) runOnJS(setFsVisible)(false);
    });
  }, []);

  const onViewChange = useCallback(({ viewableItems }: { viewableItems: any[] }) => {
    if (viewableItems[0]?.index != null) setActiveIdx(viewableItems[0].index);
  }, []);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Катер ${boatName} — аренда на rbs.rent`,
      });
    } catch {}
  };

  return (
    <>
      <View style={s.imageSection}>
        {images.length > 0 ? (
          <FlatList
            data={images}
            renderItem={renderSlide}
            keyExtractor={keyExt}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={onViewChange}
            viewabilityConfig={viewConfig}
            getItemLayout={(_, i) => ({ length: W, offset: W * i, index: i })}
            removeClippedSubviews
            initialNumToRender={1}
            maxToRenderPerBatch={2}
            windowSize={3}
          />
        ) : (
          <LinearGradient
            colors={[COLORS.brandNavy, COLORS.brandCyan]}
            style={{ width: W, height: IMG_H }}
          />
        )}

        <LinearGradient
          colors={['rgba(0,0,0,0.5)', 'transparent']}
          style={s.gradTop}
          pointerEvents="none"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.4)']}
          style={s.gradBottom}
          pointerEvents="none"
        />

        <Pressable
          style={[s.imgBtn, s.btnLeft, { top: insets.top + 8 }]}
          onPress={onBack}
          hitSlop={8}
        >
          <ArrowLeft size={20} color="#fff" strokeWidth={2.2} />
        </Pressable>

        {boat && (
          <Pressable
            style={[s.imgBtn, { top: insets.top + 8, right: 16 + 38 + 10 }]}
            onPress={handleHeart}
            hitSlop={8}
          >
            <Heart
              size={20}
              color={saved ? '#E63946' : '#fff'}
              fill={saved ? '#E63946' : 'transparent'}
              strokeWidth={2.2}
            />
          </Pressable>
        )}

        <Pressable
          style={[s.imgBtn, s.btnRight, { top: insets.top + 8 }]}
          onPress={handleShare}
          hitSlop={8}
        >
          <Share2 size={20} color="#fff" strokeWidth={2.2} />
        </Pressable>

        {images.length > 0 && (
          <Pressable style={s.zoomBtn} onPress={openFs} hitSlop={8}>
            <Maximize2 size={15} color="#fff" strokeWidth={2.2} />
          </Pressable>
        )}

        {images.length > 1 && (
          <View style={s.dotsRow} pointerEvents="none">
            {images.map((_, i) => (
              <Dot key={i} active={i === activeIdx} />
            ))}
          </View>
        )}
      </View>

      {/* FULLSCREEN OVERLAY */}
      {fsVisible && (
        <Animated.View style={[StyleSheet.absoluteFill, s.fsContainer, fsStyle]}>
          <FlatList
            data={images}
            renderItem={renderFullSlide}
            keyExtractor={keyExt}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={onViewChange}
            viewabilityConfig={viewConfig}
            getItemLayout={(_, i) => ({ length: W, offset: W * i, index: i })}
            initialScrollIndex={activeIdx}
            removeClippedSubviews
            initialNumToRender={1}
            maxToRenderPerBatch={2}
            windowSize={3}
          />
          <Text style={[s.fsCounter, { top: insets.top + 14 }]}>
            {activeIdx + 1} / {images.length}
          </Text>
          {images.length > 1 && (
            <View style={[s.dotsRow, { bottom: insets.bottom + 32 }]}>
              {images.map((_, i) => (
                <Dot key={i} active={i === activeIdx} />
              ))}
            </View>
          )}
          <Pressable
            style={[s.imgBtn, s.btnRight, { top: insets.top + 8 }]}
            onPress={closeFs}
            hitSlop={12}
          >
            <X size={20} color="#fff" strokeWidth={2.2} />
          </Pressable>
        </Animated.View>
      )}
    </>
  );
}

const s = StyleSheet.create({
  imageSection: { height: IMG_H, overflow: 'hidden' },
  gradTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 96 },
  gradBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 72 },

  imgBtn: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.38)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnLeft: { left: 16 },
  btnRight: { right: 16 },

  zoomBtn: {
    position: 'absolute',
    bottom: 44,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.38)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  dotsRow: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  dot: { height: 6, borderRadius: 3 },
  dotActive: { backgroundColor: '#fff' },
  dotInactive: { backgroundColor: 'rgba(255,255,255,0.42)' },

  fsContainer: { backgroundColor: '#000', justifyContent: 'center' },
  fsCounter: {
    position: 'absolute',
    alignSelf: 'center',
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    fontWeight: '500',
  },
});
