import { Stack } from 'expo-router';

export default function CatalogLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#fff' } }}>
      <Stack.Screen name="[id]" />
      <Stack.Screen name="text-modal" options={{ presentation: 'modal' }} />
      <Stack.Screen name="reviews"    options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}
