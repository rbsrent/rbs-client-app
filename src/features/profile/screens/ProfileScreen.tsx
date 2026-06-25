import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import {
  Bell,
  CalendarCheck,
  ChevronRight,
  Gift,
  HelpCircle,
  LogOut,
  MapPin,
  MessageCircle,
  NotepadText,
  Phone,
  Send,
  Settings,
} from "lucide-react-native";
import { memo, useRef } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { COLORS } from "@/shared/colors";
import { SheetBackdrop } from "@/shared/components/SheetBackdrop";
import { useAuthStore } from "@/store/useAuthStore";

interface MenuItem {
  key: string;
  Icon: React.ComponentType<any>;
  label: string;
  sub?: string;
  onPress: () => void;
  danger?: boolean;
  badge?: string;
}

function MenuRow({ item }: { item: MenuItem }) {
  return (
    <Pressable
      style={({ pressed }) => [s.menuItem, pressed && { opacity: 0.6 }]}
      onPress={item.onPress}
    >
      <View style={s.menuIconWrap}>
        <item.Icon
          size={22}
          color={item.danger ? "#E63946" : "#000"}
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

export const ProfileScreen = memo(function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session, smsUser } = useAuthStore();
  const { signOut } = useAuth();
  const logoutSheetRef = useRef<BottomSheetModal>(null);
  const helpSheetRef = useRef<BottomSheetModal>(null);

  const helpContacts = [
    {
      label: "WhatsApp",
      Icon: MessageCircle,
      color: "#25D366",
      url: "https://wa.me/79810076500",
    },
    {
      label: "Telegram",
      Icon: Send,
      color: "#229ED9",
      url: "https://t.me/rentboat_spb",
    },
    {
      label: "MAX",
      Icon: MessageCircle,
      color: "#0077FF",
      url: "tel:+79810076500",
    },
    {
      label: "Позвонить",
      Icon: Phone,
      color: "#333333",
      url: "tel:+78124253360",
    },
  ] as const;

  const renderHelpSheet = () => (
    <BottomSheetModal
      ref={helpSheetRef}
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
        style={[s.helpSheetContent, { paddingBottom: insets.bottom + 24 }]}
      >
        <Text style={s.helpSheetTitle}>Связаться с нами</Text>
        <View style={s.helpBtnList}>
          {helpContacts.map((ch) => (
            <Pressable
              key={ch.label}
              style={({ pressed }) => [s.helpBtn, pressed && { opacity: 0.6 }]}
              onPress={() => Linking.openURL(ch.url)}
            >
              <ch.Icon size={20} color={ch.color} strokeWidth={1.8} />
              <Text style={s.helpBtnLabel}>{ch.label}</Text>
            </Pressable>
          ))}
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );

  const guestMenu: MenuItem[] = [
    {
      key: "rule",
      Icon: NotepadText,
      label: "Условия бронирования RBS",
      onPress: () => router.push("/booking/conditions" as any),
    },
    {
      key: "help",
      Icon: HelpCircle,
      label: "Помощь",
      onPress: () => helpSheetRef.current?.present(),
    },
  ];

  if (!session) {
    return (
      <View style={[s.root, { paddingTop: insets.top }]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}
        >
          <View style={s.topBar}>
            <Text style={s.pageTitle}>Профиль</Text>
          </View>

          <View style={s.guestBox}>
            <Text style={s.guestSub}>
              Чтобы быть в курсе всех скидок и не тратить время на заполнение
              полей
            </Text>
            <Pressable
              style={({ pressed }) => [
                s.loginBtn,
                pressed && { opacity: 0.85 },
              ]}
              onPress={() => router.push("/auth" as any)}
            >
              <Text style={s.loginBtnText}>Войдите или зарегистрируйтесь</Text>
            </Pressable>
          </View>

          <View style={s.divider} />

          <View style={s.menuSection}>
            {guestMenu.map((item) => (
              <MenuRow key={item.key} item={item} />
            ))}
          </View>

          <Text style={s.versionText}>
            Версия {Constants.expoConfig?.version ?? "2.0.0"}
          </Text>
        </ScrollView>

        {renderHelpSheet()}
      </View>
    );
  }

  const rawPhone =
    smsUser?.phone_number ??
    session.user?.phone ??
    session.user?.user_metadata?.phone_number ??
    "";
  const phoneDigits = rawPhone.replace(/\D/g, "");
  const local =
    phoneDigits.startsWith("7") || phoneDigits.startsWith("8")
      ? phoneDigits.slice(1)
      : phoneDigits;
  const displayPhone =
    local.length === 10
      ? `+7 (${local.slice(0, 3)}) ${local.slice(3, 6)}-${local.slice(6, 8)}-${local.slice(8)}`
      : "";
  const name = smsUser?.full_name ?? "Пользователь";
  const initial = name.charAt(0).toUpperCase();

  const group1: MenuItem[] = [
    {
      key: "settings",
      Icon: Settings,
      label: "Личные данные",
      onPress: () => router.push("/profile/settings" as any),
    },
    {
      key: "notif",
      Icon: Bell,
      label: "Уведомления",
      onPress: () => router.push("/profile/notifications" as any),
    },
    {
      key: "cert",
      Icon: Gift,
      label: "Подарочные сертификаты",
      onPress: () => router.push("/gift-cert" as any),
    },
    // { key: "promo", Icon: Tag, label: "Промокоды", onPress: () => {} },
    {
      key: "piers",
      Icon: MapPin,
      label: "Причалы",
      onPress: () => router.push("/piers" as any),
    },
  ];

  const group2: MenuItem[] = [
    {
      key: "rule",
      Icon: NotepadText,
      label: "Условия бронирования RBS",
      onPress: () => router.push("/booking/conditions" as any),
    },
    {
      key: "help",
      Icon: HelpCircle,
      label: "Помощь",
      onPress: () => helpSheetRef.current?.present(),
    },
    // { key: "about", Icon: Info, label: "О приложении", onPress: () => {} },
    {
      key: "signout",
      Icon: LogOut,
      label: "Выйти",
      onPress: () => logoutSheetRef.current?.present(),
      danger: true,
    },
  ];

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 10 }}
      >
        <View style={s.topBar}>
          <Text style={s.pageTitle}>Профиль</Text>
        </View>

        <View style={[s.card, s.profileCard]}>
          <View style={s.avatarWrap}>
            <Text style={s.avatarInitial}>{initial}</Text>
          </View>
          <View style={s.profileInfo}>
            <Text style={s.profileName}>{name}</Text>
            {displayPhone ? (
              <Text style={s.profileSub}>{displayPhone}</Text>
            ) : null}
          </View>
        </View>

        <View style={s.featureRow}>
          <Pressable
            style={({ pressed }) => [
              s.card,
              s.featureCard,
              pressed && { opacity: 0.88 },
            ]}
            onPress={() => router.push("/bookings" as any)}
          >
            <View style={[s.featureImgWrap, { backgroundColor: "#EAF2FF" }]}>
              <CalendarCheck
                size={48}
                color={COLORS.brandNavy}
                strokeWidth={1.4}
              />
            </View>
            <Text style={s.featureLabel}>Мои брони</Text>
          </Pressable>
        </View>

        <Pressable
          style={({ pressed }) => [
            s.card,
            s.wideCard,
            pressed && { opacity: 0.88 },
          ]}
          onPress={() => Linking.openURL("https://t.me/rentboat_spb?text=%D0%94%D0%BE%D0%B1%D1%80%D1%8B%D0%B9%20%D0%B4%D0%B5%D0%BD%D1%8C%2C%20%D0%BC%D0%B5%D0%BD%D1%8F%20%D0%B8%D0%BD%D1%82%D0%B5%D1%80%D0%B5%D1%81%D1%83%D0%B5%D1%82%20%D0%B0%D1%80%D0%B5%D0%BD%D0%B4%D0%B0%20%D0%BA%D0%B0%D1%82%D0%B5%D1%80%D0%B0%20%28%D1%8F%D1%85%D1%82%D1%8B%29%20RBS.RENT")}
        >
          <View style={s.wideIconWrap}>
            <Send size={26} color="#229ED9" strokeWidth={1.6} />
          </View>
          <View style={s.wideTextWrap}>
            <Text style={s.wideTitle}>Написать в поддержку</Text>
            <Text style={s.wideSub}>Telegram — быстрый ответ</Text>
          </View>
          <ChevronRight size={18} color="#999" strokeWidth={2} />
        </Pressable>

        <View style={s.menuSection}>
          {group1.map((item) => (
            <MenuRow key={item.key} item={item} />
          ))}
        </View>

        <View style={s.divider} />

        <View style={s.menuSection}>
          {group2.map((item) => (
            <MenuRow key={item.key} item={item} />
          ))}
        </View>

        <Text style={s.versionText}>
          Версия {Constants.expoConfig?.version ?? "2.0.0"}
        </Text>
      </ScrollView>

      {renderHelpSheet()}

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
        <BottomSheetView
          style={[s.sheetContent, { paddingBottom: insets.bottom + 16 }]}
        >
          <Text style={s.sheetTitle}>Выйти из аккаунта?</Text>
          <Pressable
            style={({ pressed }) => [
              s.sheetBtn,
              s.sheetBtnDanger,
              pressed && { opacity: 0.8 },
            ]}
            onPress={() => {
              logoutSheetRef.current?.dismiss();
              signOut();
            }}
          >
            <Text style={s.sheetBtnDangerTxt}>Выйти</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              s.sheetBtn,
              s.sheetBtnCancel,
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => logoutSheetRef.current?.dismiss()}
          >
            <Text style={s.sheetBtnCancelTxt}>Отмена</Text>
          </Pressable>
        </BottomSheetView>
      </BottomSheetModal>
    </View>
  );
});

