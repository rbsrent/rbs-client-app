import { Image } from "expo-image";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Clock, Heart, Star, X } from "lucide-react-native";
import { memo, useCallback, useMemo, useState } from "react";
import {
  Dimensions,
  FlatList,
  ListRenderItem,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { COLORS } from "@/shared/colors";
import {
  getGroup,
  getGroupItems,
  RECENT_GROUP_ID,
  WishlistGroup,
  WishlistItem,
} from "@/shared/wishlist";
import { useWishlistStore } from "@/store/useWishlistStore";

const W = Dimensions.get("window").width;
const CARD_W = (W - 32 - 12) / 2;
const IMG_H = Math.round(CARD_W * 1.05);

const ruNum = (n: number) =>
  new Intl.NumberFormat("ru-RU").format(Math.round(n));

function dateLabel(ts: number): string {
  const d = new Date(ts);
  const today = new Date();
  const yest = new Date(today);
  yest.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Сегодня";
  if (d.toDateString() === yest.toDateString()) return "Вчера";
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}

type ListRow =
  | { type: "header"; label: string; _key: string }
  | {
      type: "row";
      left: WishlistItem;
      right: WishlistItem | null;
      _key: string;
    };

const BoatCard = memo(function BoatCard({
  item,
  editing,
  onDelete,
}: {
  item: WishlistItem;
  editing: boolean;
  onDelete: () => void;
}) {
  const router = useRouter();
  const hasRate = item.rating !== null && item.rating > 0;

  return (
    <Pressable
      style={({ pressed }) => [s.card, pressed && { opacity: 0.92 }]}
      onPress={() => {
        if (!editing) router.push(`/catalog/${item.boat_id}` as any);
      }}
    >
      <View style={s.imgWrap}>
        {item.cover_image_url ? (
          <Image
            source={{ uri: item.cover_image_url }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        ) : (
          <View
            style={[StyleSheet.absoluteFill, { backgroundColor: "#D8D8D8" }]}
          />
        )}
        {editing && (
          <Pressable style={s.removeBtn} onPress={onDelete} hitSlop={6}>
            <X size={13} color="#fff" strokeWidth={3} />
          </Pressable>
        )}
      </View>

      <View style={s.info}>
        <View style={s.nameRow}>
          <Text style={s.name} numberOfLines={2}>
            {item.name}
          </Text>
          {hasRate && (
            <View style={s.ratingRow}>
              <Star size={11} color="#F5A623" fill="#F5A623" strokeWidth={0} />
              <Text style={s.ratingTxt}>{item.rating!.toFixed(2)}</Text>
            </View>
          )}
        </View>
        <Text style={s.sub} numberOfLines={1}>
          {[item.type, item.capacity ? `до ${item.capacity} чел.` : null]
            .filter(Boolean)
            .join(" · ")}
        </Text>
        <Text style={s.price}>
          <Text style={s.priceBold}>{ruNum(item.price_per_hour)} ₽</Text>
          <Text style={s.priceUnit}> / час</Text>
        </Text>
      </View>
    </Pressable>
  );
});

export default function WishlistDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [group, setGroup] = useState<WishlistGroup | null>(null);
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [editing, setEditing] = useState(false);

  const removeBoatFromGroup = useWishlistStore((s) => s.removeBoatFromGroup);
  const setBoatSaved        = useWishlistStore((s) => s.setBoatSaved);

  const load = useCallback(() => {
    if (!id) return;
    getGroup(id).then((g) => {
      if (g) setGroup(g);
    });
    getGroupItems(id).then(setItems);
  }, [id]);

  useFocusEffect(load);

  const handleRemove = useCallback(
    async (item: WishlistItem) => {
      if (!id) return;
      if (id !== RECENT_GROUP_ID) setBoatSaved(item.boat_id, false);
      setItems((prev) => prev.filter((i) => i.boat_id !== item.boat_id));
      await removeBoatFromGroup(
        id === RECENT_GROUP_ID ? RECENT_GROUP_ID : id,
        item.boat_id,
      );
    },
    [id, removeBoatFromGroup, setBoatSaved],
  );

  const listData = useMemo<ListRow[]>(() => {
    const map = new Map<string, WishlistItem[]>();
    for (const item of items) {
      const label = dateLabel(item.saved_at);
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(item);
    }
    const rows: ListRow[] = [];
    for (const [label, data] of map) {
      rows.push({ type: "header", label, _key: label });
      for (let i = 0; i < data.length; i += 2) {
        rows.push({
          type: "row",
          left: data[i],
          right: data[i + 1] ?? null,
          _key: `${label}-${i}`,
        });
      }
    }
    return rows;
  }, [items]);

  const renderItem = useCallback<ListRenderItem<ListRow>>(
    ({ item }) => {
      if (item.type === "header") {
        return <Text style={s.sectionLabel}>{item.label}</Text>;
      }
      return (
        <View style={s.row}>
          <BoatCard
            item={item.left}
            editing={editing}
            onDelete={() => handleRemove(item.left)}
          />
          {item.right ? (
            <BoatCard
              item={item.right}
              editing={editing}
              onDelete={() => handleRemove(item.right!)}
            />
          ) : (
            <View style={{ width: CARD_W }} />
          )}
        </View>
      );
    },
    [editing, handleRemove],
  );

  const keyExtractor = useCallback((item: ListRow) => item._key, []);

  const isRecent = id === RECENT_GROUP_ID;
  const title = group?.name ?? "...";

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.topBar}>
        <Pressable
          style={({ pressed }) => [s.backBtn, pressed && { opacity: 0.6 }]}
          onPress={() => router.back()}
        >
          <ArrowLeft size={20} color="#000" strokeWidth={2.5} />
        </Pressable>
        {items.length > 0 && (
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

      <FlatList
        data={listData}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={<Text style={s.pageTitle}>{title}</Text>}
        ListEmptyComponent={<EmptyState isRecent={isRecent} />}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        initialNumToRender={10}
        maxToRenderPerBatch={8}
        windowSize={5}
      />
    </View>
  );
}

function EmptyState({ isRecent }: { isRecent: boolean }) {
  return (
    <View style={s.empty}>
      <View style={s.emptyIconWrap}>
        {isRecent ? (
          <Clock size={40} color="#C8C8C8" strokeWidth={1.4} />
        ) : (
          <Heart size={40} color="#C8C8C8" strokeWidth={1.4} />
        )}
      </View>
      <Text style={s.emptyTxt}>
        {isRecent ? "Ещё ничего не смотрели" : "Список пуст"}
      </Text>
      <Text style={s.emptySub}>
        {isRecent
          ? "Откройте карточку судна — оно появится здесь"
          : "Нажмите ♡ на карточке судна, чтобы сохранить"}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  editBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.greyLight,
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
  listContent: { paddingBottom: 40 },

  sectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    paddingHorizontal: 16,
    marginBottom: 12,
    marginTop: 8,
  },
  row: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 12,
  },

  card: { width: CARD_W },
  imgWrap: {
    height: IMG_H,
    borderRadius: 12,
    backgroundColor: "#D8D8D8",
    overflow: "hidden",
  },
  removeBtn: {
    position: "absolute",
    top: 8,
    left: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  info: { paddingTop: 8, gap: 2 },
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  name: {
    fontSize: 13,
    fontWeight: "700",
    color: "#000",
    flex: 1,
    marginRight: 6,
    lineHeight: 18,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginTop: 1,
  },
  ratingTxt: { fontSize: 12, fontWeight: "600", color: "#000" },
  sub: { fontSize: 12, color: "#888", lineHeight: 17 },
  price: { marginTop: 1 },
  priceBold: { fontSize: 12, fontWeight: "700", color: "#000" },
  priceUnit: { fontSize: 12, color: "#888" },

  empty: {
    paddingTop: 72,
    paddingBottom: 40,
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 48,
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTxt: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
    textAlign: "center",
  },
  emptySub: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    lineHeight: 21,
  },
});
