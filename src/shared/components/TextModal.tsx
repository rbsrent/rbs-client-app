import { X } from 'lucide-react-native';
import React from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: H } = Dimensions.get('window');

export interface TextModalProps {
  visible:  boolean;
  onClose:  () => void;
  title:    string;
  content:  string;
}

export default function TextModal({ visible, onClose, title, content }: TextModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={s.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[s.sheet, { paddingBottom: insets.bottom + 24, maxHeight: H * 0.88 }]}>
          {/* header */}
          <View style={s.header}>
            <Text style={s.title}>{title}</Text>
            <Pressable style={s.closeBtn} onPress={onClose} hitSlop={10}>
              <X size={22} color="#222" strokeWidth={2} />
            </Pressable>
          </View>

          {/* content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.body}
          >
            <Text style={s.text}>{content}</Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
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
    paddingBottom: 8,
  },
  text: {
    fontSize: 16,
    color: '#222',
    lineHeight: 26,
  },
});
