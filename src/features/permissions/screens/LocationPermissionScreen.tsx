import { useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import { useCallback, useState } from 'react';

import { PermissionLayout } from '../components/PermissionLayout';
import { requestLocationPermission } from '../hooks/useLocationPermission';

function LocationIllustration() {
  return (
    <LottieView
      source={require('@/assets/animation/location.json')}
      autoPlay
      loop
      style={{ width: 200, height: 200 }}
    />
  );
}

export function LocationPermissionScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const allow = useCallback(async () => {
    setLoading(true);
    await requestLocationPermission();
    setLoading(false);
    router.replace('/permissions/notification' as any);
  }, [router]);

  const skip = useCallback(() => {
    router.replace('/permissions/notification' as any);
  }, [router]);

  return (
    <PermissionLayout
      illustration={<LocationIllustration />}
      title={'Разрешите определение\nместоположения'}
      subtitle="Поиск катеров и причалов поблизости станет быстрее и точнее"
      primaryLabel="Разрешить"
      secondaryLabel="Позже"
      onPrimary={allow}
      onSecondary={skip}
      primaryLoading={loading}
    />
  );
}

