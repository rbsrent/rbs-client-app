import { Tabs } from 'expo-router';
import {
  Heart,
  MapPin,
  Route,
  Search,
  User,
} from 'lucide-react-native';

import { TabBar } from '@/shared/components/TabBar';
import { VisualTab } from '@/shared/components/TabItem';

// ── Visual tab definitions ──────────────────────────────────
const VISUAL_TABS: VisualTab[] = [
  { key: 'index',    label: 'Поиск',      Icon: Search },
  { key: 'wishlist', label: 'Вишлисты',  Icon: Heart },
  { key: 'routes',   label: 'Маршруты',  Icon: Route },
  { key: 'piers',    label: 'Причалы',   Icon: MapPin },
  { key: 'profile',  label: 'Профиль',   Icon: User },
];

// ── Layout ────────────────────────────────────────────────────
export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} tabs={VISUAL_TABS} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="wishlist" />
      <Tabs.Screen name="routes" />
      <Tabs.Screen name="piers" />
      <Tabs.Screen name="profile" />

      {/* Hidden — accessible via stack push */}
      <Tabs.Screen name="bookings" options={{ href: null }} />
      <Tabs.Screen name="catalog"  options={{ href: null }} />
      <Tabs.Screen name="cruises"  options={{ href: null }} />
    </Tabs>
  );
}
