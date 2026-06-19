// components/RecentCard.tsx
import { WishlistGroupMeta } from "@/shared/wishlist";
import { Clock } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { Collage } from "./Collage";
import { CARD_WIDTH, cardStyles } from "./StyleCard";

export function RecentCard({
  group,
  onPress,
}: {
  group: WishlistGroupMeta;
  onPress: () => void;
}) {
  const isEmpty = group.item_count === 0;
  return (
    <Pressable
      style={({ pressed }) => [cardStyles.card, pressed && { opacity: 0.85 }]}
      onPress={onPress}
    >
      {isEmpty ? (
        <View style={[cardStyles.imageContainer, cardStyles.empty]}>
          <Clock size={34} color="#AAA" strokeWidth={1.5} />
        </View>
      ) : (
        <Collage urls={group.preview_urls} size={CARD_WIDTH} />
      )}
      <Text style={cardStyles.name} numberOfLines={2}>
        {group.name}
      </Text>
      <Text style={cardStyles.sub}>
        {isEmpty ? "Пусто" : `${group.item_count} объектов`}
      </Text>
    </Pressable>
  );
}