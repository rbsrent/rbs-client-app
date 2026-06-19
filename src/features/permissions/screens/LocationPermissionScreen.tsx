import { useRouter } from 'expo-router';
import { MapPin } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { COLORS } from '@/shared/colors';

import { PermissionLayout } from '../components/PermissionLayout';
import { requestLocationPermission } from '../hooks/useLocationPermission';

function LocationIllustration() {
  return (
    <View style={s.circle}>
      <MapPin size={68} color={COLORS.brandCyan} strokeWidth={1.4} />
    </View>
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
