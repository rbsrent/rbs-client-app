import { BottomSheetModal, BottomSheetScrollView, BottomSheetTextInput, BottomSheetView } from '@gorhom/bottom-sheet';
import { Image } from 'expo-image';
import { Check, Plus } from 'lucide-react-native';
import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import * as Haptics from 'expo-haptics';

import { COLORS } from '@/shared/colors';
import { SheetBackdrop } from '@/shared/components/SheetBackdrop';
import { useWishlistToast } from '@/shared/context/WishlistToastContext';
import { useWishlistStore } from '@/store/useWishlistStore';
import {
  BoatData,
  createGroup,
  getAllGroups,
  getGroupsContaining,
  RECENT_GROUP_ID,
  WishlistGroupMeta,
} from '@/shared/wishlist';

export interface WishlistPickerHandle {
  open: (boat: BoatData, onClose?: () => void) => void;
}

type Page = 'list' | 'create';

export const WishlistPicker = forwardRef<WishlistPickerHandle>((_, ref) => {
  const sheetRef = useRef<BottomSheetModal>(null);
  const snaps    = useMemo(() => ['55%', '80%'], []);

  const [boat,     setBoat]     = useState<BoatData | null>(null);
  const [groups,   setGroups]   = useState<WishlistGroupMeta[]>([]);
  const [inGroups, setInGroups] = useState<Set<string>>(new Set());
  const [page,     setPage]     = useState<Page>('list');
  const [newName,  setNewName]  = useState('');
  const onCloseRef = useRef<(() => void) | undefined>(undefined);

  const addBoatToGroup     = useWishlistStore((s) => s.addBoatToGroup);
  const removeBoatFromGroup = useWishlistStore((s) => s.removeBoatFromGroup);
  const { show: showToast } = useWishlistToast();

  useImperativeHandle(ref, () => ({
    open: (b: BoatData, onClose?: () => void) => {
      setBoat(b);
      setPage('list');
      setNewName('');
      onCloseRef.current = onClose;
      loadGroups(b.boat_id);
      sheetRef.current?.present();
    },
  }));

  const loadGroups = async (boatId: string) => {
    const [all, saved] = await Promise.all([getAllGroups('boat'), getGroupsContaining(boatId)]);
    setGroups(all.filter((g) => g.id !== RECENT_GROUP_ID));
    setInGroups(new Set(saved.filter((g) => g !== RECENT_GROUP_ID)));
  };

  const toggle = async (groupId: string) => {
    if (!boat) return;
    const group = groups.find((g) => g.id === groupId);
    const groupName = group?.name ?? '';
    const isAdding = !inGroups.has(groupId);
    if (isAdding) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await addBoatToGroup(groupId, boat);
      const capturedBoat = boat;
      showToast({
        type: 'saved',
        listName: groupName,
        imageUrl: capturedBoat.cover_image_url,
        onEdit: () => {
          loadGroups(capturedBoat.boat_id);
          sheetRef.current?.present();
        },
      });
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await removeBoatFromGroup(groupId, boat.boat_id);
      showToast({
        type: 'deleted',
        listName: groupName,
        imageUrl: boat.cover_image_url,
      });
    }
    sheetRef.current?.dismiss();
  };

  const handleCreate = async () => {
    if (!newName.trim() || !boat) return;
    const groupName = newName.trim();
    const id = await createGroup(groupName);
    await addBoatToGroup(id, boat);
    showToast({
      type: 'saved',
      listName: groupName,
      imageUrl: boat.cover_image_url,
    });
    sheetRef.current?.dismiss();
  };

  const visibleGroups = groups;

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snaps}
      enablePanDownToClose
      backdropComponent={SheetBackdrop}
      backgroundStyle={s.sheetBg}
      handleComponent={() => <View style={s.handleWrap}><View style={s.handle} /></View>}
      keyboardBehavior="interactive"
      onDismiss={() => { onCloseRef.current?.(); onCloseRef.current = undefined; }}
    >
      {page === 'list' ? (
        <BottomSheetScrollView showsVerticalScrollIndicator={false}>
          <View style={s.header}>
            <Text style={s.title}>Сохранить в список</Text>
          </View>

          {visibleGroups.map((g) => {
            const checked = inGroups.has(g.id);
            const cover   = g.preview_urls[0] ?? null;
            return (
              <Pressable
                key={g.id}
                style={({ pressed }) => [s.row, pressed && { opacity: 0.7 }]}
                onPress={() => toggle(g.id)}
              >
                <View style={s.thumb}>
                  {cover
                    ? <Image source={{ uri: cover }} style={StyleSheet.absoluteFill} contentFit="cover" />
                    : <View style={[StyleSheet.absoluteFill, { backgroundColor: '#E0E0E0' }]} />}
                </View>
                <View style={s.rowText}>
                  <Text style={s.rowName}>{g.name}</Text>
                  <Text style={s.rowSub}>{g.item_count} объектов</Text>
                </View>
                <View style={[s.check, checked && s.checkOn]}>
                  {checked && <Check size={14} color="#fff" strokeWidth={3} />}
                </View>
              </Pressable>
            );
          })}

          <Pressable
            style={({ pressed }) => [s.row, pressed && { opacity: 0.7 }]}
            onPress={() => { setPage('create'); setNewName(''); }}
          >
            <View style={[s.thumb, s.thumbNew]}>
              <Plus size={22} color="#666" strokeWidth={2} />
            </View>
            <Text style={[s.rowName, { flex: 1 }]}>Создать новый список</Text>
          </Pressable>

          <View style={{ height: 32 }} />
        </BottomSheetScrollView>
      ) : (
        <BottomSheetView style={s.createPage}>
          <Text style={s.title}>Новый список</Text>
          <View style={s.inputWrap}>
            <BottomSheetTextInput
              style={s.input}
              placeholder="Название"
              placeholderTextColor="#aaa"
              value={newName}
              onChangeText={setNewName}
              maxLength={50}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleCreate}
            />
          </View>
          <Text style={s.charCount}>Символов: {newName.length} из 50</Text>
          <View style={s.foot}>
            <Pressable style={s.cancelBtn} onPress={() => setPage('list')}>
              <Text style={s.cancelTxt}>Назад</Text>
            </Pressable>
            <Pressable
              style={[s.doneBtn, !newName.trim() && s.doneBtnOff]}
              onPress={handleCreate}
              disabled={!newName.trim()}
            >
              <Text style={[s.doneTxt, !newName.trim() && s.doneTxtOff]}>Создать</Text>
            </Pressable>
          </View>
        </BottomSheetView>
      )}
    </BottomSheetModal>
  );
});

