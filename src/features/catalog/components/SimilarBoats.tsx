import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Users } from 'lucide-react-native';
import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/shared/colors';
import { formatRub } from '@/shared/utils/currency';

const SIMILAR_CARD_W = 156;

const SimilarCard = React.memo(function SimilarCard({
  boat,
  onPress,
}: {
  boat: any;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [sc.card, pressed && { opacity: 0.82 }]}
      onPress={onPress}
    >
      {boat._cover ? (
        <Image
          source={{ uri: boat._cover }}
          style={sc.img}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
      ) : (
        <LinearGradient
          colors={[COLORS.brandNavy, COLORS.brandCyan]}
          style={sc.img}
        />
      )}
      <View style={sc.info}>
        <Text style={sc.cardName} numberOfLines={2}>{boat.name}</Text>
        <Text style={sc.cardPrice}>{formatRub(boat.price_per_hour)}/час</Text>
        {boat.capacity ? (
          <View style={sc.cardCap}>
            <Users size={11} color={COLORS.text3} strokeWidth={2} />
            <Text style={sc.cardCapTxt}>{boat.capacity} чел.</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
});

export interface SimilarBoatsProps {
  boats: any[];
  onPress: (boatId: string) => void;
}

export default function SimilarBoats({ boats, onPress }: SimilarBoatsProps) {
  if (boats.length === 0) return null;

  return (
    <View style={s.similarSection}>
      <View style={s.similarHeader}>
        <Text style={s.sectionTitle}>Похожие катера</Text>
        <Text style={s.similarSub}>
          {boats.length}{' '}
          {boats.length === 1
            ? 'вариант рядом по цене'
            : boats.length < 5
            ? 'варианта рядом по цене'
            : 'вариантов рядом по цене'}
        </Text>
      </View>
      <FlatList
        data={boats}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
        renderItem={({ item }) => (
          <SimilarCard
            boat={item}
            onPress={() => onPress(item.id)}
          />
        )}
        getItemLayout={(_, i) => ({
          length: SIMILAR_CARD_W + 12,
          offset: (SIMILAR_CARD_W + 12) * i + 20,
          index: i,
        })}
        removeClippedSubviews
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={5}
      />
    </View>
  );
}

const s = StyleSheet.create({
  similarSection: { gap: 12, paddingTop: 4, paddingBottom: 4 },
  similarHeader: { paddingHorizontal: 20, gap: 2 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text1 },
  similarSub: { fontSize: 13, color: COLORS.text3 },
});

const sc = StyleSheet.create({
  card: {
    width: SIMILAR_CARD_W,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  img: { width: SIMILAR_CARD_W, height: 108 },
  info: { padding: 10, gap: 3 },
  cardName: { fontSize: 13, fontWeight: '600', color: COLORS.text1, lineHeight: 18 },
  cardPrice: { fontSize: 13, fontWeight: '700', color: COLORS.brandNavy },
  cardCap: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  cardCapTxt: { fontSize: 11, color: COLORS.text3 },
});
