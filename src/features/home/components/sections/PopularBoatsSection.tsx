import { ArrowRight } from 'lucide-react-native';
import { memo, useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { COLORS } from '@/shared/colors';
import { HomeBoat } from '@/store/useHomeStore';
import { CARD_W, PopularBoatCard } from '../cards/PopularBoatCard';
import { PopularSeeAllCard } from '../cards/PopularSeeAllCard';

interface RowProps {
  title:     string;
  subtitle:  string;
  typeRoute: string;
  boats:     HomeBoat[];
}

const PopularRow = memo(function PopularRow({ title, subtitle, typeRoute, boats }: RowProps) {
  const router   = useRouter();
  const previews = boats.slice(0, 3).map((b) => b.cover_image_url).filter(Boolean) as string[];

  if (boats.length === 0) return null;

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
          hitSlop={8}
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
        removeClippedSubviews
      >
        {boats.map((b) => (
          <PopularBoatCard key={b.boat_id} boat={b} />
        ))}
        <PopularSeeAllCard
          previews={previews}
          onPress={() => router.push(typeRoute as any)}
        />
      </ScrollView>
    </View>
  );
});

interface Props {
  popular: HomeBoat[];
  katera:  HomeBoat[];
  yakhty:  HomeBoat[];
}

export const PopularBoatsSection = memo(function PopularBoatsSection({ popular, katera, yakhty }: Props) {
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
        boats={katera}
      />
      <PopularRow
        title="Яхты"
        subtitle="в Санкт-Петербурге"
        typeRoute="/boats?type=yacht"
        boats={yakhty}
      />
    </View>
  );
});

const s = StyleSheet.create({
  rowRoot: { marginBottom: 24 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, marginBottom: 12,
  },
  title:    { fontSize: 18, fontWeight: '800', color: COLORS.text1 },
  titleSub: { fontSize: 12, color: COLORS.text3, marginTop: 1 },
  arrowBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.muted,
    alignItems: 'center', justifyContent: 'center',
  },
  scrollContent: { paddingHorizontal: 16, gap: 12, paddingRight: 32 },
});
