import { COLORS } from '@/shared/colors';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface FilterSectionProps {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export function FilterSection({ title, expanded, onToggle, children }: FilterSectionProps) {
  return (
    <View style={fs.wrap}>
      <Pressable style={fs.header} onPress={onToggle}>
        <Text style={fs.title}>{title}</Text>
        {expanded
          ? <ChevronUp size={18} color={COLORS.text2} strokeWidth={2} />
          : <ChevronDown size={18} color={COLORS.text2} strokeWidth={2} />}
      </Pressable>
      {expanded && <View style={fs.body}>{children}</View>}
    </View>
  );
}

const fs = StyleSheet.create({
  wrap: { paddingHorizontal: 24, paddingVertical: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 17, fontWeight: '700', color: '#000' },
  body: { marginTop: 20 },
});