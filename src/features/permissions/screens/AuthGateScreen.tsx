import { useRouter } from 'expo-router';
import { Heart } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '@/shared/colors';

function HeartIllustration() {
  return (
    <View style={s.illustrationWrap}>
      <View style={s.heartCircle}>
        <Heart size={72} color={COLORS.error} fill={COLORS.error} strokeWidth={0} />
      </View>
    </View>
  );
}

export function AuthGateScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={s.root}>
      <View style={s.top}>
        <HeartIllustration />
        <View style={s.textBlock}>
          <Text style={s.title}>{'Ты почти внутри 👀'}</Text>
          <Text style={s.subtitle}>
            Войди, чтобы сохранить всё важное и ничего не потерять
          </Text>
        </View>
      </View>

      <View style={[s.cta, { paddingBottom: insets.bottom + 24 }]}>
        <Pressable
          style={({ pressed }) => [s.loginBtn, pressed && { opacity: 0.85 }]}
          onPress={() => router.push('/auth' as any)}
        >
          <Text style={s.loginTxt}>Войти</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [s.skipBtn, pressed && { opacity: 0.6 }]}
          onPress={() => router.replace('/(tabs)' as any)}
        >
          <Text style={s.skipTxt}>Пока просто посмотрю 👀</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.white,
    justifyContent: 'space-between',
  },
  top: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  illustrationWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#FEF0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text1,
    textAlign: 'center',
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.text2,
    textAlign: 'center',
    lineHeight: 22,
  },
  cta: {
    paddingHorizontal: 20,
    gap: 8,
  },
  loginBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginTxt: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.white,
  },
  skipBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipTxt: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text2,
  },
});
