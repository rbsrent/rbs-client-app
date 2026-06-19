import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Calendar, ChevronRight, Clock, MapPin } from 'lucide-react-native';
import React, { memo, useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '@/shared/colors';
import { authSupabase } from '@/shared/supabase/authClient';
import { SUPABASE_URL } from '@/shared/supabase/publicClient';
import { phoneVariants } from '@/shared/utils/phone';
import { useAuthStore } from '@/store/useAuthStore';
import { Spinner } from '@/shared/components/Spinner';

interface Booking {
  id: string;
  start_datetime: string;
  end_datetime: string;
  booking_status: string;
  total_price: number;
  prepayment_amount: number;
  remaining_amount: number;
  pier_name: string | null;
  pier_address: string | null;
  client_name: string;
  boats: {
    name: string;
    type: string;
    boat_images: { image_path: string; position: number }[];
  } | null;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending_payment: { label: 'Ожидает оплаты', color: COLORS.warning },
  partially_paid: { label: 'Частично оплачено', color: COLORS.brandCyan },
  confirmed: { label: 'Подтверждено', color: COLORS.success },
  client_confirmed: { label: 'Подтверждено', color: COLORS.success },
  fully_paid: { label: 'Оплачено', color: COLORS.success },
  completed: { label: 'Завершено', color: COLORS.text3 },
  cancelled: { label: 'Отменено', color: COLORS.error },
  client_arrived: { label: 'Клиент прибыл', color: COLORS.brandViolet },
};

function BookingCard({ booking }: { booking: Booking }) {
  const router = useRouter();
  const status = STATUS_LABELS[booking.booking_status] ?? { label: booking.booking_status, color: COLORS.text3 };
  const startDate = new Date(booking.start_datetime);
  const endDate = new Date(booking.end_datetime);
  const firstImg = booking.boats?.boat_images?.sort((a, b) => a.position - b.position)[0]?.image_path;
  const imgUrl = firstImg ? `${SUPABASE_URL}/storage/v1/object/public/boat_images/${firstImg}` : null;

  const duration = Math.round((endDate.getTime() - startDate.getTime()) / 3600000);

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/bookings/${booking.id}` as any)}
    >
      <View style={styles.cardImageWrap}>
        {imgUrl ? (
          <Image source={{ uri: imgUrl }} style={styles.cardImage} contentFit="cover" />
        ) : (
          <LinearGradient colors={[COLORS.brandNavy, COLORS.brandCyan]} style={StyleSheet.absoluteFill} />
        )}
      </View>
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.boatName} numberOfLines={1}>
            {booking.boats?.name ?? 'Судно'}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>
        <View style={styles.metaRow}>
          <Calendar size={13} color={COLORS.text3} strokeWidth={2} />
          <Text style={styles.metaText}>
            {startDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })},{' '}
            {startDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
          </Text>
          <Clock size={13} color={COLORS.text3} strokeWidth={2} />
          <Text style={styles.metaText}>{duration} ч.</Text>
        </View>
        {booking.pier_name ? (
          <View style={styles.metaRow}>
            <MapPin size={13} color={COLORS.text3} strokeWidth={2} />
            <Text style={styles.metaText} numberOfLines={1}>{booking.pier_name}</Text>
          </View>
        ) : null}
        <View style={styles.cardFooter}>
          <Text style={styles.price}>
            {new Intl.NumberFormat('ru-RU').format(booking.total_price)} ₽
          </Text>
          {booking.remaining_amount > 0 ? (
            <Text style={styles.remaining}>
              Остаток: {new Intl.NumberFormat('ru-RU').format(booking.remaining_amount)} ₽
            </Text>
          ) : null}
          <ChevronRight size={16} color={COLORS.text3} strokeWidth={2} />
        </View>
      </View>
    </Pressable>
  );
}

export const BookingsScreen = memo(function BookingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session, smsUser } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [tab, setTab] = useState<'upcoming' | 'past' | 'all'>('upcoming');

  const fetchBookings = useCallback(async () => {
    if (!session) return;
    setIsLoading(true);
    try {
      const phone = session.user?.phone ?? session.user?.user_metadata?.phone_number ?? '';
      if (!phone) return;
      const variants = phoneVariants(phone);
      const { data } = await authSupabase
        .from('public_bookings')
        .select(`
          id, start_datetime, end_datetime, booking_status,
          total_price, prepayment_amount, remaining_amount,
          pier_name, pier_address, client_name,
          boats(name, type, boat_images(image_path, position))
        `)
        .in('client_phone', variants)
        .order('start_datetime', { ascending: false });
      setBookings((data ?? []) as any[]);
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const now = new Date();
  const filtered = bookings.filter((b) => {
    const end = new Date(b.end_datetime);
    if (tab === 'upcoming') return end >= now && b.booking_status !== 'cancelled';
    if (tab === 'past') return end < now || b.booking_status === 'cancelled';
    return true;
  });

  if (!session) {
    return (
      <View style={[styles.container, styles.gateRoot, { paddingTop: insets.top }]}>
        <Text style={styles.pageTitle}>Поездки</Text>
        <View style={styles.gateBody}>
          <Text style={styles.gateTitle}>Войдите, чтобы посмотреть{'\n'}свои поездки</Text>
          <Text style={styles.gateDesc}>Для просмотра ваших бронирований необходимо войти в аккаунт.</Text>
          <Pressable style={styles.gateBtn} onPress={() => router.push('/auth' as any)}>
            <Text style={styles.gateBtnTxt}>Вход</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Мои бронирования</Text>
        <View style={styles.tabs}>
          {(['upcoming', 'past', 'all'] as const).map((t) => (
            <Pressable
              key={t}
              style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === 'upcoming' ? 'Предстоящие' : t === 'past' ? 'Прошедшие' : 'Все'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(b) => b.id}
        renderItem={({ item }) => <BookingCard booking={item} />}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={fetchBookings} tintColor={COLORS.brandCyan} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>
              {isLoading ? 'Загрузка...' : 'Бронирований нет'}
            </Text>
          </View>
        }
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundAlt },
  gateRoot: { backgroundColor: '#fff', paddingHorizontal: 16 },
  pageTitle: { fontSize: 32, fontWeight: '700', color: '#000', marginTop: 8, marginBottom: 4 },
  gateBody: { paddingTop: 24, gap: 10 },
  gateTitle: { fontSize: 24, fontWeight: '700', color: '#000', lineHeight: 32 },
  gateDesc: { fontSize: 15, color: '#888', lineHeight: 22 },
  gateBtn: {
    alignSelf: 'flex-start',
    marginTop: 12,
    backgroundColor: '#000',
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  gateBtnTxt: { fontSize: 15, fontWeight: '700', color: '#fff' },
  header: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text1,
    paddingTop: 8,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.muted,
    borderRadius: 10,
    padding: 3,
    gap: 3,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: { fontSize: 12, color: COLORS.text3, fontWeight: '500' },
  tabTextActive: { color: COLORS.brandNavy, fontWeight: '700' },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 12,
  },
  cardImageWrap: { height: 120, overflow: 'hidden' },
  cardImage: { ...StyleSheet.absoluteFill },
  cardContent: { padding: 14, gap: 8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  boatName: { fontSize: 16, fontWeight: '700', color: COLORS.text1, flex: 1 },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 12, color: COLORS.text2, flex: 1 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  price: { fontSize: 16, fontWeight: '700', color: COLORS.brandNavy, flex: 1 },
  remaining: { fontSize: 11, color: COLORS.warning },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text1 },
  emptySubtitle: { fontSize: 14, color: COLORS.text2 },
});
