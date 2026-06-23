import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

export type SoundPref = "default" | "silent";

const KEY_ENABLED = "@notif_enabled";
const KEY_SOUND = "@notif_sound";

export function useNotificationPrefs() {
  const [enabled, setEnabled] = useState(true);
  const [sound, setSound] = useState<SoundPref>("default");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    AsyncStorage.multiGet([KEY_ENABLED, KEY_SOUND]).then(([[, en], [, snd]]) => {
      if (en !== null) setEnabled(en === "true");
      if (snd !== null) setSound(snd as SoundPref);
    });
  }, []);

  const toggleEnabled = useCallback(async (value: boolean) => {
    setSaving(true);
    try {
      await AsyncStorage.setItem(KEY_ENABLED, String(value));
      setEnabled(value);
    } finally {
      setSaving(false);
    }
  }, []);

  const changeSound = useCallback(async (pref: SoundPref) => {
    setSaving(true);
    try {
      await AsyncStorage.setItem(KEY_SOUND, pref);
      setSound(pref);
    } finally {
      setSaving(false);
    }
  }, []);

  return { enabled, sound, saving, toggleEnabled, changeSound };
}
