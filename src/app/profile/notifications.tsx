import { useRouter } from "expo-router";
import { ArrowLeft, Check, ExternalLink } from "lucide-react-native";
import { useEffect } from "react";
import {
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { COLORS } from "@/shared/colors";
import {
  useNotificationPrefs,
  type SoundPref,
} from "@/shared/useNotificationPrefs";

const SOUND_OPTIONS: { value: SoundPref; label: string; sub: string }[] = [
  {
    value: "default",
    label: "По умолчанию",
    sub: "Стандартный звук уведомлений",
  },
  { value: "silent", label: "Без звука", sub: "Только вибрация" },
];

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { enabled, sound, saving, toggleEnabled, changeSound } =
    useNotificationPrefs();

  const mountProgress = useSharedValue(0);
  useEffect(() => {
    mountProgress.value = withTiming(1, {
      duration: 260,
      easing: Easing.inOut(Easing.ease),
    });
  }, []);
  const animContent = useAnimatedStyle(() => ({
    opacity: mountProgress.value,
    transform: [{ translateY: (1 - mountProgress.value) * 16 }],
  }));

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.topBar}>
        <Pressable
          style={({ pressed }) => [s.backBtn, pressed && { opacity: 0.6 }]}
          onPress={() => router.back()}
          hitSlop={8}
        >
          <ArrowLeft size={22} color="#000" strokeWidth={2} />
        </Pressable>
      </View>

      <Animated.ScrollView
        style={animContent}
        contentContainerStyle={[
          s.content,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.pageTitle}>Уведомления</Text>
        <Text style={s.pageSub}>
          Управляйте push-уведомлениями о новых бронях и статусах.
        </Text>

        <Text style={s.sectionLabel}>Push-уведомления</Text>
        <View style={s.card}>
          <View style={s.row}>
            <View style={s.rowLeft}>
              <Text style={s.rowLabel}>
                {enabled ? "Включены" : "Выключены"}
              </Text>
              <Text style={s.rowSub}>Новые брони и изменение статусов</Text>
            </View>
            <Switch
              value={enabled}
              onValueChange={toggleEnabled}
              disabled={saving}
              trackColor={{ false: COLORS.border, true: COLORS.brandCyan }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <Text style={s.sectionLabel}>Звук</Text>
        <View style={s.card}>
          {SOUND_OPTIONS.map((opt, i) => (
            <Pressable
              key={opt.value}
              style={({ pressed }) => [
                s.row,
                i < SOUND_OPTIONS.length - 1 && s.rowBorder,
                pressed && s.rowPressed,
              ]}
              onPress={() => changeSound(opt.value)}
            >
              <View style={s.rowLeft}>
                <Text style={s.rowLabel}>{opt.label}</Text>
                <Text style={s.rowSub}>{opt.sub}</Text>
              </View>
              {sound === opt.value && (
                <Check size={18} color={COLORS.brandCyan} strokeWidth={2.5} />
              )}
            </Pressable>
          ))}
        </View>

        <Text style={s.sectionLabel}>Дополнительно</Text>
        <View style={s.card}>
          <Pressable
            style={({ pressed }) => [s.row, pressed && s.rowPressed]}
            onPress={() => Linking.openSettings()}
          >
            <View style={s.rowLeft}>
              <Text style={s.rowLabel}>
                {Platform.OS === "ios" ? "Настройки iOS" : "Настройки Android"}
              </Text>
              <Text style={s.rowSub}>Управление разрешениями и рингтоном</Text>
            </View>
            <ExternalLink size={16} color={COLORS.text2} strokeWidth={1.8} />
          </Pressable>
        </View>

        <Text style={s.hint}>
          При отключении уведомлений вы не будете получать сообщения о новых
          бронях и изменениях статусов.
        </Text>
      </Animated.ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  content: { paddingHorizontal: 24, paddingTop: 8 },

  pageTitle: {
    fontSize: 32,
    fontWeight: "500",
    color: "#000",
    marginBottom: 8,
    marginTop: 16,
  },
  pageSub: {
    fontSize: 14,
    color: COLORS.text2,
    lineHeight: 20,
    marginBottom: 28,
  },

  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text1,
    marginBottom: 8,
    marginTop: 4,
  },

  card: {
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: COLORS.greyLight,
    marginBottom: 24,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  rowPressed: { backgroundColor: COLORS.muted },
  rowLeft: { flex: 1, marginRight: 12 },
  rowLabel: { fontSize: 15, fontWeight: "500", color: COLORS.text1 },
  rowSub: { fontSize: 13, color: COLORS.text2, marginTop: 2 },

  hint: { fontSize: 12, color: COLORS.text3, lineHeight: 18 },
});
