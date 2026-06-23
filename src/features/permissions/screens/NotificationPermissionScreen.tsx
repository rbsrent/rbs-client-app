import { useRouter } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { setOnboardingComplete } from '@/features/onboarding/hooks/useOnboardingComplete';
import { COLORS } from '@/shared/colors';

import { PermissionLayout } from '../components/PermissionLayout';
import { requestNotificationPermission } from '../hooks/useNotificationPermission';

function NotificationIllustration() {
  return (
    <View style={s.circle}>
      <Bell size={68} color={COLORS.brandCyan} strokeWidth={1.4} />
    </View>
  );
}

export function NotificationPermissionScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const goNext = useCallback(async () => {
    await setOnboardingComplete();
    router.replace('/permissions/auth-gate' as any);
  }, [router]);

  const allow = useCallback(async () => {
    setLoading(true);
    await requestNotificationPermission();
    setLoading(false);
    await goNext();
  }, [goNext]);

  return (
    <PermissionLayout
      illustration={<NotificationIllustration />}
      title={'Не пропустите\nлучшие предложения'}
      subtitle="Уведомим о скидках, подтверждении бронирования и готовности судна"
      primaryLabel="Разрешить уведомления"
      secondaryLabel="Позже"
      onPrimary={allow}
      onSecondary={goNext}
      primaryLoading={loading}
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
