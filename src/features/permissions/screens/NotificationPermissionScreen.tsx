import { useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import { useCallback, useState } from 'react';

import { setOnboardingComplete } from '@/features/onboarding/hooks/useOnboardingComplete';

import { PermissionLayout } from '../components/PermissionLayout';
import { requestNotificationPermission } from '../hooks/useNotificationPermission';

function NotificationIllustration() {
  return (
    <LottieView
      source={require('@/assets/animation/Notification.json')}
      autoPlay
      loop
      style={{ width: 200, height: 200 }}
    />
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

