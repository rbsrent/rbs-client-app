import { Tabs } from 'expo-router';
import {
  Heart,
  House,
  Route,
  TextSearch,
  User
} from 'lucide-react-native';

import { TabBar } from '@/shared/components/TabBar';
import { VisualTab } from '@/shared/components/TabItem';

const VISUAL_TABS: VisualTab[] = [
  { key: 'index',    label: 'Главная',     Icon: House },
  { key: 'catalog',  label: 'Каталог',   Icon: TextSearch },
  { key: 'routes',   label: 'Маршруты',  Icon: Route },
  { key: 'wishlist', label: 'Вишлисты',  Icon: Heart },
  { key: 'profile',  label: 'Профиль',   Icon: User },
];

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
      <Tabs.Screen name="cruises"  options={{ href: null }} />
    </Tabs>
  );
}
