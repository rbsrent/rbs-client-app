import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import {
  Anchor,
  Gift,
  Grid2x2,
  Map,
  MapPin,
  MoreHorizontal,
  Sailboat,
  Ship,
} from 'lucide-react-native';
import React, { memo, useCallback, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { COLORS } from '@/shared/colors';
import { SheetBackdrop } from '@/shared/components/SheetBackdrop';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Service {
  key: string;
  label: string;
  icon: React.ReactNode;
  bg: string;
  route: string;
  badge?: string;
}

interface ServiceGroup {
  title: string;
  items: Service[];
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const ALL: Service[] = [
  {
    key: 'boat',
    label: 'Катер',
    icon: <Anchor size={22} color="#1A5C72" strokeWidth={2} />,
    bg: '#D0F2FB',
    route: '/boats?type=boat',
  },
  {
    key: 'yacht',
    label: 'Яхта',
    icon: <Sailboat size={22} color="#4B2CA0" strokeWidth={2} />,
    bg: '#E8E3FF',
    route: '/boats?type=yacht',
    badge: 'Хит',
  },
  {
    key: 'ship',
    label: 'Теплоход',
    icon: <Ship size={22} color="#8B1A60" strokeWidth={2} />,
    bg: '#FAE3F5',
    route: '/cruises',
  },
  {
    key: 'routes',
    label: 'Маршруты',
    icon: <Map size={22} color="#155A38" strokeWidth={2} />,
    bg: '#D4F5E7',
    route: '/routes',
  },
  {
    key: 'cert',
    label: 'Сертификат',
    icon: <Gift size={22} color="#0F4D8A" strokeWidth={2} />,
    bg: '#D6EAFF',
    route: '/certificates',
  },
  {
    key: 'piers',
    label: 'Причалы',
    icon: <MapPin size={22} color="#7A3500" strokeWidth={2} />,
    bg: '#FFE8D6',
    route: '/(tabs)/piers',
  },
  {
    key: 'catalog',
    label: 'Каталог',
    icon: <Grid2x2 size={22} color="#1B2A41" strokeWidth={2} />,
    bg: '#DDE3EC',
    route: '/boats',
  },
];

// 4 per row × 2 rows = 8 slots; last slot = "Ещё"
const HOME_ITEMS = ALL.slice(0, 7);

const GROUPS: ServiceGroup[] = [
  {
    title: 'Аренда судов',
    items: ALL.filter((s) => ['boat', 'yacht'].includes(s.key)),
  },
  {
    title: 'Круизы и прогулки',
    items: ALL.filter((s) => ['ship', 'routes'].includes(s.key)),
  },
  {
    title: 'Карта и причалы',
    items: ALL.filter((s) => ['piers', 'catalog'].includes(s.key)),
  },
  {
    title: 'Подарки',
    items: ALL.filter((s) => s.key === 'cert'),
  },
];

// ─── ServiceItem ──────────────────────────────────────────────────────────────

const AnimPressable = Animated.createAnimatedComponent(Pressable);

function ServiceItem({
  item,
  iconSize = 62,
  onPress,
}: {
  item: Service;
  iconSize?: number;
  onPress: (route: string) => void;
}) {
  const scale = useSharedValue(1);
  const anim  = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimPressable
      style={[s.item, anim]}
      onPressIn={() => { scale.value = withSpring(0.91, { damping: 14 }); }}
      onPressOut={() => { scale.value = withSpring(1,    { damping: 14 }); }}
      onPress={() => onPress(item.route)}
    >
      <View style={[s.iconBox, { width: iconSize, height: iconSize, borderRadius: iconSize * 0.26, backgroundColor: item.bg }]}>
        {item.icon}
        {item.badge ? (
          <View style={s.badge}><Text style={s.badgeTxt}>{item.badge}</Text></View>
        ) : null}
      </View>
      <Text style={s.label} numberOfLines={2}>{item.label}</Text>
    </AnimPressable>
  );
}

// ─── ServiceGrid ──────────────────────────────────────────────────────────────

export const ServiceGrid = memo(function ServiceGrid() {
  const router   = useRouter();
  const sheetRef = useRef<BottomSheetModal>(null);
  const snaps    = useMemo(() => ['80%'], []);

  const navigate = useCallback((route: string) => {
    sheetRef.current?.dismiss();
    router.push(route as any);
  }, [router]);

  return (
    <>
      <View style={s.grid}>
        {HOME_ITEMS.map((item) => (
          <ServiceItem key={item.key} item={item} onPress={navigate} />
        ))}

        {/* Ещё */}
        <Pressable style={s.item} onPress={() => sheetRef.current?.present()}>
          <View style={[s.iconBox, s.moreBox, { width: 60, height: 60, borderRadius: 17 }]}>
            <MoreHorizontal size={24} color={COLORS.text2} strokeWidth={2} />
          </View>
          <Text style={s.label}>Ещё</Text>
        </Pressable>
      </View>

      {/* ── All services sheet ── */}
      <BottomSheetModal
        ref={sheetRef}
        snapPoints={snaps}
        enablePanDownToClose
        backdropComponent={SheetBackdrop}
        backgroundStyle={s.sheetBg}
        handleComponent={() => (
          <View style={s.handleWrap}>
            <View style={s.handle} />
          </View>
        )}
      >
        <BottomSheetScrollView
          contentContainerStyle={s.sheetContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={s.sheetTitle}>Все услуги</Text>
          {GROUPS.map((group) => (
            <View key={group.title} style={s.group}>
              <Text style={s.groupTitle}>{group.title}</Text>
              <View style={s.groupGrid}>
                {group.items.map((item) => (
                  <ServiceItem key={item.key} item={item} iconSize={52} onPress={navigate} />
                ))}
              </View>
            </View>
          ))}
        </BottomSheetScrollView>
      </BottomSheetModal>
    </>
  );
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 16,
  },
  item: {
    width: '25%',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 2,
  },
  iconBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreBox: {
    backgroundColor: COLORS.muted,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  badge: {
    position: 'absolute', top: -4, right: -4,
    backgroundColor: COLORS.warning,
    borderRadius: 6, paddingHorizontal: 5, paddingVertical: 1,
  },
  badgeTxt: { color: '#fff', fontSize: 9, fontWeight: '700' },
  label: {
    fontSize: 11, color: COLORS.text1,
    fontWeight: '500', textAlign: 'center', lineHeight: 15,
  },

  sheetBg:      { backgroundColor: COLORS.white, borderTopLeftRadius: 22, borderTopRightRadius: 22 },
  handleWrap:   { alignItems: 'center', paddingTop: 10, paddingBottom: 2 },
  handle:       { width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.border },
  sheetContent: { paddingHorizontal: 20, paddingBottom: 48 },
  sheetTitle:   { fontSize: 20, fontWeight: '800', color: COLORS.text1, marginBottom: 20, marginTop: 6 },
  group:        { marginBottom: 24 },
  groupTitle:   { fontSize: 13, fontWeight: '700', color: COLORS.text2, marginBottom: 14 },
  groupGrid:    { flexDirection: 'row', flexWrap: 'wrap', rowGap: 16 },
});
