import * as Notifications from 'expo-notifications';

export async function requestNotificationPermission(): Promise<'granted' | 'denied'> {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted' ? 'granted' : 'denied';
  } catch {
    return 'denied';
  }
}
