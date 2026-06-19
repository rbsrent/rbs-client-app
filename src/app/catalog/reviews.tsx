import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle2, Star } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '@/shared/colors';
import { publicSupabase } from '@/shared/supabase/publicClient';
import { Spinner } from '@/shared/components/Spinner';

// ─── star helpers ─────────────────────────────────────────────────────────────
function StarDisplay({ value, size = 13 }: { value: number; size?: number }) {
  const filled = Math.round(value);
  return (
    <View style={{ flexDirection: 'row', gap: 3 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          color={n <= filled ? '#F5A623' : '#DDD'}
          fill={n <= filled ? '#F5A623' : 'none'}
          strokeWidth={1.5}
        />
      ))}
    </View>
  );
}

function StarSelector({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} onPress={() => onChange(n)} hitSlop={8}>
          <Star
            size={34}
            color={n <= value ? '#F5A623' : '#DDDDDD'}
            fill={n <= value ? '#F5A623' : 'none'}
            strokeWidth={1.5}
          />
        </Pressable>
      ))}
    </View>
  );
}

// ─── single review row ────────────────────────────────────────────────────────
function ReviewRow({ review }: { review: any }) {
  const dateStr = new Date(review.created_at).toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  return (
    <View style={r.item}>
      <View style={r.top}>
        <View style={r.avatar}>
          <Text style={r.avatarTxt}>{(review.user_name ?? '?')[0].toUpperCase()}</Text>
        </View>
        <View style={r.meta}>
          <Text style={r.name}>{review.user_name}</Text>
          <Text style={r.date}>{dateStr}</Text>
        </View>
      </View>
      <StarDisplay value={review.rating} size={13} />
      <Text style={r.comment}>{review.comment}</Text>
    </View>
  );
}

