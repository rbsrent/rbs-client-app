import { Image } from "expo-image";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Bookmark, X } from "lucide-react-native";
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

import { getCachedRoutes, setCachedRoutes, setRoutePreview } from "@/features/routes/store";
import { resolveRouteImage, WaterRoute } from "@/features/routes/types";
import { COLORS } from "@/shared/colors";
import { publicSupabase } from "@/shared/supabase/publicClient";
import {
    getGroup,
    getRouteGroupItems,
    removeRouteFromGroup,
    RouteGroupItem,
    ROUTES_GROUP_ID,
    WishlistGroup,
} from "@/shared/wishlist";
import { useWishlistToast } from "@/shared/context/WishlistToastContext";
import { useRouteSavedStore } from "@/store/useRouteSavedStore";

const W = Dimensions.get("window").width;
const CARD_W = (W - 32 - 12) / 2;
const IMG_H = Math.round(CARD_W * 1.05);

function dateLabel(ts: number): string {
  const d = new Date(ts);
  const today = new Date();
  const yest = new Date(today);
  yest.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Сегодня";
  if (d.toDateString() === yest.toDateString()) return "Вчера";
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}

type EnrichedItem = { item: RouteGroupItem; route: WaterRoute };
type ListRow =
  | { type: "header"; label: string; _key: string }
  | {
      type: "row";
      left: EnrichedItem;
      right: EnrichedItem | null;
      _key: string;
    };

const RouteCard = memo(function RouteCard({
  enriched,
  editing,
  onDelete,
}: {
  enriched: EnrichedItem;
  editing: boolean;
  onDelete: () => void;
}) {
  const router = useRouter();
  const { route } = enriched;
  const imageUrl = resolveRouteImage(route.map_image_url);
  const pts = route.route_points?.length ?? 0;

  return (
    <Pressable
      style={({ pressed }) => [s.card, pressed && { opacity: 0.92 }]}
      onPress={() => {
        if (!editing) {
          const slug = route.seo_slug ?? route.id;
          setRoutePreview({ slug, name: route.name, imageUrl: resolveRouteImage(route.map_image_url) });
          router.push(`/routes/${slug}` as any);
        }
      }}
    >
      <View style={s.imgWrap}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
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
        <Text style={s.name} numberOfLines={2}>
          {route.name}
        </Text>
        <Text style={s.sub} numberOfLines={1}>
          {[`${route.duration_hours} ч`, pts > 0 ? `${pts} точек` : null]
            .filter(Boolean)
            .join(" · ")}
        </Text>
      </View>
    </Pressable>
  );
});

export default function RouteGroupScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [group, setGroup] = useState<WishlistGroup | null>(null);
  const [items, setItems] = useState<RouteGroupItem[]>([]);
  const [allRoutes, setAllRoutes] = useState<WaterRoute[]>(
    () => getCachedRoutes() ?? [],
  );
  const [editing, setEditing] = useState(false);

  const refresh     = useRouteSavedStore((s) => s.refresh);
  const markUnsaved = useRouteSavedStore((s) => s.markUnsaved);
  const { show: showToast } = useWishlistToast();

  const load = useCallback(() => {
    if (!id) return;
    getGroup(id).then((g) => {
      if (g) setGroup(g);
    });
    getRouteGroupItems(id).then(setItems);

    const cached = getCachedRoutes();
    if (cached) {
      setAllRoutes(cached);
      return;
    }
    publicSupabase
      .from("water_routes")
      .select("*")
      .eq("is_active", true)
      .then(({ data }) => {
        if (data) {
          setCachedRoutes(data as WaterRoute[]);
          setAllRoutes(data as WaterRoute[]);
        }
      });
  }, [id]);

  useFocusEffect(load);

  const handleDelete = useCallback(
    async (routeId: string, route: WaterRoute) => {
      if (!id) return;
      markUnsaved(routeId);
      setItems((prev) => prev.filter((i) => i.route_id !== routeId));
      showToast({
        type: 'deleted',
        listName: group?.name ?? 'Маршруты',
        imageUrl: resolveRouteImage(route.map_image_url),
      });
      await removeRouteFromGroup(id, routeId);
      await refresh(routeId);
    },
    [id, refresh, markUnsaved, showToast, group],
  );

  const listData = useMemo<ListRow[]>(() => {
    const routeMap = new Map(allRoutes.map((r) => [r.id, r]));
    const sections: { label: string; items: EnrichedItem[] }[] = [];

    for (const item of items) {
      const route = routeMap.get(item.route_id);
      if (!route) continue;
      const label = dateLabel(item.saved_at);
      let sec = sections.find((s) => s.label === label);
      if (!sec) {
        sec = { label, items: [] };
        sections.push(sec);
      }
      sec.items.push({ item, route });
    }

    const rows: ListRow[] = [];
    for (const sec of sections) {
      rows.push({ type: "header", label: sec.label, _key: sec.label });
      for (let i = 0; i < sec.items.length; i += 2) {
        rows.push({
          type: "row",
          left: sec.items[i],
          right: sec.items[i + 1] ?? null,
          _key: `${sec.label}-${i}`,
        });
      }
    }
    return rows;
  }, [items, allRoutes]);

  const renderItem = useCallback<ListRenderItem<ListRow>>(
    ({ item }) => {
      if (item.type === "header") {
        return <Text style={s.sectionLabel}>{item.label}</Text>;
      }
      return (
        <View style={s.row}>
          <RouteCard
            enriched={item.left}
            editing={editing}
            onDelete={() => handleDelete(item.left.item.route_id, item.left.route)}
          />
          {item.right ? (
            <RouteCard
              enriched={item.right}
              editing={editing}
              onDelete={() => handleDelete(item.right!.item.route_id, item.right!.route)}
            />
          ) : (
            <View style={{ width: CARD_W }} />
          )}
        </View>
      );
    },
    [editing, handleDelete],
  );

  const keyExtractor = useCallback((item: ListRow) => item._key, []);

  const title = group?.name ?? (id === ROUTES_GROUP_ID ? "Маршруты" : "...");

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
        ListEmptyComponent={<EmptyState />}
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

function EmptyState() {
  return (
    <View style={s.empty}>
      <View style={s.emptyIconWrap}>
        <Bookmark size={40} color="#C8C8C8" strokeWidth={1.4} />
      </View>
      <Text style={s.emptyTxt}>Список пуст</Text>
      <Text style={s.emptySub}>
        Нажмите на закладку на карточке маршрута, чтобы сохранить
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
  name: { fontSize: 13, fontWeight: "700", color: "#000", lineHeight: 18 },
  sub: { fontSize: 12, color: "#888", lineHeight: 17 },

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
