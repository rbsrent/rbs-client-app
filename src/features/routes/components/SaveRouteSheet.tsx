import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { BookmarkCheck, BookmarkX } from 'lucide-react-native';
import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { SheetBackdrop } from '@/shared/components/SheetBackdrop';
import { COLORS } from '@/shared/colors';

export interface SaveRouteSheetHandle {
  show: (saved: boolean) => void;
}

export const SaveRouteSheet = forwardRef<SaveRouteSheetHandle>((_, ref) => {
  const sheetRef = useRef<BottomSheetModal>(null);
  const snaps = useMemo(() => ['28%'], []);
  const savedRef = useRef(true);

  useImperativeHandle(ref, () => ({
    show: (saved: boolean) => {
      savedRef.current = saved;
      sheetRef.current?.present();
    },
  }));

  const saved = savedRef.current;

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snaps}
      backdropComponent={SheetBackdrop}
      handleIndicatorStyle={s.handle}
      backgroundStyle={s.bg}
    >
      <BottomSheetView style={s.content}>
        <View style={[s.iconWrap, saved ? s.iconWrapSaved : s.iconWrapRemoved]}>
          {saved
            ? <BookmarkCheck size={28} color={COLORS.brandNavy} strokeWidth={2} />
            : <BookmarkX size={28} color={COLORS.text3} strokeWidth={2} />}
        </View>
        <Text style={s.title}>
          {saved ? 'Маршрут сохранён' : 'Маршрут удалён'}
        </Text>
        <Text style={s.sub}>
          {saved
            ? 'Вы найдёте его в разделе «Вишлисты»'
            : 'Маршрут убран из сохранённых'}
        </Text>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

const s = StyleSheet.create({
  handle: { backgroundColor: COLORS.border, width: 36 },
  bg: { backgroundColor: COLORS.white },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 8,
    paddingBottom: 24,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  iconWrapSaved:   { backgroundColor: COLORS.muted },
  iconWrapRemoved: { backgroundColor: '#F5F5F5' },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.text1 },
  sub:   { fontSize: 14, color: COLORS.text3, textAlign: 'center', lineHeight: 20 },
});
