import { useRouter } from "expo-router";
import { Star } from "lucide-react-native";
import { memo } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  ReviewItem,
  ReviewRating,
} from "@/features/catalog/hooks/useBoatDetail";
import { COLORS } from "@/shared/colors";

const { width: W } = Dimensions.get("window");
const CARD_W = W * 0.78;
const SNAP_INTERVAL = CARD_W + 12;
const COMMENT_LIMIT = 220;

function StarDisplay({ value }: { value: number }) {
  const filled = Math.round(value);
  return (
    <View style={{ flexDirection: "row", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={13}
          color={n <= filled ? COLORS.yellow : "#DDD"}
          fill={n <= filled ? COLORS.yellow : "none"}
          strokeWidth={1.5}
        />
      ))}
    </View>
  );
}

const ReviewCard = memo(function ReviewCard({
  review,
}: {
  review: ReviewItem;
}) {
  const text = review.comment ?? "";
  const trimmed =
    text.length > COMMENT_LIMIT
      ? text.slice(0, COMMENT_LIMIT).trimEnd() + "…"
      : text;
  const date = new Date(review.created_at).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <View style={rc.card}>
      <View style={rc.top}>
        <View style={rc.avatar}>
          <Text style={rc.avatarTxt}>
            {(review.user_name ?? "?")[0].toUpperCase()}
          </Text>
        </View>
        <View style={rc.meta}>
          <Text style={rc.name}>{review.user_name}</Text>
          <Text style={rc.date}>{date}</Text>
        </View>
      </View>
      <StarDisplay value={review.rating} />
      <Text style={rc.comment}>{trimmed}</Text>
    </View>
  );
});

const rc = StyleSheet.create({
  card: {
    width: CARD_W,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 16,
    padding: 20,
    gap: 10,
  },
  top: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarTxt: { fontSize: 17, fontWeight: "600", color: "#555" },
  meta: { gap: 2 },
  name: { fontSize: 14, fontWeight: "600", color: "#000" },
  date: { fontSize: 12, color: "#6A6A6A" },
  comment: { fontSize: 14, color: "#444", lineHeight: 21 },
});

interface Props {
  reviews: ReviewItem[];
  reviewRating: ReviewRating;
  boatId: string;
}

function BoatDetailReviews({ reviews, reviewRating, boatId }: Props) {
  const router = useRouter();
  const openReviews = () =>
    router.push({ pathname: "./reviews", params: { boatId } } as any);

  if (reviewRating.total > 0) {
    return (
      <View style={s.section}>
        <View style={s.header}>
          <View style={s.ratingTag}>
            <Star size={18} color={COLORS.yellow} fill={COLORS.yellow} strokeWidth={0} />
            <Text style={s.title}>{reviewRating.avg.toFixed(2)}</Text>
          </View>
          <Text style={s.sub}>
            {reviewRating.total}{" "}
            {reviewRating.total === 1
              ? "отзыв"
              : reviewRating.total < 5
                ? "отзыва"
                : "отзывов"}
          </Text>
        </View>

        {/* ScrollView avoids nested VirtualizedList on Android */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={SNAP_INTERVAL}
          snapToAlignment="start"
          decelerationRate="fast"
          contentContainerStyle={s.strip}
        >
          {reviews.map((rv) => (
            <ReviewCard key={rv.id} review={rv} />
          ))}
        </ScrollView>

        <Pressable style={s.showAllBtn} onPress={openReviews}>
          <Text style={s.showAllTxt}>
            Показать все {reviewRating.total} отзывов
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={s.noRating}>
      <View style={s.stars}>
        <Star size={22} color={COLORS.yellow} fill={COLORS.yellow} strokeWidth={1} />
        <Star size={30} color={COLORS.yellow} fill={COLORS.yellow} strokeWidth={1} />
        <Star size={22} color={COLORS.yellow} fill={COLORS.yellow} strokeWidth={1} />
      </View>
      <Text style={s.noRatingTitle}>Пока нет отзывов</Text>
      <Text style={s.noRatingDesc}>Поделитесь впечатлениями после поездки</Text>
      <Pressable style={s.firstBtn} onPress={openReviews}>
        <Star size={14} color="#222" strokeWidth={2} />
        <Text style={s.firstTxt}>Оставить комментарий</Text>
      </Pressable>
    </View>
  );
}

export default memo(BoatDetailReviews);

const s = StyleSheet.create({
  section: { paddingTop: 20, paddingBottom: 4 },
  header: {
    paddingHorizontal: 24,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  title: { fontSize: 18, fontWeight: "500", color: "#000" },
  sub: { fontSize: 14, color: "#6A6A6A" },
  strip: { paddingHorizontal: 24, gap: 12 },

  ratingTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  showAllBtn: {
    marginHorizontal: 24,
    marginTop: 14,
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  showAllTxt: { fontSize: 14, fontWeight: "500", color: "#222" },

  noRating: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 8,
    alignItems: "center",
    gap: 10,
  },
  stars: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  noRatingTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#000",
    textAlign: "center",
  },
  noRatingDesc: {
    fontSize: 14,
    color: "#6A6A6A",
    textAlign: "center",
    lineHeight: 21,
  },
  firstBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 22,
  },
  firstTxt: { fontSize: 14, fontWeight: "500", color: "#222" },
});
