import { CheckCircle2, Star } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { COLORS } from '@/shared/colors';
import { publicSupabase } from '@/shared/supabase/publicClient';

function StarSelector({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} onPress={() => onChange(n)} hitSlop={6}>
          <Star
            size={30}
            color={n <= value ? '#F5A623' : COLORS.border}
            fill={n <= value ? '#F5A623' : 'none'}
            strokeWidth={1.5}
          />
        </Pressable>
      ))}
    </View>
  );
}

function StarDisplay({ value, size = 13 }: { value: number; size?: number }) {
  const filled = Math.round(value);
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          color={n <= filled ? '#F5A623' : COLORS.border}
          fill={n <= filled ? '#F5A623' : 'none'}
          strokeWidth={1.5}
        />
      ))}
    </View>
  );
}

export interface BoatReviewsProps {
  boatId: string;
  averageRating: number;
  totalReviews: number;
  reviews: any[];
  onReviewSubmitted: () => void;
}

export default function BoatReviews({
  boatId,
  averageRating,
  totalReviews,
  reviews,
  onReviewSubmitted,
}: BoatReviewsProps) {
  const [form, setForm] = useState({ name: '', email: '', comment: '', rating: 0 });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submitReview = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.comment.trim() || form.rating === 0) return;
    setSubmitting(true);
    try {
      const { error } = await publicSupabase.from('boat_reviews').insert({
        boat_id: boatId,
        user_name: form.name.trim(),
        user_email: form.email.trim(),
        rating: form.rating,
        comment: form.comment.trim(),
        moderation_status: 'pending',
      });
      if (!error) {
        setSubmitted(true);
        setForm({ name: '', email: '', comment: '', rating: 0 });
        onReviewSubmitted();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ gap: 16 }}>
      <View style={s.reviewsHeader}>
        <Text style={s.sectionTitle}>Отзывы</Text>
        {totalReviews > 0 && (
          <View style={s.ratingRow}>
            <StarDisplay value={averageRating} size={14} />
            <Text style={s.ratingAvg}>{averageRating.toFixed(1)}</Text>
            <Text style={s.ratingCount}>
              · {totalReviews}{' '}
              {totalReviews === 1
                ? 'отзыв'
                : totalReviews < 5
                ? 'отзыва'
                : 'отзывов'}
            </Text>
          </View>
        )}
      </View>

      {reviews.length === 0 ? (
        <Text style={s.noReviews}>Отзывов пока нет. Будьте первым!</Text>
      ) : (
        <View style={{ gap: 12 }}>
          {reviews.map((r) => (
            <View key={r.id} style={s.reviewCard}>
              <View style={s.reviewTop}>
                <Text style={s.reviewName}>{r.user_name}</Text>
                <Text style={s.reviewDate}>
                  {new Date(r.created_at).toLocaleDateString('ru-RU')}
                </Text>
              </View>
              <StarDisplay value={r.rating} size={12} />
              <Text style={s.reviewComment}>{r.comment}</Text>
            </View>
          ))}
        </View>
      )}

      {/* review form */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Оставить отзыв</Text>
        {submitted ? (
          <View style={s.submittedBox}>
            <CheckCircle2 size={22} color={COLORS.success} strokeWidth={2} />
            <Text style={s.submittedText}>
              Отзыв отправлен на модерацию. Спасибо!
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            <TextInput
              style={s.input}
              placeholder="Ваше имя *"
              placeholderTextColor={COLORS.text3}
              value={form.name}
              onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
              returnKeyType="next"
            />
            <TextInput
              style={s.input}
              placeholder="Email *"
              placeholderTextColor={COLORS.text3}
              value={form.email}
              onChangeText={(v) => setForm((f) => ({ ...f, email: v }))}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
            />
            <View>
              <Text style={s.ratingLabel}>Оценка *</Text>
              <StarSelector
                value={form.rating}
                onChange={(n) => setForm((f) => ({ ...f, rating: n }))}
              />
            </View>
            <TextInput
              style={[s.input, s.inputMulti]}
              placeholder="Комментарий *"
              placeholderTextColor={COLORS.text3}
              value={form.comment}
              onChangeText={(v) => setForm((f) => ({ ...f, comment: v }))}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <Pressable
              style={({ pressed }) => [
                s.submitBtn,
                pressed && { opacity: 0.82 },
                (!form.name || !form.email || !form.comment || form.rating === 0) &&
                  s.submitBtnDisabled,
              ]}
              onPress={submitReview}
              disabled={
                submitting ||
                !form.name ||
                !form.email ||
                !form.comment ||
                form.rating === 0
              }
            >
              <Text style={s.submitBtnText}>
                {submitting ? 'Отправляем…' : 'Отправить отзыв'}
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  section: { gap: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text1 },

  reviewsHeader: { gap: 8 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ratingAvg: { fontSize: 14, fontWeight: '700', color: COLORS.text1 },
  ratingCount: { fontSize: 13, color: COLORS.text3 },
  noReviews: { fontSize: 14, color: COLORS.text3 },
  reviewCard: {
    backgroundColor: COLORS.backgroundAlt,
    borderRadius: 12,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reviewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewName: { fontSize: 14, fontWeight: '600', color: COLORS.text1 },
  reviewDate: { fontSize: 12, color: COLORS.text3 },
  reviewComment: { fontSize: 14, color: COLORS.text2, lineHeight: 20, marginTop: 2 },

  ratingLabel: { fontSize: 13, color: COLORS.text2, marginBottom: 8 },
  input: {
    backgroundColor: COLORS.backgroundAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text1,
  },
  inputMulti: { minHeight: 100, paddingTop: 12 },
  submitBtn: {
    backgroundColor: COLORS.brandNavy,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.45 },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  submittedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.successLight,
    borderRadius: 12,
    padding: 14,
  },
  submittedText: { fontSize: 14, color: COLORS.success, flex: 1, lineHeight: 20 },
});
