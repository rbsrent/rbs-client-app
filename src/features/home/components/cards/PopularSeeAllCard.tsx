import { Image } from 'expo-image';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CARD_W, IMG_H } from './PopularBoatCard';

const ANGLES = [-8, 4, -2];

export const PopularSeeAllCard = memo(function PopularSeeAllCard({
  previews,
  onPress,
}: {
  previews: string[];
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [s.card, pressed && { opacity: 0.88 }]}
      onPress={onPress}
    >
      <View style={s.imgs}>
        {previews.slice(0, 3).map((uri, i) => (
          <Image
            key={i}
            source={{ uri }}
            style={[
              s.thumb,
              {
                transform: [{ rotate: `${ANGLES[i] ?? 0}deg` }],
                zIndex: 3 - i,
                marginLeft: i === 0 ? 0 : -28,
              },
            ]}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        ))}
      </View>
      <Text style={s.txt}>Показать все</Text>
    </Pressable>
  );
});

const s = StyleSheet.create({
  card: {
    width: CARD_W,
    height: IMG_H + 50,
    borderRadius: 12,
    backgroundColor: '#F2F2F2',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  imgs: { flexDirection: 'row', alignItems: 'center', height: 72 },
  thumb: {
    width: 64, height: 72, borderRadius: 8,
    borderWidth: 2, borderColor: '#fff',
    overflow: 'hidden', backgroundColor: '#DDD',
  },
  txt: { fontSize: 13, fontWeight: '700', color: '#000' },
});
