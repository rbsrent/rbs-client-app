import { useRouter } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import { setOnboardingComplete } from '@/features/onboarding/hooks/useOnboardingComplete';
import { COLORS } from '@/shared/colors';

import { PermissionLayout } from '../components/PermissionLayout';

function NotificationIllustration() {
  return (
    <View style={s.circle}>
      <Bell size={68} color={COLORS.brandCyan} strokeWidth={1.4} />
    </View>
  );
}

export function NotificationPermissionScreen() {
  const router = useRouter();

  const finish = useCallback(async () => {
    await setOnboardingComplete();
    router.replace('/(tabs)');
  }, [router]);

  return (
    <PermissionLayout
      illustration={<NotificationIllustration />}
      title={'Не пропустите\nлучшие предложения'}
      subtitle="Уведомим о скидках, подтверждении бронирования и готовности судна"
      primaryLabel="Разрешить уведомления"
      secondaryLabel="Позже"
      onPrimary={finish}
      onSecondary={finish}
    />
  );
}

const s = StyleSheet.create({
  circle: {
    width: 148,
    height: 148,
    borderRadius: 74,
    backgroundColor: 'rgba(43,196,229,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
