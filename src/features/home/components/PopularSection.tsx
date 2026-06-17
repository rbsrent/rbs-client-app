import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { ArrowRight, Star } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { COLORS } from "@/shared/colors";
import { HeartButton } from "@/shared/components/HeartButton";
import { publicSupabase, SUPABASE_URL } from "@/shared/supabase/publicClient";

const { width: W } = Dimensions.get("window");
const CARD_W = W * 0.46;
const IMG_H = Math.round(CARD_W * 1.1);
const WEB_BASE = "https://rbs.rent";

interface PopularBoat {
  boat_id: string;
  name: string;
  type: string | null;
  capacity: number | null;
  length_meters: number | null;
  price_per_hour: number;
  average_rating: number;
  total_reviews: number;
  pier_name: string | null;
  badge_override: string | null;
  is_pinned: boolean;
  images: any;
}

function resolveCoverImage(images: any): string | null {
  try {
    const arr: any[] = Array.isArray(images)
      ? images
      : JSON.parse(images ?? "[]");
    const first = arr[0]?.image_path;
    if (!first) return null;
    if (first.startsWith("http")) return first;
    if (first.startsWith("/")) return `${WEB_BASE}${first}`;
    return `${SUPABASE_URL}/storage/v1/object/public/boat_images/${first}`;
  } catch {
    return null;
  }
}

// ─── Single boat card ─────────────────────────────────────────────────────────

function BoatCard({ boat }: { boat: PopularBoat }) {
  const router = useRouter();
  const cover = resolveCoverImage(boat.images);
  const hasRate = boat.average_rating > 0;
  const ruNum = (n: number) =>
    new Intl.NumberFormat("ru-RU").format(Math.round(n));

  return (
    <Pressable
      style={({ pressed }) => [s.card, pressed && { opacity: 0.92 }]}
      onPress={() => router.push(`/catalog/${boat.boat_id}` as any)}
    >
      <View style={s.imgWrap}>
        {cover ? (
          <Image
            source={{ uri: cover }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        ) : (
          <View
            style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.muted }]}
          />
        )}
        <HeartButton
          boat={{
            boat_id: boat.boat_id,
            name: boat.name,
            type: boat.type,
            cover_image_url: cover,
            price_per_hour: boat.price_per_hour,
            capacity: boat.capacity,
            length_meters: boat.length_meters,
            pier_name: boat.pier_name,
            rating: boat.average_rating > 0 ? boat.average_rating : null,
          }}
        />
      </View>

      <View style={s.info}>
        <View style={s.nameRow}>
          <Text style={s.name} numberOfLines={2}>
            {boat.name}
          </Text>
          {hasRate ? (
            <View style={s.ratingRow}>
              <Star size={11} color="#F5A623" fill="#F5A623" strokeWidth={0} />
              <Text style={s.ratingTxt}>{boat.average_rating.toFixed(2)}</Text>
            </View>
          ) : null}
        </View>
        <Text style={s.sub} numberOfLines={1}>
          {[
            boat.capacity ? `до ${boat.capacity} чел.` : null,
            boat.length_meters ? `${boat.length_meters} м` : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </Text>
        <Text style={s.price}>
          <Text style={s.priceBold}>{ruNum(boat.price_per_hour)} ₽</Text>
          <Text style={s.priceUnit}> / час</Text>
        </Text>
      </View>
    </Pressable>
  );
}

// ─── "See all" card ───────────────────────────────────────────────────────────

function SeeAllCard({
  previews,
  onPress,
}: {
  previews: string[];
  onPress: () => void;
}) {
  const angles = [-8, 4, -2];
  return (
    <Pressable
      style={({ pressed }) => [s.seeAllCard, pressed && { opacity: 0.88 }]}
      onPress={onPress}
    >
      <View style={s.seeAllImgs}>
        {previews.slice(0, 3).map((uri, i) => (
          <Image
            key={i}
            source={{ uri }}
            style={[
              s.seeAllThumb,
              {
                transform: [{ rotate: `${angles[i] ?? 0}deg` }],
                zIndex: 3 - i,
                marginLeft: i === 0 ? 0 : -28,
              },
            ]}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        ))}
      </View>
      <Text style={s.seeAllTxt}>Показать все</Text>
    </Pressable>
  );
}

// ─── One horizontal row ───────────────────────────────────────────────────────

interface RowProps {
  title: string;
  subtitle: string;
  typeRoute: string;
  boats: PopularBoat[];
}

