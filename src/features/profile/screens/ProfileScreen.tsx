import { useRouter } from 'expo-router';
import {
  CalendarCheck,
  Gift,
  HelpCircle,
  LogOut,
  Pencil,
  Send,
  Settings,
  Tag,
  Trash2,
  User,
} from 'lucide-react-native';
import { memo } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { COLORS } from '@/shared/colors';
import { ScreenHeader } from '@/shared/components/ScreenHeader';
import { useAuthStore } from '@/store/useAuthStore';

import { MenuItem, MenuRow } from '../components/MenuRow';

export const ProfileScreen = memo(function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session, smsUser } = useAuthStore();
  const { signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert('Выход', 'Вы уверены, что хотите выйти?', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Выйти', style: 'destructive', onPress: signOut },
    ]);
  };

  if (!session) {
    return (
      <View style={styles.root}>
        <ScreenHeader title="Профиль" />
        <View style={styles.emptyBox}>
          <View style={styles.emptyAvatar}>
            <User size={40} color={COLORS.text3} strokeWidth={1.5} />
          </View>
          <Text style={styles.emptyName}>Войдите в аккаунт</Text>
          <Text style={styles.emptySub}>Управляйте бронями, сертификатами и настройками</Text>
          <Pressable
            style={({ pressed }) => [styles.loginBtn, pressed && { opacity: 0.8 }]}
            onPress={() => router.push('/auth' as any)}
          >
            <Text style={styles.loginBtnText}>Войти</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const rawPhone = session.user?.phone ?? session.user?.user_metadata?.phone_number ?? '';
  const displayPhone = rawPhone
    ? `+7 ${rawPhone.slice(1, 4)} ${rawPhone.slice(4, 7)}-${rawPhone.slice(7, 9)}-${rawPhone.slice(9)}`
    : '';
  const name = smsUser?.full_name ?? 'Пользователь';
  const initial = name.charAt(0).toUpperCase();
  const tgUsername = smsUser?.telegram_username;

  const mainItems: MenuItem[] = [
    {
      key: 'bookings',
      Icon: CalendarCheck,
      label: 'Мои брони',
      sub: 'История и активные бронирования',
      onPress: () => router.push('/(tabs)/bookings' as any),
    },
    {
      key: 'cert',
      Icon: Gift,
      label: 'Подарочные сертификаты',
      onPress: () => router.push('/certificates' as any),
    },
    {
      key: 'promo',
      Icon: Tag,
      label: 'Промокоды',
      onPress: () => {},
    },
    {
      key: 'settings',
      Icon: Settings,
      label: 'Настройки профиля',
      onPress: () => router.push('/profile/settings' as any),
    },
    {
      key: 'help',
      Icon: HelpCircle,
      label: 'Помощь',
      onPress: () => {},
    },
  ];

  const dangerItems: MenuItem[] = [
    {
      key: 'signout',
      Icon: LogOut,
      label: 'Выйти',
      onPress: handleSignOut,
      danger: true,
    },
    {
      key: 'delete',
      Icon: Trash2,
      label: 'Удалить аккаунт',
      onPress: () => {},
      danger: true,
    },
  ];

  return (
    <View style={styles.root}>
      <ScreenHeader title="Профиль" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
      >
        {/* User info */}
        <View style={styles.userRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>{name}</Text>
            {displayPhone ? <Text style={styles.userPhone}>{displayPhone}</Text> : null}
            {tgUsername ? (
              <View style={styles.tgRow}>
                <Send size={11} color="#229ED9" strokeWidth={2} />
                <Text style={styles.tgText}>@{tgUsername}</Text>
              </View>
            ) : null}
          </View>

          <Pressable
            style={({ pressed }) => [styles.editBtn, pressed && { opacity: 0.6 }]}
            onPress={() => router.push('/profile/settings' as any)}
            hitSlop={8}
          >
            <Pencil size={18} color={COLORS.text2} strokeWidth={1.8} />
          </Pressable>
        </View>

        <View style={styles.divider} />

        {/* Main menu */}
        {mainItems.map((item, idx) => (
          <MenuRow
            key={item.key}
            item={item}
            last={idx === mainItems.length - 1}
          />
        ))}

        <View style={styles.sectionGap} />

        {/* Danger menu */}
        {dangerItems.map((item, idx) => (
          <MenuRow
            key={item.key}
            item={item}
            last={idx === dangerItems.length - 1}
          />
        ))}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  // User info
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.brandNavy,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
  },
  userInfo: {
    flex: 1,
    gap: 3,
  },
  userName: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text1,
    letterSpacing: 0.1,
  },
  userPhone: {
    fontSize: 13,
    color: COLORS.text2,
    fontWeight: '300',
    letterSpacing: 0.1,
  },
  tgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  tgText: {
    fontSize: 12,
    color: '#229ED9',
    fontWeight: '500',
  },
  editBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  divider: {
    height: 0.5,
    backgroundColor: 'rgba(0,0,0,0.15)',
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
  },

  sectionGap: {
    height: 8,
    backgroundColor: COLORS.backgroundAlt,
  },

  // Empty state
  emptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 32,
  },
  emptyAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text1,
  },
  emptySub: {
    fontSize: 14,
    color: COLORS.text2,
    textAlign: 'center',
    lineHeight: 20,
  },
  loginBtn: {
    marginTop: 8,
    height: 48,
    paddingHorizontal: 32,
    borderRadius: 16,
    backgroundColor: COLORS.brandNavy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
