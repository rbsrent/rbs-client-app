import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GroupCard } from "@/features/wishlist/components/GroupCard";
import { RecentCard } from "@/features/wishlist/components/RecentCard";
import { COLORS } from "@/shared/colors";
import {
  DEFAULT_GROUP_ID,
  deleteGroup,
  getAllGroups,
  getGroupItems,
  getRouteGroupItems,
  RECENT_GROUP_ID,
  ROUTES_GROUP_ID,
  WishlistGroupMeta,
} from "@/shared/wishlist";
import { useRouteSavedStore } from "@/store/useRouteSavedStore";
import { useWishlistStore } from "@/store/useWishlistStore";

const W = Dimensions.get("window").width;
const CARD_W = (W - 32 - 12) / 2;


export default function WishlistScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [groups, setGroups] = useState<WishlistGroupMeta[]>([]);
  const [editing, setEditing] = useState(false);

  const opacity = useSharedValue(0);
  const fadeStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const load = useCallback(() => {
    getAllGroups().then(setGroups);
  }, []);

  useFocusEffect(
    useCallback(() => {
      opacity.value = withTiming(1, { duration: 180 });
      load();
      return () => { opacity.value = 0; };
    }, [load]),
  );

  const recentGroup = groups.find((g) => g.id === RECENT_GROUP_ID) ?? null;
  const defaultGroup = groups.find((g) => g.id === DEFAULT_GROUP_ID) ?? null;
  const routesGroup = groups.find((g) => g.id === ROUTES_GROUP_ID) ?? null;
  const customBoat = groups.filter(
    (g) =>
      g.type === "boat" &&
      g.id !== DEFAULT_GROUP_ID &&
      g.id !== RECENT_GROUP_ID,
  );
  const customRoute = groups.filter(
    (g) => g.type === "route" && g.id !== ROUTES_GROUP_ID,
  );

  const hasAnyCustom =
    customBoat.length > 0 ||
    customRoute.length > 0 ||
    (defaultGroup?.item_count ?? 0) > 0;

  const refreshBoat  = useWishlistStore((s) => s.refreshBoat);
  const markUnsaved  = useRouteSavedStore((s) => s.markUnsaved);
  const routeRefresh = useRouteSavedStore((s) => s.refresh);

  const handleDelete = async (groupId: string) => {
    const group = groups.find((g) => g.id === groupId);
    if (group?.type === 'route') {
      const items = await getRouteGroupItems(groupId);
      await deleteGroup(groupId);
      for (const item of items) {
        markUnsaved(item.route_id);
        routeRefresh(item.route_id);
      }
    } else {
      const items = await getGroupItems(groupId);
      await deleteGroup(groupId);
      for (const item of items) {
        refreshBoat(item.boat_id);
      }
    }
    load();
  };

  const navigateBoat = (id: string) => router.push(`/wishlist/${id}` as any);
  const navigateRoute = (id: string) =>
    router.push(`/wishlist/route/${id}` as any);

  return (
    <Animated.View style={[s.root, { paddingTop: insets.top }, fadeStyle]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}
      >
        <View style={s.topBar}>
          <View style={{ flex: 1 }} />
          {hasAnyCustom && (
            <Pressable
              style={({ pressed }) => [s.editBtn, pressed && { opacity: 0.6 }]}
              onPress={() => setEditing((e) => !e)}
            >
              <Text style={s.editBtnTxt}>
                {editing ? "Готово" : "Редактировать"}
              </Text>
            </Pressable>
          )}
        </View>

        <Text style={s.pageTitle}>Вишлисты</Text>

        <View style={s.grid}>
          {/* Route groups */}
          {routesGroup && (
            <GroupCard
              group={routesGroup}
              editing={editing}
              isRoute
              onPress={() => !editing && navigateRoute(ROUTES_GROUP_ID)}
              onDelete={() => {}}
            />
          )}
          {customRoute.map((g) => (
            <GroupCard
              key={g.id}
              group={g}
              editing={editing}
              isRoute
              onPress={() => !editing && navigateRoute(g.id)}
              onDelete={() => handleDelete(g.id)}
            />
          ))}

          {/* Boat groups */}
          {recentGroup && (
            <RecentCard
              group={recentGroup}
              onPress={() => navigateBoat(RECENT_GROUP_ID)}
            />
          )}
          {defaultGroup && (
            <GroupCard
              group={defaultGroup}
              editing={editing}
              onPress={() => !editing && navigateBoat(DEFAULT_GROUP_ID)}
              onDelete={() => {}}
            />
          )}
          {customBoat.map((g) => (
            <GroupCard
              key={g.id}
              group={g}
              editing={editing}
              onPress={() => !editing && navigateBoat(g.id)}
              onDelete={() => handleDelete(g.id)}
            />
          ))}
        </View>
      </ScrollView>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },


  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  editBtn: { 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 20,
    backgroundColor: COLORS.greyLight
  },
  editBtnTxt: { fontSize: 14, fontWeight: "500", color: "#000" },

  pageTitle: {
    fontSize: 32,
    fontWeight: "500",
    color: "#000",
    paddingHorizontal: 24,
    marginTop: 16,
    marginBottom: 8,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 12,
  },

  groupCard: { width: CARD_W },
  groupName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginTop: 8,
    lineHeight: 20,
  },
  groupSub: { fontSize: 13, color: "#888", marginTop: 2 },

  singleImg: {
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#D8D8D8",
  },
  emptyImg: {
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },

  deleteBtn: {
    position: "absolute",
    top: 8,
    left: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
});