const CARD_SHADOW = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.12,
  shadowRadius: 24,
  elevation: 6,
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFFFFF" },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  pageTitle: { fontSize: 32, fontWeight: "500", color: "#000" },
  topActions: { flexDirection: "row", gap: 8 },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    ...CARD_SHADOW,
  },

  profileCard: {
    alignItems: "center",
    marginHorizontal: 24,
    marginTop: 16,
    paddingVertical: 40,
    paddingHorizontal: 24,
    gap: 16,
  },
  avatarWrap: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#232323",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: { fontSize: 48, fontWeight: "500", color: "#FFF" },
  profileInfo: { alignItems: "center", gap: 4 },
  profileName: {
    fontSize: 28,
    fontWeight: "500",
    color: "#000",
    textAlign: "center",
  },
  profileSub: {
    fontSize: 14,
    fontWeight: "400",
    color: "#666",
    textAlign: "center",
  },

  featureRow: {
    flexDirection: "row",
    marginHorizontal: 24,
    marginTop: 16,
    gap: 16,
  },
  featureCard: {
    flex: 1,
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 16,
    paddingHorizontal: 8,
    gap: 24,
  },
  featureImgWrap: {
    width: 112,
    height: 112,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  featureLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
    textAlign: "center",
  },

  wideCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 24,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 16,
  },
  wideIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E8F6FD",
    alignItems: "center",
    justifyContent: "center",
  },
  wideTextWrap: { flex: 1 },
  wideTitle: { fontSize: 16, fontWeight: "500", color: "#000" },
  wideSub: { fontSize: 12, fontWeight: "400", color: "#666", marginTop: 2 },

  menuSection: {
    marginHorizontal: 24,
    marginTop: 24,
    gap: 16,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    height: 40,
    gap: 16,
  },
  menuIconWrap: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: { flex: 1, fontSize: 16, fontWeight: "400", color: "#222" },
  menuLabelDanger: { color: "#E63946" },

  divider: {
    height: 1,
    backgroundColor: "#DDDDDD",
    marginHorizontal: 24,
    marginTop: 24,
  },

  guestBox: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 16,
  },
  guestSub: { fontSize: 15, color: "#666", lineHeight: 22 },
  loginBtn: {
    height: 54,
    borderRadius: 14,
    backgroundColor: COLORS.brandNavy,
    alignItems: "center",
    justifyContent: "center",
  },
  loginBtnText: { fontSize: 16, fontWeight: "600", color: "#FFF" },

  versionText: {
    textAlign: "center",
    fontSize: 12,
    color: "#AAAAAA",
    marginTop: 24,
    marginBottom: 8,
  },

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
    color: COLORS.brandNavy,
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
  sheetBtnDanger: { backgroundColor: COLORS.brandNavy },
  sheetBtnDangerTxt: { fontSize: 16, fontWeight: "600", color: "#fff" },
  sheetBtnCancel: { backgroundColor: "#F2F2F2" },
  sheetBtnCancelTxt: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.brandNavy,
  },

  helpSheetContent: { paddingHorizontal: 16, paddingTop: 4 },
  helpSheetTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#000",
    textAlign: "center",
    marginBottom: 16,
  },
  helpBtnList: { gap: 10 },
  helpBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#F2F2F2",
    borderRadius: 14,
    paddingVertical: 16,
  },
  helpBtnLabel: { fontSize: 16, fontWeight: "500", color: "#000" },
});