function PopularRow({ title, subtitle, typeRoute, boats }: RowProps) {
  const router   = useRouter();
  const filtered = boats;
  const previews = filtered
    .slice(0, 3)
    .map((b) => resolveCoverImage(b.images))
    .filter(Boolean) as string[];

  if (filtered.length === 0) return null;

  return (
    <View style={s.rowRoot}>
      <View style={s.header}>
        <View>
          <Text style={s.title}>{title}</Text>
          <Text style={s.titleSub}>{subtitle}</Text>
        </View>
        <Pressable
          style={({ pressed }) => [s.arrowBtn, pressed && { opacity: 0.7 }]}
          onPress={() => router.push(typeRoute as any)}
        >
          <ArrowRight size={15} color={COLORS.text1} strokeWidth={2.5} />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
        decelerationRate="fast"
        snapToInterval={CARD_W + 12}
        snapToAlignment="start"
      >
        {filtered.map((b) => (
          <BoatCard key={b.boat_id} boat={b} />
        ))}
        <SeeAllCard
          previews={previews}
          onPress={() => router.push("/boats" as any)}
        />
      </ScrollView>
    </View>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function PopularSection() {
  const [popular, setPopular] = useState<PopularBoat[]>([]);
  const [katера,  setKatera]  = useState<PopularBoat[]>([]);
  const [yakhty,  setYakhty]  = useState<PopularBoat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [popRes, kateraRes, yakhtaRes] = await Promise.all([
          publicSupabase.rpc('get_popular_boats', { limit_count: 8 }),
          publicSupabase
            .from('boats')
            .select('id,name,type,price_per_hour,capacity,length_meters,boat_images(image_path,position)')
            .eq('is_hidden', false)
            .eq('moderation_status', 'approved')
            .eq('type', 'катер')
            .order('display_order', { ascending: true }),
          publicSupabase
            .from('boats')
            .select('id,name,type,price_per_hour,capacity,length_meters,boat_images(image_path,position)')
            .eq('is_hidden', false)
            .eq('moderation_status', 'approved')
            .eq('type', 'яхта')
            .order('display_order', { ascending: true }),
        ]);

        const mapBoat = (b: any): PopularBoat => {
          const imgs = [...(b.boat_images ?? [])].sort((a: any, z: any) => a.position - z.position);
          return {
            boat_id: b.id,
            name: b.name,
            type: b.type,
            capacity: b.capacity ?? null,
            length_meters: b.length_meters ?? null,
            price_per_hour: b.price_per_hour,
            average_rating: 0,
            total_reviews: 0,
            pier_name: null,
            badge_override: null,
            is_pinned: false,
            images: imgs,
          };
        };

        if (!cancelled) {
          setPopular((popRes.data as PopularBoat[]) ?? []);
          setKatera((kateraRes.data ?? []).map(mapBoat));
          setYakhty((yakhtaRes.data ?? []).map(mapBoat));
        }
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <View style={s.loader}>
        <ActivityIndicator color={COLORS.brandNavy} />
      </View>
    );
  }

  return (
    <View>
      <PopularRow
        title="Популярные суда"
        subtitle="На основе бронирований за 30 дней"
        typeRoute="/boats"
        boats={popular}
      />
      <PopularRow
        title="Катера"
        subtitle="в Санкт-Петербурге"
        typeRoute="/boats?type=boat"
        boats={katера}
      />
      <PopularRow
        title="Яхты"
        subtitle="в Санкт-Петербурге"
        typeRoute="/boats?type=yacht"
        boats={yakhty}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  loader: { height: 120, alignItems: "center", justifyContent: "center" },

  rowRoot: { marginTop: 28 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: { fontSize: 18, fontWeight: "800", color: COLORS.text1 },
  titleSub: { fontSize: 12, color: COLORS.text3, marginTop: 1 },
  arrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.muted,
    alignItems: "center",
    justifyContent: "center",
  },

  scrollContent: { paddingHorizontal: 16, gap: 12, paddingRight: 32 },

  card: { width: CARD_W },
  imgWrap: {
    height: IMG_H,
    borderRadius: 12,
    backgroundColor: COLORS.muted,
    overflow: "hidden",
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
    color: COLORS.text1,
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
  ratingTxt: { fontSize: 12, fontWeight: "600", color: COLORS.text1 },
  sub: { fontSize: 12, color: COLORS.text3, lineHeight: 17 },
  price: { marginTop: 1 },
  priceBold: { fontSize: 12, fontWeight: "700", color: COLORS.text1 },
  priceUnit: { fontSize: 12, color: COLORS.text3 },

  seeAllCard: {
    width: CARD_W,
    height: IMG_H,
    borderRadius: 12,
    backgroundColor: "#F2F2F2",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  seeAllImgs: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 90,
  },
  seeAllThumb: {
    width: 72,
    height: 88,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#fff",
  },
  seeAllTxt: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text1,
  },
});
