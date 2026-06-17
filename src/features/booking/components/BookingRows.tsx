import { StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/shared/colors';

// ─── SummaryRow ───────────────────────────────────────────────────────────────

export function SummaryRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[shared.summaryRow, last && { borderBottomWidth: 0 }]}>
      <Text style={shared.summaryLabel}>{label}</Text>
      <Text style={shared.summaryValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

// ─── CalcRow ──────────────────────────────────────────────────────────────────

export function CalcRow({ label, value, green }: { label: string; value: string; green?: boolean }) {
  return (
    <View style={shared.calcRow}>
      <Text style={[shared.calcKey, green && { color: COLORS.success }]}>{label}</Text>
      <Text style={[shared.calcVal, green && { color: COLORS.success }]}>{value}</Text>
    </View>
  );
}

// ─── FormField ────────────────────────────────────────────────────────────────

export function FormField({
  icon,
  label,
  last,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  last: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={[shared.formRow, last && { borderBottomWidth: 0 }]}>
      <View style={shared.formRowInner}>
        {icon}
        <View style={{ flex: 1 }}>
          <Text style={shared.formLabel}>{label}</Text>
          {children}
        </View>
      </View>
    </View>
  );
}

// ─── Shared styles (used across step components) ──────────────────────────────

export const shared = StyleSheet.create({
  /* input */
  input: { flex: 1, fontSize: 14, color: COLORS.text1, padding: 0 },

  /* code row (promo / gift) */
  codeRow:   { flexDirection: 'row', gap: 8 },
  codeInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  applyBtn: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    backgroundColor: COLORS.brandNavy,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 52,
  },
  applyBtnOk:  { backgroundColor: COLORS.success },
  applyBtnDim: { backgroundColor: COLORS.muted },
  applyTxt:    { fontSize: 13, fontWeight: '700', color: COLORS.white },
  errNote:     { fontSize: 12, color: COLORS.error, marginTop: 4 },
  okNote:      { fontSize: 12, color: COLORS.success, fontWeight: '600', marginTop: 4 },

  /* summary card */
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    gap: 12,
  },
  summaryLabel:     { fontSize: 13, color: COLORS.text3, flexShrink: 0 },
  summaryValue:     { fontSize: 13, fontWeight: '600', color: COLORS.text1, flex: 1, textAlign: 'right' },
  summaryCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text2,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  /* calc box */
  calcBox: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginTop: 12,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  calcKey:      { fontSize: 14, color: COLORS.text2 },
  calcVal:      { fontSize: 14, color: COLORS.text1, fontWeight: '600' },
  calcTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: COLORS.brandNavy + '07',
  },
  calcTotalKey: { fontSize: 15, fontWeight: '700', color: COLORS.text1 },
  calcTotalVal: { fontSize: 20, fontWeight: '800', color: COLORS.brandNavy },
  calcHint: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  calcHintTxt: { fontSize: 12, color: COLORS.text3 },

  /* form card */
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  formRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  formRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  formLabel: { fontSize: 11, color: COLORS.text3, marginBottom: 2 },

  /* info box */
  infoBox: {
    backgroundColor: COLORS.backgroundAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    gap: 6,
    marginTop: 8,
  },
  infoBoxTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text1, marginBottom: 2 },
  infoBoxRow:   { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  infoBoxDot:   { fontSize: 13, color: COLORS.text3, lineHeight: 20 },
  infoBoxTxt:   { fontSize: 13, color: COLORS.text2, lineHeight: 20, flex: 1 },
});
