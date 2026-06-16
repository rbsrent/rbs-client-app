import { Stack } from 'expo-router';

import { ProfileScreen } from '@/features/profile/screens/ProfileScreen';

export default function ProfilePage() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ProfileScreen />
    </>
  );
}
