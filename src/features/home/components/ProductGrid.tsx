import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { LinearGradient } from 'expo-linear-gradient';
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
  gradient: [string, string];
  route: string;
  badge?: string;
}

interface ServiceGroup {
  title: string;
  items: Service[];
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const ALL_SERVICES: Service[] = [
  {
    key: 'boat',
    label: 'Катер',
    icon: <Anchor size={24} color="#fff" strokeWidth={1.8} />,
    gradient: [COLORS.brandCyan, '#1AAFD0'],
    route: '/boats?type=boat',
  },
  {
    key: 'yacht',
    label: 'Яхта',
    icon: <Sailboat size={24} color="#fff" strokeWidth={1.8} />,
    gradient: [COLORS.brandViolet, '#5B3EC6'],
    route: '/boats?type=yacht',
    badge: 'Хит',
  },
  {
    key: 'ship',
    label: 'Теплоход',
    icon: <Ship size={24} color="#fff" strokeWidth={1.8} />,
    gradient: [COLORS.brandMagenta, '#C040A0'],
    route: '/cruises',
  },
  {
    key: 'routes',
    label: 'Маршруты',
    icon: <Map size={24} color="#fff" strokeWidth={1.8} />,
    gradient: ['#25A077', '#1A7055'],
    route: '/routes',
  },
  {
    key: 'cert',
    label: 'Сертификат',
    icon: <Gift size={24} color="#fff" strokeWidth={1.8} />,
    gradient: [COLORS.brandBlue, '#1570C0'],
    route: '/certificates',
  },
  {
    key: 'piers',
    label: 'Причалы',
    icon: <MapPin size={24} color="#fff" strokeWidth={1.8} />,
    gradient: ['#E8832A', '#C46A1A'],
    route: '/(tabs)/piers',
  },
  {
    key: 'catalog',
    label: 'Каталог',
    icon: <Grid2x2 size={24} color="#fff" strokeWidth={1.8} />,
    gradient: [COLORS.brandNavy, '#253D5A'],
    route: '/boats',
  },
];

// Sorted by business priority: highest booking volume / revenue first
const HOME_SERVICES = [
  ALL_SERVICES.find((s) => s.key === 'boat')!,
  ALL_SERVICES.find((s) => s.key === 'yacht')!,
  ALL_SERVICES.find((s) => s.key === 'ship')!,
  ALL_SERVICES.find((s) => s.key === 'routes')!,
  ALL_SERVICES.find((s) => s.key === 'cert')!,
  ALL_SERVICES.find((s) => s.key === 'piers')!,
  ALL_SERVICES.find((s) => s.key === 'catalog')!,
];

const GROUPS: ServiceGroup[] = [
  {
    title: 'Аренда судов',
    items: ALL_SERVICES.filter((s) => ['boat', 'yacht'].includes(s.key)),
  },
  {
    title: 'Круизы и прогулки',
    items: ALL_SERVICES.filter((s) => ['ship', 'routes'].includes(s.key)),
  },
  {
    title: 'Причалы и карта',
    items: ALL_SERVICES.filter((s) => ['piers', 'catalog'].includes(s.key)),
  },
  {
    title: 'Подарки',
    items: ALL_SERVICES.filter((s) => ['cert'].includes(s.key)),
  },
];

// ─── ServiceItem ──────────────────────────────────────────────────────────────

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function ServiceItem({
  service,
  size = 'md',
  onPress,
}: {
  service: Service;
  size?: 'md' | 'sm';
  onPress: (route: string) => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const iconSize  = size === 'sm' ? 52 : 60;

  return (
    <AnimatedPressable
      style={[s.item, size === 'sm' && s.itemSm, animStyle]}
      onPressIn={() => { scale.value = withSpring(0.92, { damping: 14 }); }}
      onPressOut={() => { scale.value = withSpring(1,    { damping: 14 }); }}
      onPress={() => onPress(service.route)}
    >
      <LinearGradient
        colors={service.gradient}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[s.iconBox, { width: iconSize, height: iconSize, borderRadius: iconSize * 0.28 }]}
      >
        {service.icon}
        {service.badge ? (
          <View style={s.badge}>
            <Text style={s.badgeTxt}>{service.badge}</Text>
          </View>
        ) : null}
      </LinearGradient>
      <Text style={[s.label, size === 'sm' && s.labelSm]} numberOfLines={2}>
        {service.label}
      </Text>
    </AnimatedPressable>
  );
}

// ─── ProductGrid ──────────────────────────────────────────────────────────────

export const ProductGrid = memo(function ProductGrid() {
  const router   = useRouter();
  const sheetRef = useRef<BottomSheetModal>(null);
  const snaps    = useMemo(() => ['75%'], []);

  const navigate = useCallback((route: string) => {
    sheetRef.current?.dismiss();
    router.push(route as any);
  }, [router]);

  const openMore = useCallback(() => {
    sheetRef.current?.present();
  }, []);

  return (
    <>
      {/* ── Home grid ── */}
      <View style={s.grid}>
        {HOME_SERVICES.map((svc) => (
          <ServiceItem key={svc.key} service={svc} onPress={navigate} />
        ))}

        {/* Ещё tile */}
        <AnimatedPressable style={s.item} onPress={openMore}>
          <View style={[s.iconBox, s.moreBox, { width: 60, height: 60, borderRadius: 17 }]}>
            <MoreHorizontal size={24} color={COLORS.text2} strokeWidth={2} />
          </View>
          <Text style={s.label}>Ещё</Text>
        </AnimatedPressable>
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
                {group.items.map((svc) => (
                  <ServiceItem key={svc.key} service={svc} size="sm" onPress={navigate} />
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
    paddingHorizontal: 16,
    gap: 4,
    rowGap: 16,
  },

  item: {
    width: '25%',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 2,
  },
  itemSm: { width: '25%' },

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
    fontSize: 11,
    color: COLORS.text1,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 15,
  },
  labelSm: { fontSize: 11 },

  /* sheet */
  sheetBg:      { backgroundColor: COLORS.white, borderTopLeftRadius: 22, borderTopRightRadius: 22 },
  handleWrap:   { alignItems: 'center', paddingTop: 10, paddingBottom: 2 },
  handle:       { width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.border },
  sheetContent: { paddingHorizontal: 16, paddingBottom: 40 },
  sheetTitle:   { fontSize: 20, fontWeight: '800', color: COLORS.text1, marginBottom: 20, marginTop: 4 },

  group:      { marginBottom: 24 },
  groupTitle: {
    fontSize: 13, fontWeight: '700', color: COLORS.text2,
    marginBottom: 14, letterSpacing: 0.1,
  },
  groupGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 4, rowGap: 16 },
});
