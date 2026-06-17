import { Check } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/shared/colors';

// ─── Constants ────────────────────────────────────────────────────────────────

export const STEP_LABELS = ['Дата и время', 'Место и цена', 'Ваши данные', 'Оплата'];

// ─── Component ────────────────────────────────────────────────────────────────

export function StepProgress({ step }: { step: number }) {
  return (
    <View style={p.bar}>
      {STEP_LABELS.map((label, i) => {
        const n      = i + 1;
        const done   = n < step;
        const active = n === step;
        return (
          <View key={i} style={p.item}>
            {i > 0 && (
              <View style={[p.line, done && p.lineDone]} />
            )}
            <View
              style={[
                p.circle,
                done   && p.circleDone,
                active && p.circleActive,
              ]}
            >
              {done ? (
                <Check size={11} color="#fff" strokeWidth={3} />
              ) : (
                <Text style={[p.num, active && p.numActive]}>{n}</Text>
              )}
            </View>
            <Text
              style={[
                p.label,
                active && p.labelActive,
                done   && p.labelDone,
              ]}
              numberOfLines={1}
            >
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const p = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  line: {
    position: 'absolute',
    left: '-50%',
    right: '50%',
    top: 12,
    height: 2,
    backgroundColor: COLORS.border,
    zIndex: 0,
  },
  lineDone: { backgroundColor: COLORS.brandNavy },
  circle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  circleActive: { borderColor: COLORS.brandNavy, backgroundColor: COLORS.brandNavy },
  circleDone:   { borderColor: COLORS.brandNavy, backgroundColor: COLORS.brandNavy },
  num:          { fontSize: 11, fontWeight: '700', color: COLORS.text3 },
  numActive:    { color: COLORS.white },
  label:        { fontSize: 10, color: COLORS.text3, marginTop: 5, textAlign: 'center' },
  labelActive:  { color: COLORS.brandNavy, fontWeight: '700' },
  labelDone:    { color: COLORS.text2 },
});
