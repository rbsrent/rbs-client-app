import { BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import React, { memo, useCallback, useMemo, useRef } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { COLORS } from "@/shared/colors";
import { SheetBackdrop } from "@/shared/components/SheetBackdrop";

interface Service {
  key: string;
  label: string;
  icon: number;
  bg: string;
  route: string;
  badge?: string;
}

interface ServiceGroup {
  title: string;
  items: Service[];
}

const ALL: Service[] = [
  {
    key: "boat",
    label: "Катер",
    icon: require("../../../../assets/icons/motorboat.png"),
    bg: "",
    route: "/boats?type=boat",
  },
  {
    key: "yacht",
    label: "Яхта",
    icon: require("../../../../assets/icons/motor-yacht.png"),
    bg: "",
    route: "/boats?type=yacht",
  },
  {
    key: "ship",
    label: "Теплоход",
    icon: require("../../../../assets/icons/river-ship.png"),
    bg: "",
    route: "/services/teplokhod",
    badge: "Скоро",
  },
  {
    key: "routes",
    label: "Маршруты",
    icon: require("../../../../assets/icons/routes.png"),
    bg: "",
    route: "/routes",
  },
  {
    key: "piers",
    label: "Причалы",
    icon: require("../../../../assets/icons/piers.png"),
    bg: "",
    route: "/piers",
  },
  {
    key: "cert",
    label: "Сертификат",
    icon: require("../../../../assets/icons/certificate.png"),
    bg: "",
    route: "/gift-cert",
  },
  {
    key: "bookings",
    label: "Мои брони",
    icon: require("../../../../assets/icons/bookings.png"),
    bg: "",
    route: "/bookings",
  },
];

const HOME_ITEMS = ALL.slice(0, 4);

const GROUPS: ServiceGroup[] = [
  {
    title: "Мои брони",
    items: ALL.filter((s) => s.key === "bookings"),
  },
  {
    title: "Аренда судов",
    items: ALL.filter((s) => ["boat", "yacht"].includes(s.key)),
  },
  {
    title: "Круизы и прогулки",
    items: ALL.filter((s) => ["ship", "routes"].includes(s.key)),
  },
  {
    title: "Карта и причалы",
    items: ALL.filter((s) => ["piers", "catalog"].includes(s.key)),
  },
  {
    title: "Подарки",
    items: ALL.filter((s) => s.key === "cert"),
  },
];

const AnimPressable = Animated.createAnimatedComponent(Pressable);

const SheetHandle = () => (
  <View style={s.handleWrap}>
    <View style={s.handle} />
  </View>
);

const ServiceItem = memo(function ServiceItem({
  item,
  iconSize = 56,
  onPress,
}: {
  item: Service;
  iconSize?: number;
  onPress: (route: string) => void;
}) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimPressable
      style={[s.item, anim]}
      onPressIn={() => {
        scale.value = withSpring(0.91, { damping: 14 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 14 });
      }}
      onPress={() => onPress(item.route)}
    >
      <View style={{ width: iconSize, height: iconSize }}>
        <Image
          source={item.icon}
          style={{ width: iconSize, height: iconSize }}
          resizeMode="contain"
        />
        {item.badge ? (
          <View style={s.badge}>
            <Text style={s.badgeTxt}>{item.badge}</Text>
          </View>
        ) : null}
      </View>
      <Text style={s.label} numberOfLines={2}>
        {item.label}
      </Text>
    </AnimPressable>
  );
});

export const ServiceGrid = memo(function ServiceGrid() {
  const router = useRouter();
  const { bottom } = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheetModal>(null);
  const snaps = useMemo(() => ["80%"], []);

  const navigate = useCallback(
    (route: string) => {
      sheetRef.current?.dismiss();
      router.push(route as any);
    },
    [router],
  );

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        <View style={s.leadSpacer} />
        {HOME_ITEMS.map((item) => (
          <ServiceItem key={item.key} item={item} onPress={navigate} />
        ))}
        {/* Ещё */}
        <Pressable
          style={s.moreItem}
          onPress={() => sheetRef.current?.present()}
        >
          <View style={{ width: 56, height: 56 }}>
            <Image
              source={require("../../../../assets/icons/more.png")}
              style={{ width: 56, height: 56 }}
              resizeMode="contain"
            />
          </View>
          <Text style={s.label}>Ещё</Text>
        </Pressable>
        <View style={s.trailSpacer} />
      </ScrollView>

      {/* ── All services sheet ── */}
      <BottomSheetModal
        ref={sheetRef}
        snapPoints={snaps}
        enablePanDownToClose
        backdropComponent={SheetBackdrop}
        backgroundStyle={s.sheetBg}
        handleComponent={SheetHandle}
      >
        <BottomSheetScrollView
          contentContainerStyle={[s.sheetContent, { paddingBottom: bottom + 32 }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={s.sheetTitle}>Все услуги</Text>
          {GROUPS.map((group) => (
            <View key={group.title} style={s.group}>
              <Text style={s.groupTitle}>{group.title}</Text>
              <View style={s.groupGrid}>
                {group.items.map((item) => (
                  <ServiceItem
                    key={item.key}
                    item={item}
                    iconSize={52}
                    onPress={navigate}
                  />
                ))}
              </View>
            </View>
          ))}
        </BottomSheetScrollView>
      </BottomSheetModal>
    </>
  );
});

const s = StyleSheet.create({
  scrollContent: {
    alignItems: "center",
    paddingVertical: 4,
  },
  leadSpacer: { width: 16 },
  trailSpacer: { width: 8 },
  item: {
    width: 72,
    alignItems: "center",
    gap: 6,
    marginRight: 6,
  },
  moreItem: {
    width: 72,
    alignItems: "center",
    gap: 6,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: COLORS.red,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  badgeTxt: { color: "#fff", fontSize: 9, fontWeight: "700" },
  label: {
    fontSize: 11,
    color: COLORS.text1,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 15,
  },

  sheetBg: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  handleWrap: { alignItems: "center", paddingTop: 10, paddingBottom: 2 },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
  },
  sheetContent: { paddingHorizontal: 20 },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text1,
    marginBottom: 20,
    marginTop: 6,
  },
  group: { marginBottom: 24 },
  groupTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text2,
    marginBottom: 14,
  },
  groupGrid: { flexDirection: "row", flexWrap: "wrap", rowGap: 16 },
});
