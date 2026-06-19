import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '@/shared/colors';

const { height: SH } = Dimensions.get('window');
const MEDIA_H = SH * 0.5;

interface Props {
  illustration: React.ReactNode;
  title: string;
  subtitle: string;
  primaryLabel: string;
  secondaryLabel: string;
  onPrimary: () => void;
  onSecondary: () => void;
  primaryLoading?: boolean;
}

export function PermissionLayout({
  illustration,
  title,
  subtitle,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  primaryLoading,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={s.root}>
      <View style={[s.illustrationArea, { height: MEDIA_H }]}>
        {illustration}
      </View>

      <View style={s.content}>
        <Text style={s.title}>{title}</Text>
        <Text style={s.subtitle}>{subtitle}</Text>
      </View>

      <View style={[s.cta, { paddingBottom: insets.bottom + 24 }]}>
        <Pressable
          style={({ pressed }) => [s.primaryBtn, pressed && { opacity: 0.85 }]}
          onPress={onPrimary}
          disabled={primaryLoading}
        >
          <Text style={s.primaryTxt}>{primaryLabel}</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [s.secondaryBtn, pressed && { opacity: 0.55 }]}
          onPress={onSecondary}
        >
          <Text style={s.secondaryTxt}>{secondaryLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0D1421',
  },

  illustrationArea: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 16,
  },

  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 12,
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 22,
  },

  cta: {
    paddingHorizontal: 20,
    gap: 4,
  },
  primaryBtn: {
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.brandNavy,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  primaryTxt: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.2,
  },
  secondaryBtn: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryTxt: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '500',
  },
});
