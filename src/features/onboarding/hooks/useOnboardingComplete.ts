import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@rbs/onboarding_complete';

export async function getOnboardingComplete(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(KEY);
    return v === 'true';
  } catch {
    return false;
  }
}

export async function setOnboardingComplete(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, 'true');
  } catch {}
}
