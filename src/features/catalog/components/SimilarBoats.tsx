import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { BoatCard } from '@/shared/components/BoatCard';

export interface SimilarBoatsProps {
  boats:   any[];
  onPress: (boatId: string) => void;
}

export default function SimilarBoats({ boats, onPress }: SimilarBoatsProps) {
  if (boats.length === 0) return null;

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Text style={s.title}>Похожие суда</Text>
        <Text style={s.sub}>
          {boats.length} {boats.length < 5 ? 'варианта' : 'вариантов'} по цене
        </Text>
      </View>
      <FlatList
        data={boats}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.strip}
        renderItem={({ item }) => (
          <BoatCard
            boat={{
              id:              item.id,
              name:            item.name,
              type:            item.type        ?? null,
              cover_image_url: item.cover_image_url ?? null,
              price_per_hour:  item.price_per_hour,
              capacity:        item.capacity    ?? null,
              length_meters:   item.length_meters ?? null,
              pier_name:       item.pier_name   ?? null,
              rating:          item.rating > 0  ? item.rating : null,
            }}
            layout="strip"
            route={`/catalog/${item.id}`}
          />
        )}
        removeClippedSubviews
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={5}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root:   { paddingTop: 20, paddingBottom: 20 },
  header: { paddingHorizontal: 24, marginBottom: 14, gap: 3 },
  title:  { fontSize: 18, fontWeight: '500', color: '#000' },
  sub:    { fontSize: 13, color: '#6A6A6A' },
  strip:  { paddingHorizontal: 24, gap: 12 },
});
