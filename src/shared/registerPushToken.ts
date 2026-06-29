import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { authSupabase } from './supabase/authClient';

export async function registerPushToken(): Promise<string | null> {
  if (!Device.isDevice) return null;
  // Remote push not supported in Expo Go since SDK 53
  if (Constants.appOwnership === 'expo') return null;

  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#208AEF',
    });
  }

  const projectId =
    Constants.easConfig?.projectId ??
    (Constants.expoConfig?.extra?.eas?.projectId as string | undefined);

  if (!projectId) {
    if (__DEV__) console.warn('[Push] No EAS projectId — run `eas init`');
    return null;
  }

  const { data: pushToken } = await Notifications.getExpoPushTokenAsync({ projectId });

  const { data: { user } } = await authSupabase.auth.getUser();
  if (!user) return null;

  await authSupabase.from('push_tokens').upsert(
    {
      user_id: user.id,
      token: pushToken,
      platform: Platform.OS,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,platform' },
  );

  return pushToken;
}
