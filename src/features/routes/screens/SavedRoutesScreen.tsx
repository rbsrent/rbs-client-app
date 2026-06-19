import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { Bookmark, ChevronLeft, MapPin, X } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { publicSupabase } from '@/shared/supabase/publicClient';
import { getSavedRoutesWithDates, useRouteSavedStore } from '@/store/useRouteSavedStore';
import { getCachedRoutes, setCachedRoutes } from '../store';
import { resolveRouteImage, WaterRoute } from '../types';

const W = Dimensions.get('window').width;
const CARD_W = (W - 32 - 12) / 2;
const IMG_H = Math.round(CARD_W * 0.9);

function dateLabel(ts: number): string {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Сегодня';
  if (d.toDateString() === yesterday.toDateString()) return 'Вчера';
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

function MiniRouteCard({
  route,
  editing,
  onDelete,
}: {
  route: WaterRoute;
  editing: boolean;
  onDelete: () => void;
}) {
  const router = useRouter();
  const imageUrl = resolveRouteImage(route.map_image_url);
  const pts = route.route_points?.length ?? 0;

  return (
    <Pressable
      style={({ pressed }) => [s.card, pressed && { opacity: 0.92 }]}
      onPress={() => {
        if (!editing) router.push(`/routes/${route.seo_slug ?? route.id}` as any);
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
          <View style={[StyleSheet.absoluteFill, { backgroundColor: '#D8D8D8' }]} />
        )}
        {editing && (
          <Pressable style={s.removeBtn} onPress={onDelete} hitSlop={6}>
            <X size={13} color="#fff" strokeWidth={3} />
          </Pressable>
        )}
      </View>
      <View style={s.info}>
        <Text style={s.name} numberOfLines={2}>{route.name}</Text>
        <Text style={s.sub} numberOfLines={1}>
          {[
            `${route.duration_hours} ч`,
            pts > 0 ? `${pts} точек` : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </Text>
      </View>
    </Pressable>
  );
}

type SavedEntry = { route_id: string; saved_at: number };

export function SavedRoutesScreen() {
  const insets  = useSafeAreaInsets();
  const router  = useRouter();
  const hydrate = useRouteSavedStore((s) => s.hydrate);
  const remove  = useRouteSavedStore((s) => s.remove);

  const [allRoutes, setAllRoutes] = useState<WaterRoute[]>(() => getCachedRoutes() ?? []);
  const [saved, setSaved]         = useState<SavedEntry[]>([]);
  const [editing, setEditing]     = useState(false);

  const load = useCallback(() => {
    hydrate();
    getSavedRoutesWithDates().then(setSaved);
    const cached = getCachedRoutes();
    if (cached) { setAllRoutes(cached); return; }
    publicSupabase
      .from('water_routes')
      .select('*')
      .eq('is_active', true)
      .then(({ data }) => {
        if (data) {
          setCachedRoutes(data as WaterRoute[]);
          setAllRoutes(data as WaterRoute[]);
        }
      });
  }, []);

  useFocusEffect(load);

  const routeMap = new Map(allRoutes.map((r) => [r.id, r]));

  type Section = { label: string; data: { entry: SavedEntry; route: WaterRoute }[] };
  const sections: Section[] = [];
  for (const entry of saved) {
    const route = routeMap.get(entry.route_id);
    if (!route) continue;
    const label = dateLabel(entry.saved_at);
    let sec = sections.find((s) => s.label === label);
    if (!sec) { sec = { label, data: [] }; sections.push(sec); }
    sec.data.push({ entry, route });
  }

  const totalCount = sections.reduce((acc, s) => acc + s.data.length, 0);

  const handleDelete = async (routeId: string) => {
    await remove(routeId);
    setSaved((prev) => prev.filter((e) => e.route_id !== routeId));
  };

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.topBar}>
        <Pressable
          style={({ pressed }) => [s.backBtn, pressed && { opacity: 0.6 }]}
          onPress={() => router.back()}
        >
          <ChevronLeft size={20} color="#000" strokeWidth={2.5} />
        </Pressable>
        {totalCount > 0 && (
          <Pressable
            style={({ pressed }) => [s.editBtn, pressed && { opacity: 0.6 }]}
            onPress={() => setEditing((e) => !e)}
          >
            <Text style={s.editBtnTxt}>{editing ? 'Готово' : 'Редактировать'}</Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        <Text style={s.pageTitle}>Маршруты</Text>

        {totalCount === 0 ? (
          <View style={s.empty}>
            <View style={s.emptyIconWrap}>
              <Bookmark size={40} color="#C8C8C8" strokeWidth={1.4} />
            </View>
            <Text style={s.emptyTxt}>Список пуст</Text>
            <Text style={s.emptySub}>
              Нажмите на закладку на карточке маршрута, чтобы сохранить
            </Text>
          </View>
        ) : (
          sections.map(({ label, data }) => (
            <View key={label} style={s.section}>
              <Text style={s.sectionLabel}>{label}</Text>
              <View style={s.grid}>
                {data.map(({ entry, route }) => (
                  <MiniRouteCard
                    key={entry.route_id}
                    route={route}
                    editing={editing}
                    onDelete={() => handleDelete(entry.route_id)}
                  />
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editBtnTxt: { fontSize: 14, fontWeight: '500', color: '#000' },

  pageTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000',
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 20,
  },

  section: { marginBottom: 8 },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },

  card: { width: CARD_W },
  imgWrap: {
    height: IMG_H,
    borderRadius: 12,
    backgroundColor: '#D8D8D8',
    overflow: 'hidden',
  },
  removeBtn: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { paddingTop: 8, gap: 2 },
  name: { fontSize: 13, fontWeight: '700', color: '#000', lineHeight: 18 },
  sub:  { fontSize: 12, color: '#888', lineHeight: 17 },

  empty: {
    paddingTop: 72,
    paddingBottom: 40,
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 48,
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTxt: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', textAlign: 'center' },
  emptySub: { fontSize: 14, color: '#999', textAlign: 'center', lineHeight: 21 },
});
