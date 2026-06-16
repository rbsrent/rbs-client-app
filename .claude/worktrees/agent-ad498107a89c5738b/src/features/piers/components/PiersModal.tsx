import { MapPin, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { COLORS } from '@/shared/colors';
import { publicSupabase } from '@/shared/supabase/publicClient';

interface Pier {
  id: string;
  name: string;
  address: string | null;
}

export function PiersModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [piers, setPiers] = useState<Pier[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    publicSupabase
      .from('piers')
      .select('id, name, address')
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => {
        setPiers((data as Pier[]) ?? []);
        setLoading(false);
      });
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.title}>Причалы</Text>
          <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
            <X size={20} color={COLORS.text2} strokeWidth={2} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {loading ? (
            <Text style={styles.loadingText}>Загрузка...</Text>
          ) : piers.length === 0 ? (
            <Text style={styles.loadingText}>Причалы не найдены</Text>
          ) : (
            piers.map((pier, idx) => (
              <View key={pier.id}>
                <View style={styles.pierRow}>
                  <MapPin size={16} color={COLORS.brandNavy} strokeWidth={1.8} />
                  <View style={styles.pierInfo}>
                    <Text style={styles.pierName}>{pier.name}</Text>
                    {pier.address ? <Text style={styles.pierAddress}>{pier.address}</Text> : null}
                  </View>
                </View>
                {idx < piers.length - 1 && <View style={styles.divider} />}
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 },
  loadingText: { paddingTop: 40, textAlign: 'center', color: COLORS.text3, fontSize: 14 },
  pierRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 14 },
  pierInfo: { flex: 1, gap: 3 },
  pierName: { fontSize: 15, fontWeight: '600', color: COLORS.text1 },
  pierAddress: { fontSize: 13, color: COLORS.text2 },
  divider: { height: 1, backgroundColor: COLORS.divider },
});
