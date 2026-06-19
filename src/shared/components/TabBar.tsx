import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '@/shared/colors';

import { TabItem, VisualTab } from './TabItem';

interface TabBarProps {
  state: any;
  navigation: any;
  tabs: VisualTab[];
}

export function TabBar({ state, navigation, tabs }: TabBarProps) {
  const { bottom } = useSafeAreaInsets();

  const activeRouteKey = state.routes[state.index]?.name as string | undefined;

  const handlePress = (key: string) => {
    const route = state.routes.find((r: any) => r.name === key);
    if (!route) return;
    const isFocused = state.routes[state.index]?.name === key;
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!isFocused && !event.defaultPrevented) navigation.navigate(key);
  };

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(bottom, 8) }]}>
      {tabs.map((tab) => (
        <TabItem
          key={tab.key}
          tab={tab}
          active={tab.key === activeRouteKey}
          onPress={() => handlePress(tab.key)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: COLORS.greyLight,
    paddingTop: 8,
    // shadowColor: COLORS.brandNavy,
    // shadowOffset: { width: 0, height: -2 },
    // shadowOpacity: 0.05,
    // shadowRadius: 8,
    elevation: 8,
  },
});
