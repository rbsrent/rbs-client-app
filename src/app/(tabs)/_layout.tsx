import { Tabs } from 'expo-router';
import {
  Heart,
  Route,
  Search,
  Ship,
  User,
} from 'lucide-react-native';

import { TabBar } from '@/shared/components/TabBar';
import { VisualTab } from '@/shared/components/TabItem';

// ── Visual tab definitions ──────────────────────────────────
const VISUAL_TABS: VisualTab[] = [
  { key: 'index',    label: 'Поиск',     Icon: Search },
  { key: 'catalog',  label: 'Каталог',   Icon: Ship },
  { key: 'routes',   label: 'Маршруты',  Icon: Route },
  { key: 'wishlist', label: 'Вишлисты',  Icon: Heart },
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
      <Tabs.Screen name="catalog" />
      <Tabs.Screen name="routes" />
      <Tabs.Screen name="wishlist" />
      <Tabs.Screen name="profile" />

      {/* Hidden — accessible via stack push */}
      <Tabs.Screen name="bookings" options={{ href: null }} />
      <Tabs.Screen name="piers"    options={{ href: null }} />
      <Tabs.Screen name="cruises"  options={{ href: null }} />
    </Tabs>
  );
}
