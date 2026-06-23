import { Clock } from "lucide-react-native";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { Spinner } from "./Spinner";

interface Props {
  amount: number;
  paying?: boolean;
  onResume: () => void;
  onCancel: () => void;
  cancelConfirmMessage?: string;
}

export function PendingPaymentBanner({
  amount,
  paying = false,
  onResume,
  onCancel,
  cancelConfirmMessage = "Незавершённая бронь будет отменена. Вы сможете создать новую.",
}: Props) {
  const handleCancel = () => {
    Alert.alert("Отменить бронирование?", cancelConfirmMessage, [
      { text: "Назад", style: "cancel" },
      { text: "Отменить бронь", style: "destructive", onPress: onCancel },
    ]);
  };

  return (
    <View style={s.banner}>
      <View style={s.titleRow}>
        <Clock size={16} color="#C47A00" strokeWidth={2} />
        <Text style={s.title}>Незавершённая оплата</Text>
      </View>
      <Text style={s.sub}>
        Вы не завершили оплату на{" "}
        {amount.toLocaleString("ru-RU")} ₽. Продолжите или отмените бронь.
      </Text>
      <View style={s.actions}>
        <Pressable
          style={({ pressed }) => [s.resumeBtn, pressed && { opacity: 0.7 }]}
          onPress={onResume}
          disabled={paying}
        >
          {paying ? (
            <Spinner size={16} color="#fff" />
          ) : (
            <Text style={s.resumeTxt}>Продолжить оплату</Text>
          )}
        </Pressable>
        <Pressable
          style={({ pressed }) => [s.cancelBtn, pressed && { opacity: 0.7 }]}
          onPress={handleCancel}
          disabled={paying}
        >
          <Text style={s.cancelTxt}>Отменить</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  banner: {
    backgroundColor: "#FFF8E7",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F5C842",
    padding: 14,
    gap: 6,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  title: { fontSize: 14, fontWeight: "700", color: "#7A5000" },
  sub: { fontSize: 13, color: "#7A5000", lineHeight: 18 },
  actions: { flexDirection: "row", gap: 10, marginTop: 4 },
  resumeBtn: {
    flex: 1,
    backgroundColor: "#C47A00",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  resumeTxt: { fontSize: 14, fontWeight: "700", color: "#fff" },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelTxt: { fontSize: 14, fontWeight: "600", color: "#7A5000" },
});
