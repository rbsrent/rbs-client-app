import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import { Clock, Heart, X } from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  DEFAULT_GROUP_ID,
  deleteGroup,
  getAllGroups,
  RECENT_GROUP_ID,
  WishlistGroupMeta,
} from "@/shared/wishlist";

const W = Dimensions.get("window").width;
const CARD_W = (W - 32 - 12) / 2;

const CELL_GAP = 3;
const CELL_RADIUS = 9;

function Collage({ urls, size }: { urls: string[]; size: number }) {
  const cell = (size - CELL_GAP) / 2;
  const cells = Array.from({ length: 4 }, (_, i) => urls[i] ?? null);
  const radii = [
    { borderTopLeftRadius: CELL_RADIUS },
    { borderTopRightRadius: CELL_RADIUS },
    { borderBottomLeftRadius: CELL_RADIUS },
    { borderBottomRightRadius: CELL_RADIUS },
  ];
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 14,
        overflow: "hidden",
        backgroundColor: "#fff",
        flexDirection: "row",
        flexWrap: "wrap",
        gap: CELL_GAP,
      }}
    >
      {cells.map((url, i) => (
        <View
          key={i}
          style={[
            {
              width: cell,
              height: cell,
              backgroundColor: "#D8D8D8",
              overflow: "hidden",
            },
            radii[i],
          ]}
        >
          {url ? (
            <Image
              source={{ uri: url }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          ) : null}
        </View>
      ))}
    </View>
  );
}

function RecentCard({
  group,
  onPress,
}: {
  group: WishlistGroupMeta;
  onPress: () => void;
}) {
  const isEmpty = group.item_count === 0;
  return (
    <Pressable
      style={({ pressed }) => [s.groupCard, pressed && { opacity: 0.85 }]}
      onPress={onPress}
    >
      {isEmpty ? (
        <View style={[s.emptyImg, { width: CARD_W, height: CARD_W }]}>
          <Clock size={34} color="#AAA" strokeWidth={1.5} />
        </View>
      ) : (
        <Collage urls={group.preview_urls} size={CARD_W} />
      )}
      <Text style={s.groupName} numberOfLines={2}>
        {group.name}
      </Text>
      <Text style={s.groupSub}>
        {isEmpty ? "Пусто" : `${group.item_count} объектов`}
      </Text>
    </Pressable>
  );
}

function GroupCard({
  group,
  editing,
  onPress,
  onDelete,
}: {
  group: WishlistGroupMeta;
  editing: boolean;
  onPress: () => void;
  onDelete: () => void;
}) {
  const isEmpty = group.item_count === 0;
  const cover = group.preview_urls[0] ?? null;
  return (
    <Pressable
      style={({ pressed }) => [s.groupCard, pressed && { opacity: 0.85 }]}
      onPress={onPress}
    >
      <View style={[s.singleImg, { width: CARD_W, height: CARD_W }]}>
        {isEmpty ? (
          <View style={[StyleSheet.absoluteFill, s.emptyImg]}>
            <Heart size={34} color="#AAA" strokeWidth={1.5} />
          </View>
        ) : cover ? (
          <Image
            source={{ uri: cover }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        ) : (
          <View
            style={[StyleSheet.absoluteFill, { backgroundColor: "#D8D8D8" }]}
          />
        )}
      </View>
      <Text style={s.groupName} numberOfLines={2}>
        {group.name}
      </Text>
      <Text style={s.groupSub}>
        {isEmpty ? "Пусто" : `Сохранено: ${group.item_count}`}
      </Text>

      {editing && group.id !== DEFAULT_GROUP_ID && (
        <Pressable style={s.deleteBtn} onPress={onDelete} hitSlop={6}>
          <X size={12} color="#fff" strokeWidth={3} />
        </Pressable>
      )}
    </Pressable>
  );
}

export default function WishlistScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [groups, setGroups] = useState<WishlistGroupMeta[]>([]);
  const [editing, setEditing] = useState(false);

  const load = useCallback(() => {
    getAllGroups().then(setGroups);
  }, []);

  useFocusEffect(load);

  const recentGroup = groups.find((g) => g.id === RECENT_GROUP_ID) ?? null;
  const defaultGroup = groups.find((g) => g.id === DEFAULT_GROUP_ID) ?? null;
  const userGroups = groups.filter(
    (g) => g.id !== DEFAULT_GROUP_ID && g.id !== RECENT_GROUP_ID,
  );

  const hasUserGroups =
    userGroups.length > 0 || (defaultGroup?.item_count ?? 0) > 0;

  const handleDelete = async (id: string) => {
    await deleteGroup(id);
    load();
  };

  const displayGroups = [
    ...(defaultGroup ? [defaultGroup] : []),
    ...userGroups,
  ];

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}
      >
        <View style={s.topBar}>
          <View style={{ flex: 1 }} />
          {hasUserGroups && (
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
          {recentGroup && (
            <RecentCard
              group={recentGroup}
              onPress={() => router.push(`/wishlist/${RECENT_GROUP_ID}` as any)}
            />
          )}
          {displayGroups.map((g) => (
            <GroupCard
              key={g.id}
              group={g}
              editing={editing}
              onPress={() => {
                if (!editing) router.push(`/wishlist/${g.id}` as any);
              }}
              onDelete={() => handleDelete(g.id)}
            />
          ))}
        </View>
      </ScrollView>
    </View>
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
    backgroundColor: "#F2F2F2",
  },
  editBtnTxt: { fontSize: 14, fontWeight: "500", color: "#000" },

  pageTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#000",
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 20,
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
    backgroundColor: "#F5F5F5",
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
