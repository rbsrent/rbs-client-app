import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '@/shared/colors';

export default function ConditionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.navBar}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={s.backBtn}>
          <ArrowLeft size={22} color={COLORS.text1} strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.body, { paddingBottom: insets.bottom + 32 }]}
      >
        <Text style={s.title}>Условия бронирования RBS</Text>
        <Text style={s.lead}>
          Мы понимаем, что планы могут меняться. Ниже — всё, что нужно знать об отмене, переносе и возврате средств.
        </Text>

        <View style={s.divider} />

        <Text style={s.sectionHead}>1. Отмена бронирования</Text>
        <Text style={s.body1}>
          Пожалуйста, сообщите о своём решении как можно раньше. Все запросы рассматриваются по согласованию с менеджером через WhatsApp: +7 (981) 007-65-00
        </Text>

        <Text style={s.subHead}>1.1. Сроки возврата</Text>

        <View style={s.table}>
          <TableRow label="За 30 и более дней до прогулки" value="Возврат 100%" first />
          <TableRow label="За 15–29 дней до прогулки" value="Возврат 75%" />
          <TableRow label="За 7–14 дней до прогулки" value="Возврат 50%" />
          <TableRow label="Менее чем за 7 дней" value="Без возврата" />
        </View>

        <Text style={s.note}>
          Если вы не явились на прогулку и не уведомили нас об отмене или переносе за 3 дня — оплата не возвращается.
        </Text>

        <Text style={[s.sectionHead, s.mt]}>2. Перенос даты</Text>
        <Text style={s.body1}>
          Вы можете перенести прогулку на другую дату — это удобная альтернатива отмене.
        </Text>
        <Text style={s.body1}>
          Допускается не более 2 переносов на одно бронирование. После первого переноса возврат средств не предусмотрен.
        </Text>

        <Text style={[s.sectionHead, s.mt]}>3. Если прогулку отменили мы</Text>
        <Text style={s.body1}>
          В случае отмены по нашей вине (технические неполадки, не связанные с погодой и форс-мажором) вы вправе выбрать полный возврат средств либо перенос на удобную дату.
        </Text>

        <Text style={[s.sectionHead, s.mt]}>4. Когда возврат и перенос невозможны</Text>

        <Text style={s.subHead}>4.1. Погодные условия</Text>
        <Text style={s.body1}>
          Дождь, снег, туман, ветер или прохлада не являются основанием для отмены. Пожалуйста, одевайтесь по погоде.
        </Text>

        <Text style={s.subHead}>4.2. Запрет выхода в акваторию</Text>
        <Text style={s.body1}>
          Исключение: если специальные службы запрещают судам выход в Неву или Финский залив — мы отменим прогулку и вернём средства либо предложим перенос.
        </Text>

        <Text style={s.subHead}>4.3. Отмена разводки мостов</Text>
        <Text style={s.body1}>
          Это не форс-мажор. Если известно заранее, что мосты не будут разводиться (например, в праздники), мы предложим перенос.
        </Text>

        <Text style={s.subHead}>4.4. Неявка или опоздание</Text>
        <Text style={s.body1}>
          Если вы не появились к началу прогулки — стоимость услуги не возвращается.
        </Text>

        <Text style={[s.sectionHead, s.mt]}>5. Изменение маршрута</Text>
        <Text style={s.body1}>
          Маршрут может быть скорректирован из-за уровня воды или иных технических условий. Мы всегда стараемся предложить альтернативу с сохранением впечатлений. Корректировка маршрута не является основанием для возврата или переноса.
        </Text>

        <Text style={[s.sectionHead, s.mt]}>6. Контакты</Text>
        <Text style={s.body1}>WhatsApp / Telegram: +7 (981) 007-65-00</Text>
        <Text style={s.body1}>Звонки: +7 (812) 425-33-60</Text>

        <View style={s.divider} />

        <Text style={s.legalNote}>
          Все услуги оказываются на условиях публичного Договора-оферты ООО «ВИАМОБИ ВОСТОК» (ИНН 7717283732). Совершение оплаты признаётся акцептом оферты в полном объёме (п. 3.2 Договора).
        </Text>

        <Pressable
          style={({ pressed }) => [s.ofertaBtn, pressed && { opacity: 0.6 }]}
          onPress={() => router.push('/booking/oferta' as any)}
        >
          <Text style={s.ofertaBtnTxt}>Открыть Договор-оферту</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function TableRow({ label, value, first }: { label: string; value: string; first?: boolean }) {
  return (
    <View style={[s.tableRow, first && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.border }]}>
      <Text style={s.tableLabel}>{label}</Text>
      <Text style={s.tableValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.white },

  navBar: { paddingHorizontal: 16, paddingVertical: 8 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },

  body: { paddingHorizontal: 24, paddingTop: 8 },

  title: { fontSize: 26, fontWeight: '700', color: COLORS.text1, lineHeight: 32, marginBottom: 12 },
  lead:  { fontSize: 15, color: COLORS.text2, lineHeight: 23 },

  divider: { height: StyleSheet.hairlineWidth, backgroundColor: COLORS.border, marginVertical: 24 },

  sectionHead: { fontSize: 20, fontWeight: '700', color: COLORS.text1, lineHeight: 26, marginBottom: 10 },
  subHead:     { fontSize: 16, fontWeight: '600', color: COLORS.text1, marginTop: 16, marginBottom: 6 },
  body1:       { fontSize: 15, color: COLORS.text2, lineHeight: 23, marginBottom: 8 },
  mt:          { marginTop: 28 },

  note: {
    fontSize: 14, color: COLORS.text3, lineHeight: 21,
    marginTop: 10,
    borderLeftWidth: 3, borderLeftColor: COLORS.border,
    paddingLeft: 12,
  },

  table: {
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginTop: 4, marginBottom: 4,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    gap: 12,
  },
  tableLabel: { flex: 1, fontSize: 14, color: COLORS.text2, lineHeight: 20 },
  tableValue: { fontSize: 14, fontWeight: '600', color: COLORS.text1, textAlign: 'right' },

  legalNote: { fontSize: 13, color: COLORS.text3, lineHeight: 20, marginBottom: 16 },
  ofertaBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.text1,
    alignItems: 'center',
  },
  ofertaBtnTxt: { fontSize: 15, fontWeight: '600', color: COLORS.text1 },
});
