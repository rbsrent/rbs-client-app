import { useRouter } from 'expo-router';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { setTextModal } from '@/shared/textModalStore';

const LIMIT = 220;

interface Props { description: string }

function BoatDetailDescription({ description }: Props) {
  const router  = useRouter();
  const trimmed = description.length > LIMIT
    ? description.slice(0, LIMIT).trimEnd() + '…'
    : description;

  const openModal = () => {
    setTextModal('Описание', description);
    router.push('./text-modal' as any);
  };

  return (
    <View style={s.block}>
      <Text style={s.heading}>Описание</Text>
      <Text style={s.text}>{trimmed}</Text>
      {description.length > LIMIT && (
        <Pressable style={s.btn} onPress={openModal}>
          <Text style={s.btnTxt}>Читать полностью</Text>
        </Pressable>
      )}
    </View>
  );
}

export default memo(BoatDetailDescription);

const s = StyleSheet.create({
  block:   { paddingHorizontal: 24, paddingVertical: 20, gap: 12 },
  heading: { fontSize: 18, fontWeight: '500', color: '#000' },
  text:    { fontSize: 16, color: '#222', lineHeight: 24 },
  btn: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnTxt:  { fontSize: 14, fontWeight: '500', color: '#222' },
});
