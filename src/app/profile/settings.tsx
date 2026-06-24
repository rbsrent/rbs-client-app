import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { ArrowLeft, Trash2 } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { COLORS } from "@/shared/colors";
import { SheetBackdrop } from "@/shared/components/SheetBackdrop";
import { Spinner } from "@/shared/components/Spinner";
import { authSupabase } from "@/shared/supabase/authClient";
import { useAuthStore } from "@/store/useAuthStore";

export default function ProfileSettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { smsUser, setSmsUser, session, signOut } = useAuthStore();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(smsUser?.full_name ?? "");
  const [email, setEmail] = useState(smsUser?.email ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const deleteSheetRef = useRef<BottomSheetModal>(null);

  const TIMING = { duration: 260, easing: Easing.inOut(Easing.ease) };

  const mountProgress = useSharedValue(0);
  const editProgress = useSharedValue(0);

  useEffect(() => {
    mountProgress.value = withTiming(1, TIMING);
  }, []);

  useEffect(() => {
    editProgress.value = withTiming(editing ? 1 : 0, TIMING);
  }, [editing]);

  const animContent = useAnimatedStyle(() => ({
    opacity: mountProgress.value,
    transform: [{ translateY: (1 - mountProgress.value) * 16 }],
  }));

  const animReadOnly = useAnimatedStyle(() => ({
    opacity: interpolate(editProgress.value, [0, 0.5], [1, 0]),
    transform: [
      { translateY: interpolate(editProgress.value, [0, 1], [0, -6]) },
    ],
  }));

  const animInput = useAnimatedStyle(() => ({
    opacity: interpolate(editProgress.value, [0.4, 1], [0, 1]),
    transform: [
      { translateY: interpolate(editProgress.value, [0, 1], [8, 0]) },
    ],
  }));

  const animSaveBtn = useAnimatedStyle(() => ({
    opacity: editProgress.value,
    transform: [
      { translateY: interpolate(editProgress.value, [0, 1], [12, 0]) },
    ],
  }));

  const rawPhone =
    session?.user?.phone ?? session?.user?.user_metadata?.phone_number ?? "";
  const displayPhone = rawPhone
    ? `+7 ${rawPhone.slice(1, 4)} ${rawPhone.slice(4, 7)}-${rawPhone.slice(7, 9)}-${rawPhone.slice(9)}`
    : "—";

  const startEdit = () => {
    setName(smsUser?.full_name ?? "");
    setEmail(smsUser?.email ?? "");
    setEditing(true);
  };

  const cancelEdit = () => {
    setName(smsUser?.full_name ?? "");
    setEmail(smsUser?.email ?? "");
    setEditing(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await authSupabase.rpc("update_sms_client_profile", {
        p_full_name: name.trim() || null,
        p_email: email.trim() || null,
        p_preferred_promo_code: null,
      });
      if (error) throw error;
      if (smsUser) setSmsUser({ ...smsUser, full_name: name.trim() || null, email: email.trim() || null });
      setEditing(false);
    } catch (e: any) {
      Alert.alert("Ошибка", e?.message ?? "Не удалось сохранить");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    deleteSheetRef.current?.dismiss();
    try {
      await authSupabase.rpc("delete_sms_client_account");
    } catch {}
    signOut();
  };

  return (
    <KeyboardAvoidingView
      style={s.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[s.root, { paddingTop: insets.top }]}>
        {/* Top bar */}
        <View style={s.topBar}>
          <Pressable
            style={({ pressed }) => [s.backBtn, pressed && { opacity: 0.6 }]}
            onPress={() => router.back()}
            hitSlop={8}
          >
            <ArrowLeft size={22} color="#000" strokeWidth={2} />
          </Pressable>

          <View style={{ flex: 1 }} />

          <Pressable
            style={({ pressed }) => [s.editBtn, pressed && { opacity: 0.6 }]}
            onPress={editing ? cancelEdit : startEdit}
          >
            <Text style={s.editBtnTxt}>
              {editing ? "Отмена" : "Редактировать"}
            </Text>
          </Pressable>
        </View>

        <Animated.View style={animContent}>
          <Text style={s.pageTitle}>Личные данные</Text>
        </Animated.View>

        <Animated.View style={[s.flex, animContent]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              s.content,
              { paddingBottom: insets.bottom + 32 },
            ]}
            keyboardShouldPersistTaps="handled"
          >
            {/* Phone — always read-only */}
            <View style={s.field}>
              <Text style={s.label}>Телефон</Text>
              <View style={s.readOnlyBox}>
                <Text style={s.readOnlyText}>{displayPhone}</Text>
              </View>
            </View>

            {/* Name */}
            <View style={s.field}>
              <Text style={s.label}>Имя</Text>
              <View style={s.fieldBox}>
                <Animated.View
                  style={animReadOnly}
                  pointerEvents={editing ? "none" : "auto"}
                >
                  <View style={s.readOnlyBox}>
                    <Text
                      style={[
                        s.readOnlyText,
                        !smsUser?.full_name && s.readOnlyPlaceholder,
                      ]}
                    >
                      {smsUser?.full_name || "Не указано"}
                    </Text>
                  </View>
                </Animated.View>
                <Animated.View
                  style={[s.fieldOverlay, animInput]}
                  pointerEvents={editing ? "auto" : "none"}
                >
                  <TextInput
                    style={s.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Ваше имя"
                    placeholderTextColor={COLORS.text3}
                    returnKeyType="next"
                  />
                </Animated.View>
              </View>
            </View>

            {/* Email */}
            <View style={s.field}>
              <Text style={s.label}>Email</Text>
              <View style={s.fieldBox}>
                <Animated.View
                  style={animReadOnly}
                  pointerEvents={editing ? "none" : "auto"}
                >
                  <View style={s.readOnlyBox}>
                    <Text
                      style={[
                        s.readOnlyText,
                        !smsUser?.email && s.readOnlyPlaceholder,
                      ]}
                    >
                      {smsUser?.email || "Не указано"}
                    </Text>
                  </View>
                </Animated.View>
                <Animated.View
                  style={[s.fieldOverlay, animInput]}
                  pointerEvents={editing ? "auto" : "none"}
                >
                  <TextInput
                    style={s.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="email@example.com"
                    placeholderTextColor={COLORS.text3}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    returnKeyType="done"
                  />
                </Animated.View>
              </View>
            </View>

            {/* Save button */}
            <Animated.View
              style={animSaveBtn}
              pointerEvents={editing ? "auto" : "none"}
            >
              <Pressable
                style={({ pressed }) => [
                  s.saveBtn,
                  isSaving && s.saveBtnDisabled,
                  pressed && !isSaving && { opacity: 0.85 },
                ]}
                onPress={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Spinner color="#fff" trackColor="rgba(255,255,255,0.25)" />
                ) : (
                  <Text style={s.saveBtnText}>Сохранить</Text>
                )}
              </Pressable>
            </Animated.View>

            {/* Delete account — always visible at bottom */}
            <Pressable
              style={({ pressed }) => [
                s.deleteRow,
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => deleteSheetRef.current?.present()}
            >
              <Trash2 size={18} color="#E63946" strokeWidth={1.8} />
              <Text style={s.deleteRowText}>Удалить аккаунт</Text>
            </Pressable>
          </ScrollView>
        </Animated.View>

        {/* Delete confirmation sheet */}
        <BottomSheetModal
          ref={deleteSheetRef}
          enableDynamicSizing
          enablePanDownToClose
          backdropComponent={SheetBackdrop}
          backgroundStyle={s.sheetBg}
          handleComponent={() => (
            <View style={s.sheetHandle}>
              <View style={s.sheetBar} />
            </View>
          )}
        >
          <BottomSheetView
            style={[s.sheetContent, { paddingBottom: insets.bottom + 16 }]}
          >
            <Text style={s.sheetTitle}>Удалить аккаунт?</Text>
            <Text style={s.sheetSub}>
              Все данные будут безвозвратно удалены. Это действие нельзя
              отменить.
            </Text>
            <Pressable
              style={({ pressed }) => [
                s.sheetBtn,
                s.sheetBtnDelete,
                pressed && { opacity: 0.8 },
              ]}
              onPress={handleDeleteAccount}
            >
              <Text style={s.sheetBtnTxt}>Удалить</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                s.sheetBtn,
                s.sheetBtnCancel,
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => deleteSheetRef.current?.dismiss()}
            >
              <Text style={s.sheetBtnCancelTxt}>Отмена</Text>
            </Pressable>
          </BottomSheetView>
        </BottomSheetModal>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
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
  editBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.greyLight,
  },
  editBtnTxt: { fontSize: 14, fontWeight: "500", color: "#000" },

  pageTitle: {
    fontSize: 32,
    fontWeight: "500",
    color: "#000",
    paddingHorizontal: 24,
    marginTop: 16,
    marginBottom: 8,
  },

  content: { paddingHorizontal: 24, paddingTop: 16, gap: 16 },

  field: { gap: 6 },
  label: { fontSize: 13, color: COLORS.text2, fontWeight: "500" },
  fieldBox: { position: "relative" },
  fieldOverlay: { position: "absolute", top: 0, left: 0, right: 0 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: COLORS.text1,
    borderWidth: 1.5,
    borderColor: COLORS.brandNavy,
  },
  readOnlyBox: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: "#F5F5F5",
  },
  readOnlyText: { fontSize: 15, color: COLORS.text1 },
  readOnlyPlaceholder: { color: COLORS.text3 },

  saveBtn: {
    backgroundColor: COLORS.brandNavy,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  deleteRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    backgroundColor: COLORS.greyLight,
    borderRadius: 8
  },
  deleteRowText: { fontSize: 15, fontWeight: "500", color: "#E63946" },

  sheetBg: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  sheetHandle: { alignItems: "center", paddingTop: 12, paddingBottom: 4 },
  sheetBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#DDDDDD",
  },
  sheetContent: { paddingHorizontal: 24, paddingTop: 8, gap: 12 },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    textAlign: "center",
    marginBottom: 2,
  },
  sheetSub: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 4,
  },
  sheetBtn: { borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  sheetBtnDelete: { backgroundColor: "#E63946" },
  sheetBtnTxt: { fontSize: 16, fontWeight: "600", color: "#fff" },
  sheetBtnCancel: { backgroundColor: "#F2F2F2" },
  sheetBtnCancelTxt: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.brandNavy,
  },
});
