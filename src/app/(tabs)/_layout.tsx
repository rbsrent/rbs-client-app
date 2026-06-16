import { Tabs } from 'expo-router';
import {
  CalendarCheck,
  Home,
  MapPin,
  Route,
  User,
} from 'lucide-react-native';

import { TabBar } from '@/shared/components/TabBar';
import { VisualTab } from '@/shared/components/TabItem';

// ── Visual tab definitions ──────────────────────────────────
const VISUAL_TABS: VisualTab[] = [
  { key: 'index',   label: 'Главная',  Icon: Home },
  { key: 'routes',  label: 'Маршруты', Icon: Route },
  { key: 'piers',   label: 'Причалы',  Icon: MapPin },
  { key: 'bookings',label: 'Брони',    Icon: CalendarCheck },
  { key: 'profile', label: 'Профиль',  Icon: User },
];

// ── Layout ────────────────────────────────────────────────────
export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} tabs={VISUAL_TABS} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="routes" />
      <Tabs.Screen name="bookings" />
      <Tabs.Screen name="profile" />

      {/* Hidden — accessible from home service grid */}
      <Tabs.Screen name="catalog" options={{ href: null }} />
      <Tabs.Screen name="cruises" options={{ href: null }} />
    </Tabs>
  );
}
