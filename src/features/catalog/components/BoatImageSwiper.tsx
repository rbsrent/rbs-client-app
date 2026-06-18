import { Image } from 'expo-image';
import { X } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: W } = Dimensions.get('window');
export const SWIPER_IMG_H = 400;

const viewConfig = { viewAreaCoveragePercentThreshold: 50 };

const SlideItem = React.memo(function SlideItem({ uri }: { uri: string }) {
  return (
    <Image
      source={{ uri }}
      style={{ width: W, height: SWIPER_IMG_H }}
      contentFit="cover"
      transition={{ duration: 200, effect: 'cross-dissolve' }}
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
        transition={{ duration: 200, effect: 'cross-dissolve' }}
        cachePolicy="memory-disk"
      />
    </View>
  );
});

const renderSlide     = ({ item }: { item: string }) => <SlideItem uri={item} />;
const renderFullSlide = ({ item }: { item: string }) => <FullSlideItem uri={item} />;
const keyExt          = (_: any, i: number) => String(i);

export interface BoatImageSwiperProps {
  images:         string[];
  previewUri?:    string | null;
  onIndexChange?: (idx: number) => void;
}

export default function BoatImageSwiper({ images, previewUri, onIndexChange }: BoatImageSwiperProps) {
  const insets = useSafeAreaInsets();
  const [activeIdx, setActiveIdx] = useState(0);
  const [fsVisible, setFsVisible] = useState(false);

  const fsOpacity = useSharedValue(0);
  const fsStyle   = useAnimatedStyle(() => ({ opacity: fsOpacity.value }));

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
    const idx = viewableItems[0]?.index;
    if (idx != null) {
      setActiveIdx(idx);
      onIndexChange?.(idx);
    }
  }, [onIndexChange]);

  return (
    <>
      <View style={s.imageSection}>
        {images.length > 0 ? (
          <Pressable onPress={openFs}>
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
              scrollEventThrottle={16}
            />
          </Pressable>
        ) : previewUri ? (
          <Image
            source={{ uri: previewUri }}
            style={{ width: W, height: SWIPER_IMG_H }}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={{ width: W, height: SWIPER_IMG_H, backgroundColor: '#C8D0D8' }} />
        )}

        {images.length > 1 && (
          <View style={s.counterBadge}>
            <Text style={s.counterTxt}>{activeIdx + 1} / {images.length}</Text>
          </View>
        )}
      </View>

      <Modal
        visible={fsVisible}
        transparent
        statusBarTranslucent
        animationType="none"
        onRequestClose={closeFs}
      >
        <StatusBar hidden />
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
          <Pressable
            style={[s.fsClose, { top: insets.top + 12, right: 16 }]}
            onPress={closeFs}
            hitSlop={12}
          >
            <X size={18} color="#fff" strokeWidth={2.5} />
          </Pressable>
        </Animated.View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  imageSection: { height: SWIPER_IMG_H, overflow: 'hidden' },

  counterBadge: {
    position: 'absolute',
    bottom: 54, right: 16,
    backgroundColor: '#282F37',
    borderRadius: 4,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  counterTxt: { color: '#fff', fontSize: 11, fontWeight: '500' },

  fsContainer: { backgroundColor: '#000', justifyContent: 'center' },
  fsCounter: {
    position: 'absolute',
    alignSelf: 'center',
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    fontWeight: '500',
  },
  fsClose: {
    position: 'absolute',
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
});
