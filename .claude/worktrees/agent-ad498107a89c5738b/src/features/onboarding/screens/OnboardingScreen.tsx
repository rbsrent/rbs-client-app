import { useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from 'react-native';

import { COLORS } from '@/shared/colors';

import { Dots } from '../components/Dots';
import { SlideItem } from '../components/SlideItem';
import { SLIDES } from '../data/slides';

export function OnboardingScreen() {
  const router = useRouter();
  const [active, setActive] = useState(0);
  const ref = useRef<FlatList>(null);

  const onViewable = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems[0]?.index != null) setActive(viewableItems[0].index);
    },
    [],
  );

  const goLogin = () => router.push('/auth');
  const goRegister = () => router.push('/auth');

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <Text style={styles.logo}>RBS.RENT</Text>
        {/* <Text style={styles.logoSub}>аренда катеров · СПб</Text> */}
      </View>

      <FlatList
        ref={ref}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(s) => s.id}
        renderItem={({ item }) => <SlideItem item={item} />}
        onViewableItemsChanged={onViewable}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        style={styles.list}
      />

      <Dots count={SLIDES.length} active={active} />

      <View style={styles.cta}>
        <Pressable
          onPress={goLogin}
          style={({ pressed }) => [styles.btnPrimary, pressed && { opacity: 0.85 }]}
        >
          <Text style={styles.btnPrimaryText}>Войти</Text>
        </Pressable>

        <Pressable
          onPress={goRegister}
          style={({ pressed }) => [styles.btnSecondary, pressed && { opacity: 0.7 }]}
        >
          <Text style={styles.btnSecondaryText}>
            Нет аккаунта?{'  '}
            <Text style={styles.btnSecondaryAccent}>Зарегистрироваться</Text>
          </Text>
        </Pressable>

        <Text style={styles.terms}>
          Продолжая, вы принимаете условия использования и политику конфиденциальности.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.white },

  topBar: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  logo: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.brandNavy,
    letterSpacing: 0.5,
  },
  logoSub: {
    fontSize: 12,
    color: COLORS.text3,
    marginTop: 2,
    letterSpacing: 0.3,
  },

  list: { flex: 1 },

  cta: {
    paddingHorizontal: 15,
    paddingBottom: 40,
    gap: 12,
  },
  btnPrimary: {
    height: 48,
    borderRadius: 20,
    backgroundColor: COLORS.brandNavy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.2,
  },
  btnSecondary: {
    height: 48,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.brandNavy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryText: {
    fontSize: 15,
    color: COLORS.text2,
  },
  btnSecondaryAccent: {
    color: COLORS.brandNavy,
    fontWeight: '700',
  },
  terms: {
    fontSize: 11,
    color: COLORS.text3,
    textAlign: 'center',
    lineHeight: 16,
  },
});
