import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getTextModal } from '@/shared/textModalStore';

export default function TextModalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { title, content } = getTextModal();

  return (
    <View style={[s.root, { paddingBottom: insets.bottom + 16 }]}>
      <View style={s.header}>
        <Text style={s.title}>{title}</Text>
        <Pressable style={s.closeBtn} onPress={() => router.back()} hitSlop={12}>
          <X size={22} color="#222" strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.body}
      >
        <Text style={s.text}>{content}</Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    flex: 1,
    lineHeight: 30,
    marginRight: 12,
  },
  closeBtn: {
    marginTop: 2,
  },
  body: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  text: {
    fontSize: 16,
    color: '#222',
    lineHeight: 26,
  },
});
