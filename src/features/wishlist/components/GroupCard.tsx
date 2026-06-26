import { resolveRouteImage } from "@/features/routes/types";
import { COLORS } from "@/shared/colors";
import {
  DEFAULT_GROUP_ID,
  ROUTES_GROUP_ID,
  WishlistGroupMeta
} from "@/shared/wishlist";
import { Image } from "expo-image";
import { Heart, MapPin, X } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { CARD_WIDTH, cardStyles } from "./StyleCard";

export function GroupCard({
  group,
  editing,
  isRoute,
  onPress,
  onDelete,
}: {
  group: WishlistGroupMeta;
  editing: boolean;
  isRoute?: boolean;
  onPress: () => void;
  onDelete: () => void;
}) {
  const isEmpty = group.item_count === 0;
  const rawCover = group.preview_urls[0] ?? null;
  const cover = rawCover
    ? (isRoute ? resolveRouteImage(rawCover) : rawCover)
    : null;
  const isDeletable =
    group.id !== DEFAULT_GROUP_ID && group.id !== ROUTES_GROUP_ID;

  return (
    <Pressable
      style={({ pressed }) => [cardStyles.card, pressed && { opacity: 0.85 }]}
      onPress={onPress}
    >
      <View style={[cardStyles.imageContainer, { width: CARD_WIDTH, height: CARD_WIDTH }]}>
        {isEmpty ? (
          <View style={[StyleSheet.absoluteFill, cardStyles.empty]}>
            {isRoute ? (
              <MapPin size={34} color={COLORS.brandCyan} strokeWidth={1.5} />
            ) : (
              <Heart size={34} color="#AAA" strokeWidth={1.5} />
            )}
          </View>
        ) : cover ? (
          <Image
            source={{ uri: cover }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "#D8D8D8" }]} />
        )}
      </View>
      <Text style={cardStyles.name} numberOfLines={2}>
        {group.name}
      </Text>
      <Text style={cardStyles.sub}>
        {isEmpty ? "Пусто" : `Сохранено: ${group.item_count}`}
      </Text>
      {editing && isDeletable && (
        <Pressable style={cardStyles.deleteBtn} onPress={onDelete} hitSlop={6}>
          <X size={12} color="#fff" strokeWidth={3} />
        </Pressable>
      )}
    </Pressable>
  );
}