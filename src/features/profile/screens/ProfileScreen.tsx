import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import Constants from 'expo-constants';
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
  Trash2
} from 'lucide-react-native';
import { memo, useRef } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { COLORS } from '@/shared/colors';
import { SheetBackdrop } from '@/shared/components/SheetBackdrop';
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
  const logoutSheetRef = useRef<BottomSheetModal>(null);

  // ── Not logged in ──────────────────────────────────────────────────────────
  const guestMenu: MenuItem[] = [
    { key: 'help',   Icon: HelpCircle, label: 'Помощь',              onPress: () => {} },
    { key: 'about',  Icon: Info,       label: 'О приложении',        onPress: () => {} },
  ];

  if (!session) {
    return (
      <View style={[s.root, { paddingTop: insets.top }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}>
          <View style={s.topBar}>
            <Text style={s.pageTitle}>Профиль</Text>
          </View>

          <View style={s.guestBox}>
            <Text style={s.guestSub}>Войдите в аккаунт и начните планировать следующую поездку.</Text>
            <Pressable
              style={({ pressed }) => [s.loginBtn, pressed && { opacity: 0.85 }]}
              onPress={() => router.push('/auth' as any)}
            >
              <Text style={s.loginBtnText}>Войдите или зарегистрируйтесь</Text>
            </Pressable>
          </View>

          <View style={s.divider} />

          <View style={s.menuSection}>
            {guestMenu.map((item) => <MenuRow key={item.key} item={item} />)}
          </View>
        </ScrollView>
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
    { key: 'signout',  Icon: LogOut,      label: 'Выйти',            onPress: () => logoutSheetRef.current?.present(),  danger: true },
    { key: 'delete',   Icon: Trash2,      label: 'Удалить аккаунт',  onPress: () => {},       danger: true },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}>

        {/* Top bar: title + action buttons */}
        <View style={s.topBar}>
          <Text style={s.pageTitle}>Профиль</Text>
          {/* <View style={s.topActions}>
            <Pressable style={({ pressed }) => [s.actionBtn, pressed && { opacity: 0.6 }]} onPress={() => router.push('/profile/settings' as any)}>
              <Settings size={18} color="#000" strokeWidth={1.8} />
            </Pressable>
            <Pressable style={({ pressed }) => [s.actionBtn, pressed && { opacity: 0.6 }]} onPress={() => {}}>
              <Send size={18} color="#000" strokeWidth={1.8} />
            </Pressable>
          </View> */}
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

        <Text style={s.versionText}>
          Версия {Constants.expoConfig?.version ?? '2.0.0'}
        </Text>

      </ScrollView>

      {/* ── Logout action sheet ── */}
      <BottomSheetModal
        ref={logoutSheetRef}
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
        <BottomSheetView style={[s.sheetContent, { paddingBottom: insets.bottom + 16 }]}>
          <Text style={s.sheetTitle}>Выйти из аккаунта?</Text>
          <Text style={s.sheetSub}>Вы будете перенаправлены на главный экран.</Text>

          <Pressable
            style={({ pressed }) => [s.sheetBtn, s.sheetBtnDanger, pressed && { opacity: 0.8 }]}
            onPress={() => { logoutSheetRef.current?.dismiss(); signOut(); }}
          >
            <Text style={s.sheetBtnDangerTxt}>Выйти</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [s.sheetBtn, s.sheetBtnCancel, pressed && { opacity: 0.7 }]}
            onPress={() => logoutSheetRef.current?.dismiss()}
          >
            <Text style={s.sheetBtnCancelTxt}>Отмена</Text>
          </Pressable>
        </BottomSheetView>
      </BottomSheetModal>
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

  // Guest state (not logged in)
  guestBox: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 16,
  },
  guestSub: { fontSize: 15, color: '#666', lineHeight: 22 },
  loginBtn: {
    height: 54,
    borderRadius: 14,
    backgroundColor: '#000',
    alignItems: 'center', justifyContent: 'center',
  },
  loginBtnText: { fontSize: 16, fontWeight: '600', color: '#FFF' },

  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#AAAAAA',
    marginTop: 24,
    marginBottom: 8,
  },

  // logout sheet
  sheetBg:      { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  sheetHandle:  { alignItems: 'center', paddingTop: 12, paddingBottom: 4 },
  sheetBar:     { width: 36, height: 4, borderRadius: 2, backgroundColor: '#DDDDDD' },
  sheetContent: { paddingHorizontal: 24, paddingTop: 8, gap: 12 },
  sheetTitle:   { fontSize: 18, fontWeight: '700', color: '#000', textAlign: 'center', marginBottom: 2 },
  sheetSub:     { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 20, marginBottom: 4 },
  sheetBtn:     { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  sheetBtnDanger:    { backgroundColor: '#000' },
  sheetBtnDangerTxt: { fontSize: 16, fontWeight: '600', color: '#fff' },
  sheetBtnCancel:    { backgroundColor: '#F2F2F2' },
  sheetBtnCancelTxt: { fontSize: 16, fontWeight: '500', color: '#000' },
});
