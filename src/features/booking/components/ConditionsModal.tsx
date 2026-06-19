import { ArrowLeft } from 'lucide-react-native';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '@/shared/colors';

interface Props {
  visible: boolean;
  onClose: () => void;
  onOpenOferta: () => void;
}

export function ConditionsModal({ visible, onClose, onOpenOferta }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={c.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Pressable style={[c.sheet, { paddingBottom: insets.bottom + 16 }]} onPress={() => {}}>
          <View style={c.handleBar} />

          <View style={c.navRow}>
            <Pressable onPress={onClose} hitSlop={12} style={c.backBtn}>
              <ArrowLeft size={20} color={COLORS.text1} strokeWidth={2} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={c.body}
          >
            {/* Title */}
            <Text style={c.title}>Условия бронирования RBS</Text>
            <Text style={c.lead}>
              Мы понимаем, что планы могут меняться. Ниже — всё, что нужно знать об отмене, переносе и возврате средств.
            </Text>

            <View style={c.divider} />

            {/* Section 1 */}
            <Text style={c.sectionHead}>1. Отмена бронирования</Text>
            <Text style={c.body1}>
              Пожалуйста, сообщите о своём решении как можно раньше. Все запросы рассматриваются по согласованию с менеджером через WhatsApp: +7 (981) 007-65-00
            </Text>

            <Text style={c.subHead}>1.1. Сроки возврата</Text>

            <View style={c.table}>
              <TableRow label="За 30 и более дней до прогулки" value="Возврат 100%" first />
              <TableRow label="За 15–29 дней до прогулки" value="Возврат 75%" />
              <TableRow label="За 7–14 дней до прогулки" value="Возврат 50%" />
              <TableRow label="Менее чем за 7 дней" value="Без возврата" />
            </View>

            <Text style={c.note}>
              Если вы не явились на прогулку и не уведомили нас об отмене или переносе за 3 дня — оплата не возвращается.
            </Text>

            {/* Section 2 */}
            <Text style={[c.sectionHead, c.mt32]}>2. Перенос даты</Text>
            <Text style={c.body1}>
              Вы можете перенести прогулку на другую дату — это удобная альтернатива отмене.
            </Text>
            <Text style={c.body1}>
              Допускается не более 2 переносов на одно бронирование. После первого переноса возврат средств не предусмотрен.
            </Text>

            {/* Section 3 */}
            <Text style={[c.sectionHead, c.mt32]}>3. Если прогулку отменили мы</Text>
            <Text style={c.body1}>
              В случае отмены по нашей вине (технические неполадки, не связанные с погодой и форс-мажором) вы вправе выбрать полный возврат средств либо перенос на удобную дату.
            </Text>

            {/* Section 4 */}
            <Text style={[c.sectionHead, c.mt32]}>4. Когда возврат и перенос невозможны</Text>

            <Text style={c.subHead}>4.1. Погодные условия</Text>
            <Text style={c.body1}>
              Дождь, снег, туман, ветер или прохлада не являются основанием для отмены. Пожалуйста, одевайтесь по погоде — комфорт на открытых палубах зависит от вашей подготовки.
            </Text>

            <Text style={c.subHead}>4.2. Запрет выхода в акваторию</Text>
            <Text style={c.body1}>
              Исключение: если специальные службы запрещают судам выход в Неву или Финский залив — мы отменим прогулку и вернём средства либо предложим перенос.
            </Text>

            <Text style={c.subHead}>4.3. Отмена разводки мостов</Text>
            <Text style={c.body1}>
              Это не форс-мажор. Если известно заранее, что мосты не будут разводиться (например, в праздники), мы предложим перенос на другую дату.
            </Text>

            <Text style={c.subHead}>4.4. Неявка или опоздание</Text>
            <Text style={c.body1}>
              Если вы не появились к началу прогулки — стоимость услуги не возвращается.
            </Text>

            {/* Section 5 */}
            <Text style={[c.sectionHead, c.mt32]}>5. Изменение маршрута</Text>
            <Text style={c.body1}>
              Маршрут может быть скорректирован из-за уровня воды или иных технических условий. Мы всегда стараемся предложить альтернативный маршрут с сохранением впечатлений. Корректировка маршрута не является основанием для возврата или переноса.
            </Text>

            {/* Section 6 */}
            <Text style={[c.sectionHead, c.mt32]}>6. Контакты</Text>
            <Text style={c.body1}>WhatsApp / Telegram: +7 (981) 007-65-00</Text>
            <Text style={c.body1}>Звонки: +7 (812) 425-33-60</Text>

            <View style={c.divider} />

            <Text style={c.legalNote}>
              Все услуги Платформы оказываются на условиях публичного Договора-оферты ООО «ВИАМОБИ ВОСТОК» (ИНН 7717283732). Совершение оплаты признаётся акцептом оферты в полном объёме (п. 3.2 Договора).
            </Text>

            <Pressable
              style={({ pressed }) => [c.ofertaBtn, pressed && { opacity: 0.6 }]}
              onPress={onOpenOferta}
            >
              <Text style={c.ofertaBtnTxt}>Открыть Договор-оферту</Text>
            </Pressable>
          </ScrollView>
        </Pressable>
      </View>
    </Modal>
  );
}

function TableRow({ label, value, first }: { label: string; value: string; first?: boolean }) {
  return (
    <View style={[c.tableRow, first && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.border }]}>
      <Text style={c.tableLabel}>{label}</Text>
      <Text style={c.tableValue}>{value}</Text>
    </View>
  );
}

const c = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '93%',
  },
  handleBar: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 0,
  },
  navRow: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },
  backBtn: {
    width: 36, height: 36,
    alignItems: 'center', justifyContent: 'center',
  },

  body: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 16 },

  title: {
    fontSize: 26, fontWeight: '700', color: COLORS.text1,
    lineHeight: 32, marginBottom: 12,
  },
  lead: {
    fontSize: 15, color: COLORS.text2, lineHeight: 23,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
    marginVertical: 24,
  },

  sectionHead: {
    fontSize: 20, fontWeight: '700', color: COLORS.text1,
    lineHeight: 26, marginBottom: 12,
  },
  subHead: {
    fontSize: 16, fontWeight: '600', color: COLORS.text1,
    marginTop: 18, marginBottom: 8,
  },
  body1: {
    fontSize: 15, color: COLORS.text2, lineHeight: 23,
    marginBottom: 8,
  },
  note: {
    fontSize: 14, color: COLORS.text3, lineHeight: 21,
    marginTop: 12,
    borderLeftWidth: 3, borderLeftColor: COLORS.border,
    paddingLeft: 12,
  },
  mt32: { marginTop: 32 },

  table: {
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginTop: 4,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    gap: 12,
  },
  tableLabel: {
    flex: 1, fontSize: 14, color: COLORS.text2, lineHeight: 20,
  },
  tableValue: {
    fontSize: 14, fontWeight: '600', color: COLORS.text1,
    textAlign: 'right',
  },

  legalNote: {
    fontSize: 13, color: COLORS.text3, lineHeight: 20,
    marginBottom: 16,
  },
  ofertaBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.text1,
    alignItems: 'center',
    marginBottom: 8,
  },
  ofertaBtnTxt: {
    fontSize: 15, fontWeight: '600', color: COLORS.text1,
  },
});
