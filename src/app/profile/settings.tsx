import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '@/shared/colors';
import { authSupabase } from '@/shared/supabase/authClient';
import { useAuthStore } from '@/store/useAuthStore';
import { Spinner } from '@/shared/components/Spinner';

export default function ProfileSettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { smsUser, setSmsUser } = useAuthStore();
  const [name, setName] = useState(smsUser?.full_name ?? '');
  const [email, setEmail] = useState(smsUser?.email ?? '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data } = await authSupabase.rpc('update_sms_client_profile', {
        p_full_name: name.trim() || null,
        p_email: email.trim() || null,
        p_preferred_promo_code: null,
      });
      if (data) setSmsUser(data);
      Alert.alert('Сохранено', 'Профиль обновлён');
    } catch (e: any) {
      Alert.alert('Ошибка', e?.message ?? 'Не удалось сохранить');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <ArrowLeft size={22} color={COLORS.text1} strokeWidth={2} />
          </Pressable>
          <Text style={styles.title}>Настройки профиля</Text>
          <View style={{ width: 22 }} />
        </View>
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
          <View style={styles.field}>
            <Text style={styles.label}>Имя</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Ваше имя"
              placeholderTextColor={COLORS.text3}
              returnKeyType="next"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="email@example.com"
              placeholderTextColor={COLORS.text3}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="done"
            />
          </View>
          <Pressable
            style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <Spinner color="#fff" trackColor="rgba(255,255,255,0.25)" />
            ) : (
              <Text style={styles.saveBtnText}>Сохранить</Text>
            )}
          </Pressable>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: COLORS.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: COLORS.text1 },
  content: { padding: 20, gap: 16 },
  field: { gap: 6 },
  label: { fontSize: 13, color: COLORS.text2, fontWeight: '500' },
  input: {
    backgroundColor: COLORS.backgroundAlt,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: COLORS.text1,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  saveBtn: {
    backgroundColor: COLORS.brandNavy,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});
