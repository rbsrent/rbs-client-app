import { COLORS } from "@/shared/colors";
import { Image } from "expo-image";
import { X } from "lucide-react-native";
import React, { useCallback, useRef, useState } from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  FlatList,
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";
import Animated, {
  Easing,
  Extrapolation,
  SharedTransition,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const heroTransition = SharedTransition.duration(380).easing(
  Easing.bezier(0.35, 0, 0.25, 1) as any,
);

const { width: W, height: H } = Dimensions.get("window");
export const SWIPER_IMG_H = 400;

const viewConfig = { viewAreaCoveragePercentThreshold: 50 };

const SlideItem = React.memo(function SlideItem({ uri }: { uri: string }) {
  return (
    <Image
      source={{ uri }}
      style={{ width: W, height: SWIPER_IMG_H }}
      contentFit="cover"
      transition={{ duration: 200, effect: "cross-dissolve" }}
      cachePolicy="memory-disk"
    />
  );
});

const FullSlideItem = React.memo(function FullSlideItem({
  uri,
}: {
  uri: string;
}) {
  return (
    <View style={{ width: W, flex: 1, justifyContent: "center" }}>
      <Image
        source={{ uri }}
        style={{ width: W, height: W }}
        contentFit="contain"
        transition={{ duration: 200, effect: "cross-dissolve" }}
        cachePolicy="memory-disk"
      />
    </View>
  );
});

const renderSlide = ({ item }: { item: string }) => <SlideItem uri={item} />;
const renderFullSlide = ({ item }: { item: string }) => (
  <FullSlideItem uri={item} />
);
const keyExt = (_: any, i: number) => String(i);

export interface BoatImageSwiperProps {
  images: string[];
  previewUri?: string | null;
  onIndexChange?: (idx: number) => void;
  heroSharedTag?: string;
}

export default function BoatImageSwiper({
  images,
  previewUri,
  onIndexChange,
  heroSharedTag,
}: BoatImageSwiperProps) {
  const insets = useSafeAreaInsets();
  const [activeIdx, setActiveIdx] = useState(0);
  const [fsVisible, setFsVisible] = useState(false);
  const mainListRef = useRef<FlatList>(null);
  const activeIdxRef = useRef(0);
  const fsVisibleRef = useRef(false);

  const fsOpacity = useSharedValue(0);
  const dragY = useSharedValue(0);

  const fsStyle = useAnimatedStyle(() => ({
    opacity:
      fsOpacity.value *
      interpolate(dragY.value, [0, H * 0.4], [1, 0], Extrapolation.CLAMP),
    transform: [{ translateY: dragY.value }],
  }));

  const openFs = useCallback(() => {
    dragY.value = 0;
    fsOpacity.value = 0;
    fsVisibleRef.current = true;
    setFsVisible(true);
    fsOpacity.value = withTiming(1, { duration: 180 });
  }, []);

  const hideFsModal = useCallback(() => {
    fsVisibleRef.current = false;
    setFsVisible(false);
    dragY.value = 0;
  }, []);

  const closeFs = useCallback(() => {
    fsOpacity.value = withTiming(0, { duration: 150 }, (done) => {
      if (done) runOnJS(hideFsModal)();
    });
  }, [hideFsModal]);

  const panGesture = Gesture.Pan()
    .activeOffsetY([10, Infinity])
    .failOffsetX([-15, 15])
    .onUpdate((e) => {
      dragY.value = Math.max(0, e.translationY);
    })
    .onEnd((e) => {
      if (e.translationY > 100 || e.velocityY > 600) {
        // fly off with natural velocity + fade in parallel
        dragY.value = withSpring(H * 1.2, {
          velocity: e.velocityY,
          damping: 30,
          stiffness: 180,
          mass: 0.6,
        });
        fsOpacity.value = withTiming(0, { duration: 220 }, (done) => {
          if (done) runOnJS(hideFsModal)();
        });
      } else {
        dragY.value = withSpring(0, { damping: 16, stiffness: 200, mass: 0.6 });
      }
    });

  const onViewChange = useCallback(
    ({ viewableItems }: { viewableItems: any[] }) => {
      const idx = viewableItems[0]?.index;
      if (idx != null) {
        activeIdxRef.current = idx;
        setActiveIdx(idx);
        onIndexChange?.(idx);
        if (fsVisibleRef.current) {
          mainListRef.current?.scrollToIndex({ index: idx, animated: false });
        }
      }
    },
    [onIndexChange],
  );

  return (
    <>
      <Animated.View
        style={s.imageSection}
        {...(heroSharedTag
          ? {
              sharedTransitionTag: heroSharedTag,
              sharedTransitionStyle: heroTransition,
            }
          : {})}
      >
        {images.length > 0 ? (
          <Pressable onPress={openFs}>
            <FlatList
              ref={mainListRef}
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
          <View
            style={{
              width: W,
              height: SWIPER_IMG_H,
              backgroundColor: "#C8D0D8",
            }}
          />
        )}

        {images.length > 1 && (
          <View style={s.counterBadge}>
            <Text style={s.counterTxt}>
              {activeIdx + 1} / {images.length}
            </Text>
          </View>
        )}
      </Animated.View>

      <Modal
        visible={fsVisible}
        transparent
        statusBarTranslucent
        animationType="none"
        onRequestClose={closeFs}
      >
        <StatusBar hidden />
        <Animated.View
          style={[StyleSheet.absoluteFill, s.fsContainer, fsStyle]}
        >
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
          {/* drag zone: absolute top — does not overlap FlatList touch area */}
          <GestureDetector gesture={panGesture}>
            <View style={[s.fsDragZone, { height: insets.top + 64 }]} />
          </GestureDetector>
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
  imageSection: { height: SWIPER_IMG_H, overflow: "hidden" },

  counterBadge: {
    position: "absolute",
    bottom: 54,
    right: 16,
    backgroundColor: COLORS.carcoal,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  counterTxt: { color: "#fff", fontSize: 11, fontWeight: "500" },

  fsContainer: { backgroundColor: "#000", justifyContent: "center" },
  fsDragZone: { position: "absolute", top: 0, left: 0, right: 0 },
  fsCounter: {
    position: "absolute",
    alignSelf: "center",
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    fontWeight: "500",
  },
  fsClose: {
    position: "absolute",
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
});
