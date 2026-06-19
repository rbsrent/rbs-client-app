import * as Location from 'expo-location';

export async function requestLocationPermission(): Promise<'granted' | 'denied'> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted' ? 'granted' : 'denied';
  } catch {
    return 'denied';
  }
}
