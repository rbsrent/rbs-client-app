import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { useCallback, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '@/shared/colors';

import { OnboardingDots } from '../components/OnboardingDots';
import { OnboardingSlide } from '../components/OnboardingSlide';
import { ONBOARDING_SLIDES } from '../data/slides';

const { width: SW } = Dimensions.get('window');

export function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [active, setActive] = useState(0);
  const listRef = useRef<FlatList>(null);

  const onViewable = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems[0]?.index != null) setActive(viewableItems[0].index);
    },
    [],
  );

  const proceed = useCallback(() => {
    router.replace('/permissions/location' as any);
  }, [router]);

  const goNext = useCallback(() => {
    const isLast = active === ONBOARDING_SLIDES.length - 1;
    if (isLast) {
      proceed();
    } else {
      listRef.current?.scrollToIndex({ index: active + 1, animated: true });
    }
  }, [active, proceed]);

  return (
    <View style={s.root}>
      <FlatList
        ref={listRef}
        data={ONBOARDING_SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <OnboardingSlide item={item} />}
        onViewableItemsChanged={onViewable}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        getItemLayout={(_, i) => ({ length: SW, offset: SW * i, index: i })}
        scrollEventThrottle={16}
        bounces={false}
        removeClippedSubviews={false}
      />

      <Pressable
        style={[s.skipBtn, { top: insets.top + 14 }]}
        onPress={proceed}
        hitSlop={12}
      >
        <X size={18} color="rgba(255,255,255,0.65)" strokeWidth={2.5} />
      </Pressable>

      <View style={[s.bottom, { paddingBottom: insets.bottom + 36 }]}>
        <OnboardingDots count={ONBOARDING_SLIDES.length} active={active} />

        <Pressable
          style={({ pressed }) => [s.btn, pressed && { opacity: 0.85 }]}
          onPress={goNext}
        >
          <Text style={s.btnTxt}>
            {active === ONBOARDING_SLIDES.length - 1 ? 'Начать' : 'Далее'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0D1421' },

  skipBtn: {
    position: 'absolute',
    right: 18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  bottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    gap: 22,
    alignItems: 'center',
  },

  btn: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.brandNavy,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  btnTxt: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.2,
  },
});
