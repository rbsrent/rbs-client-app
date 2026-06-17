import { useRouter } from 'expo-router';
import {
  Bell,
  CalendarCheck,
  ChevronRight,
  FileText,
  Gift,
  Heart,
  HelpCircle,
  Info,
  LogOut,
  MapPin,
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
import { useAuthStore } from '@/store/useAuthStore';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MenuItem {
  key: string;
  Icon: React.ComponentType<any>;
  label: string;
  sub?: string;
  onPress: () => void;
  danger?: boolean;
  badge?: string;
}

// ─── Menu item row ────────────────────────────────────────────────────────────

function MenuRow({ item }: { item: MenuItem }) {
  return (
    <Pressable
      style={({ pressed }) => [s.menuItem, pressed && { opacity: 0.6 }]}
      onPress={item.onPress}
    >
      <View style={s.menuIconWrap}>
        <item.Icon
          size={22}
          color={item.danger ? '#E63946' : '#000'}
          strokeWidth={1.8}
        />
      </View>
      <Text style={[s.menuLabel, item.danger && s.menuLabelDanger]}>
        {item.label}
      </Text>
      <ChevronRight size={18} color="#999" strokeWidth={2} />
    </Pressable>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

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

  // ── Not logged in ──────────────────────────────────────────────────────────
  if (!session) {
    return (
      <View style={[s.root, { paddingTop: insets.top }]}>
        <View style={s.topBar}>
          <Text style={s.pageTitle}>Профиль</Text>
        </View>
        <View style={s.emptyBox}>
          <View style={s.emptyAvatar}>
            <User size={44} color="#aaa" strokeWidth={1.2} />
          </View>
          <Text style={s.emptyName}>Войдите в аккаунт</Text>
          <Text style={s.emptySub}>Управляйте бронями, сертификатами и настройками</Text>
          <Pressable
            style={({ pressed }) => [s.loginBtn, pressed && { opacity: 0.85 }]}
            onPress={() => router.push('/auth' as any)}
          >
            <Text style={s.loginBtnText}>Войти</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── User data ──────────────────────────────────────────────────────────────
  const rawPhone = session.user?.phone ?? session.user?.user_metadata?.phone_number ?? '';
  const displayPhone = rawPhone
    ? `+7 ${rawPhone.slice(1, 4)} ${rawPhone.slice(4, 7)}-${rawPhone.slice(7, 9)}-${rawPhone.slice(9)}`
    : '';
  const name    = smsUser?.full_name ?? 'Пользователь';
  const initial = name.charAt(0).toUpperCase();

  const group1: MenuItem[] = [
    { key: 'settings', Icon: Settings,      label: 'Личные данные',      onPress: () => router.push('/profile/settings' as any) },
    { key: 'notif',    Icon: Bell,           label: 'Уведомления',        onPress: () => {} },
    { key: 'cert',     Icon: Gift,           label: 'Подарочные сертификаты', onPress: () => router.push('/certificates' as any) },
    { key: 'promo',    Icon: Tag,            label: 'Промокоды',          onPress: () => {} },
  ];

  const group2: MenuItem[] = [
    { key: 'piers',    Icon: MapPin,      label: 'Причалы',          onPress: () => router.push('/(tabs)/piers' as any) },
    { key: 'docs',     Icon: FileText,    label: 'Документы',        onPress: () => {} },
    { key: 'help',     Icon: HelpCircle,  label: 'Помощь',           onPress: () => {} },
    { key: 'about',    Icon: Info,        label: 'О приложении',     onPress: () => {} },
    { key: 'signout',  Icon: LogOut,      label: 'Выйти',            onPress: handleSignOut,  danger: true },
    { key: 'delete',   Icon: Trash2,      label: 'Удалить аккаунт',  onPress: () => {},       danger: true },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}>

        {/* Top bar: title + action buttons */}
        <View style={s.topBar}>
          <Text style={s.pageTitle}>Профиль</Text>
          <View style={s.topActions}>
            <Pressable style={({ pressed }) => [s.actionBtn, pressed && { opacity: 0.6 }]} onPress={() => router.push('/profile/settings' as any)}>
              <Settings size={18} color="#000" strokeWidth={1.8} />
            </Pressable>
            <Pressable style={({ pressed }) => [s.actionBtn, pressed && { opacity: 0.6 }]} onPress={() => {}}>
              <Send size={18} color="#000" strokeWidth={1.8} />
            </Pressable>
          </View>
        </View>

        {/* ── Profile card ───────────────────────────────────────────────── */}
        <View style={[s.card, s.profileCard]}>
          <View style={s.avatarWrap}>
            <Text style={s.avatarInitial}>{initial}</Text>
          </View>
          <View style={s.profileInfo}>
            <Text style={s.profileName}>{name}</Text>
            {displayPhone ? <Text style={s.profileSub}>{displayPhone}</Text> : null}
          </View>
        </View>

        {/* ── Two feature cards ──────────────────────────────────────────── */}
        <View style={s.featureRow}>
          {/* Card: Мои брони */}
          <Pressable
            style={({ pressed }) => [s.card, s.featureCard, pressed && { opacity: 0.88 }]}
            onPress={() => router.push('/(tabs)/bookings' as any)}
          >
            <View style={[s.featureImgWrap, { backgroundColor: '#EAF2FF' }]}>
              <CalendarCheck size={48} color={COLORS.brandNavy} strokeWidth={1.4} />
            </View>
            <Text style={s.featureLabel}>Мои брони</Text>
          </Pressable>

          {/* Card: Избранное (NEW badge — just added) */}
          <Pressable
            style={({ pressed }) => [s.card, s.featureCard, pressed && { opacity: 0.88 }]}
            onPress={() => router.push('/(tabs)/wishlist' as any)}
          >
            <View style={s.newBadge}>
              <Text style={s.newBadgeTxt}>NEW</Text>
            </View>
            <View style={[s.featureImgWrap, { backgroundColor: '#FFEEF0' }]}>
              <Heart size={48} color="#E63946" strokeWidth={1.4} />
            </View>
            <Text style={s.featureLabel}>Избранное</Text>
          </Pressable>
        </View>

        {/* ── Wide support card ──────────────────────────────────────────── */}
        <Pressable style={({ pressed }) => [s.card, s.wideCard, pressed && { opacity: 0.88 }]} onPress={() => {}}>
          <View style={s.wideIconWrap}>
            <Send size={26} color="#229ED9" strokeWidth={1.6} />
          </View>
          <View style={s.wideTextWrap}>
            <Text style={s.wideTitle}>Написать в поддержку</Text>
            <Text style={s.wideSub}>Telegram — быстрый ответ</Text>
          </View>
          <ChevronRight size={18} color="#999" strokeWidth={2} />
        </Pressable>

        {/* ── Menu group 1 ───────────────────────────────────────────────── */}
        <View style={s.menuSection}>
          {group1.map((item) => <MenuRow key={item.key} item={item} />)}
        </View>

        {/* Divider */}
        <View style={s.divider} />

        {/* ── Menu group 2 ───────────────────────────────────────────────── */}
        <View style={s.menuSection}>
          {group2.map((item) => <MenuRow key={item.key} item={item} />)}
        </View>

      </ScrollView>
    </View>
  );
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const CARD_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.12,
  shadowRadius: 24,
  elevation: 6,
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  pageTitle: { fontSize: 32, fontWeight: '500', color: '#000' },
  topActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#F2F2F2',
    alignItems: 'center', justifyContent: 'center',
  },

  // Card base
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    ...CARD_SHADOW,
  },

  // Profile card
  profileCard: {
    alignItems: 'center',
    marginHorizontal: 24,
    marginTop: 16,
    paddingVertical: 40,
    paddingHorizontal: 24,
    gap: 16,
  },
  avatarWrap: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: '#232323',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontSize: 48, fontWeight: '500', color: '#FFF' },
  profileInfo:   { alignItems: 'center', gap: 4 },
  profileName:   { fontSize: 28, fontWeight: '500', color: '#000', textAlign: 'center' },
  profileSub:    { fontSize: 14, fontWeight: '400', color: '#666', textAlign: 'center' },

  // Feature cards row
  featureRow: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginTop: 16,
    gap: 16,
  },
  featureCard: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 16,
    paddingHorizontal: 8,
    gap: 24,
  },
  featureImgWrap: {
    width: 112, height: 112, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
  },
  featureLabel: { fontSize: 16, fontWeight: '500', color: '#000', textAlign: 'center' },
  newBadge: {
    position: 'absolute', top: 10, right: 10,
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 8,
    // navy gradient approximated as solid
    backgroundColor: '#354668',
  },
  newBadgeTxt: { fontSize: 8, fontWeight: '500', color: '#FFF' },

  // Wide card
  wideCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 16,
  },
  wideIconWrap: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#E8F6FD',
    alignItems: 'center', justifyContent: 'center',
  },
  wideTextWrap: { flex: 1 },
  wideTitle:    { fontSize: 16, fontWeight: '500', color: '#000' },
  wideSub:      { fontSize: 12, fontWeight: '400', color: '#666', marginTop: 2 },

  // Menu
  menuSection: {
    marginHorizontal: 24,
    marginTop: 24,
    gap: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    gap: 16,
  },
  menuIconWrap: {
    width: 40, height: 40,
    alignItems: 'center', justifyContent: 'center',
  },
  menuLabel:       { flex: 1, fontSize: 16, fontWeight: '400', color: '#222' },
  menuLabelDanger: { color: '#E63946' },

  divider: {
    height: 1,
    backgroundColor: '#DDDDDD',
    marginHorizontal: 24,
    marginTop: 24,
  },

  // Empty state
  emptyBox: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: 12, paddingHorizontal: 32,
  },
  emptyAvatar: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#F2F2F2',
    alignItems: 'center', justifyContent: 'center',
  },
  emptyName:  { fontSize: 22, fontWeight: '600', color: '#000' },
  emptySub:   { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 21 },
  loginBtn: {
    marginTop: 8, height: 52, paddingHorizontal: 40,
    borderRadius: 16, backgroundColor: '#232323',
    alignItems: 'center', justifyContent: 'center',
  },
  loginBtnText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
});