const s = StyleSheet.create({
  sheetBg:    { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  handleWrap: { alignItems: 'center', paddingTop: 12, paddingBottom: 2 },
  handle:     { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border },

  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  title:  { fontSize: 18, fontWeight: '700', color: '#000', textAlign: 'center' },

  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12, gap: 14,
  },
  thumb: {
    width: 56, height: 56, borderRadius: 10,
    overflow: 'hidden', backgroundColor: '#E0E0E0',
  },
  thumbNew: {
    alignItems: 'center', justifyContent: 'center',
  },
  rowText: { flex: 1, gap: 2 },
  rowName: { fontSize: 15, fontWeight: '600', color: '#000' },
  rowSub:  { fontSize: 12, color: '#888' },
  check: {
    width: 26, height: 26, borderRadius: 13,
    borderWidth: 2, borderColor: '#CCC',
    alignItems: 'center', justifyContent: 'center',
  },
  checkOn: { backgroundColor: '#000', borderColor: '#000' },

  createPage: { paddingHorizontal: 24, paddingTop: 8, flex: 1 },
  inputWrap: {
    borderWidth: 1, borderColor: '#DDD', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 14, marginTop: 16, marginBottom: 6,
  },
  input:      { fontSize: 16, color: '#000' },
  charCount:  { fontSize: 11, fontWeight: '600', color: '#888', marginBottom: 20 },
  foot:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cancelBtn:  { paddingVertical: 10 },
  cancelTxt:  { fontSize: 16, fontWeight: '500', color: '#000' },
  doneBtn:    { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10, backgroundColor: '#000' },
  doneBtnOff: { backgroundColor: '#E0E0E0' },
  doneTxt:    { fontSize: 16, fontWeight: '600', color: '#fff' },
  doneTxtOff: { color: '#aaa' },
});