const r = StyleSheet.create({
  item:      { paddingVertical: 20, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#EEEEEE' },
  top:       { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#F0F0F0',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarTxt: { fontSize: 17, fontWeight: '600', color: '#555' },
  meta:      { gap: 2 },
  name:      { fontSize: 14, fontWeight: '600', color: '#000' },
  date:      { fontSize: 12, color: '#6A6A6A' },
  comment:   { fontSize: 15, color: '#222', lineHeight: 22, marginTop: 6 },
});

// ─── screen ───────────────────────────────────────────────────────────────────
export default function ReviewsScreen() {
  const { boatId } = useLocalSearchParams<{ boatId: string }>();
  const insets     = useSafeAreaInsets();
  const router     = useRouter();

  const [reviews,    setReviews]    = useState<any[]>([]);
  const [ratingInfo, setRatingInfo] = useState({ avg: 0, total: 0 });
  const [loading,    setLoading]    = useState(true);
  const [form,       setForm]       = useState({ name: '', email: '', comment: '', rating: 0 });
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);

  useEffect(() => {
    if (!boatId) return;
    let cancelled = false;
    (async () => {
      const [{ data: revs }, { data: rpc }] = await Promise.all([
        publicSupabase
          .from('boat_reviews')
          .select('id, user_name, rating, comment, created_at')
          .eq('boat_id', boatId)
          .eq('moderation_status', 'approved')
          .order('created_at', { ascending: false }),
        publicSupabase.rpc('get_boat_average_rating', { p_boat_id: boatId }),
      ]);
      if (cancelled) return;
      if (revs) setReviews(revs);
      if (rpc?.[0]) setRatingInfo({ avg: rpc[0].average_rating ?? 0, total: rpc[0].total_reviews ?? 0 });
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [boatId]);

  const canSubmit = !!form.name.trim() && !!form.email.trim() && !!form.comment.trim() && form.rating > 0;

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const { error } = await publicSupabase.from('boat_reviews').insert({
        boat_id:           boatId,
        user_name:         form.name.trim(),
        user_email:        form.email.trim(),
        rating:            form.rating,
        comment:           form.comment.trim(),
        moderation_status: 'pending',
      });
      if (!error) {
        setSubmitted(true);
        setForm({ name: '', email: '', comment: '', rating: 0 });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <Pressable style={s.backBtn} onPress={() => router.back()} hitSlop={10}>
          <ArrowLeft size={22} color="#222" strokeWidth={2} />
        </Pressable>
        <Text style={s.headerTitle}>Отзывы</Text>
        <View style={{ width: 38 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
          keyboardShouldPersistTaps="handled"
        >
          {loading ? (
            <Spinner style={{ marginTop: 64 }} />
          ) : (
            <>
              {/* Rating summary */}
              {ratingInfo.total > 0 && (
                <View style={s.ratingSummary}>
                  <Text style={s.ratingBig}>★ {ratingInfo.avg.toFixed(2)}</Text>
                  <Text style={s.ratingCount}>
                    {ratingInfo.total}{' '}
                    {ratingInfo.total === 1 ? 'отзыв' : ratingInfo.total < 5 ? 'отзыва' : 'отзывов'}
                  </Text>
                </View>
              )}

              {/* Reviews list */}
              {reviews.length > 0 && (
                <View style={s.list}>
                  {reviews.map((rv) => (
                    <ReviewRow key={rv.id} review={rv} />
                  ))}
                </View>
              )}

              {/* Separator */}
              <View style={s.sectionGap} />

              {/* Write review form */}
              <View style={s.formSection}>
                <Text style={s.formTitle}>Оставить комментарий</Text>

                {submitted ? (
                  <View style={s.successBox}>
                    <CheckCircle2 size={22} color={COLORS.success} strokeWidth={2} />
                    <Text style={s.successTxt}>
                      Отзыв отправлен на модерацию. Спасибо!
                    </Text>
                  </View>
                ) : (
                  <View style={s.form}>
                    <TextInput
                      style={s.input}
                      placeholder="Ваше имя *"
                      placeholderTextColor="#AAAAAA"
                      value={form.name}
                      onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
                      returnKeyType="next"
                    />
                    <TextInput
                      style={s.input}
                      placeholder="Email *"
                      placeholderTextColor="#AAAAAA"
                      value={form.email}
                      onChangeText={(v) => setForm((f) => ({ ...f, email: v }))}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      returnKeyType="next"
                    />
                    <View style={s.starRow}>
                      <Text style={s.starLabel}>Оценка</Text>
                      <StarSelector
                        value={form.rating}
                        onChange={(n) => setForm((f) => ({ ...f, rating: n }))}
                      />
                    </View>
                    <TextInput
                      style={[s.input, s.inputMulti]}
                      placeholder="Расскажите о поездке *"
                      placeholderTextColor="#AAAAAA"
                      value={form.comment}
                      onChangeText={(v) => setForm((f) => ({ ...f, comment: v }))}
                      multiline
                      numberOfLines={5}
                      textAlignVertical="top"
                    />
                    <Pressable
                      style={({ pressed }) => [
                        s.submitBtn,
                        !canSubmit && { opacity: 0.45 },
                        pressed && { opacity: 0.8 },
                      ]}
                      onPress={submit}
                      disabled={submitting || !canSubmit}
                    >
                      <Text style={s.submitTxt}>
                        {submitting ? 'Отправляем…' : 'Отправить отзыв'}
                      </Text>
                    </Pressable>
                  </View>
                )}
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EEEEEE',
  },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#000' },
  backBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },

  ratingSummary: {
    flexDirection: 'row', alignItems: 'baseline', gap: 10,
    paddingHorizontal: 24, paddingTop: 24, paddingBottom: 8,
  },
  ratingBig:   { fontSize: 26, fontWeight: '700', color: '#000' },
  ratingCount: { fontSize: 15, color: '#6A6A6A' },

  list:       { paddingHorizontal: 24 },
  sectionGap: { height: 8, backgroundColor: '#F5F5F5', marginVertical: 16 },

  formSection: { paddingHorizontal: 24, paddingBottom: 8, gap: 18 },
  formTitle:   { fontSize: 20, fontWeight: '600', color: '#000' },

  form:       { gap: 14 },
  input: {
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: '#222',
    backgroundColor: '#FAFAFA',
  },
  inputMulti: { minHeight: 120, paddingTop: 14 },
  starRow:    { gap: 8 },
  starLabel:  { fontSize: 14, color: '#444' },

  submitBtn: {
    backgroundColor: COLORS.brandNavy,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },

  successBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#E8F7F2', borderRadius: 12, padding: 16,
  },
  successTxt: { fontSize: 14, color: COLORS.success, flex: 1, lineHeight: 20 },
});
