import { X } from 'lucide-react-native';
import { useRef } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '@/shared/colors';
import { FlamePin } from '@/shared/components/FlamePinPiers';

interface Props {
  visible: boolean;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  onClose: () => void;
}

function openDirections(lat: number, lng: number) {
  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: 'Проложить маршрут в...',
        options: ['Apple Maps', 'Яндекс.Карты', 'Отмена'],
        cancelButtonIndex: 2,
      },
      (idx) => {
        if (idx === 0) {
          Linking.openURL(`maps://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`);
        } else if (idx === 1) {
          Linking.openURL(
            `yandexmaps://maps.yandex.ru/?rtext=~${lat},${lng}&rtt=auto`,
          ).catch(() =>
            Linking.openURL(
              `https://maps.yandex.ru/?rtext=~${lat},${lng}&rtt=auto`,
            ),
          );
        }
      },
    );
  } else {
    Alert.alert('Проложить маршрут в...', undefined, [
      {
        text: 'Google Maps',
        onPress: () =>
          Linking.openURL(
            `comgooglemaps://?daddr=${lat},${lng}&directionsmode=driving`,
          ).catch(() =>
            Linking.openURL(`https://maps.google.com/?daddr=${lat},${lng}`),
          ),
      },
      {
        text: 'Яндекс.Карты',
        onPress: () =>
          Linking.openURL(
            `yandexmaps://maps.yandex.ru/?rtext=~${lat},${lng}&rtt=auto`,
          ).catch(() =>
            Linking.openURL(
              `https://maps.yandex.ru/?rtext=~${lat},${lng}&rtt=auto`,
            ),
          ),
      },
      { text: 'Отмена', style: 'cancel' },
    ]);
  }
}

export function PierLocationModal({
  visible,
  name,
  address,
  latitude,
  longitude,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={s.root}>
        {/* MAP */}
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={{
            latitude,
            longitude,
            latitudeDelta: 0.0045,
            longitudeDelta: 0.0045,
          }}
        >
          <Marker
            coordinate={{ latitude, longitude }}
            anchor={{ x: 0.5, y: 1 }}
          >
            <FlamePin />
          </Marker>
        </MapView>

        {/* HEADER */}
        <View
          style={[
            s.header,
            { paddingTop: insets.top },
          ]}
        >
          <Text style={s.title}>Карта</Text>

          <Pressable onPress={onClose} style={s.closeArea}>
            <X size={22} color={COLORS.text1} />
          </Pressable>
        </View>

        {/* FLOATING CARD */}
        <View style={s.floatingContainer}>
          <View
            style={[
              s.card,
              {
                paddingBottom: Math.max(insets.bottom, 16),
                marginBottom: Math.max(insets.bottom + 50, 70),
              },
            ]}
          >
            <Text style={s.pierName}>{name}</Text>

            {address && (
              <Text style={s.pierAddr}>
                Санкт-Петербург, {address}
              </Text>
            )}

            <Pressable
              style={({ pressed }) => [
                s.dirBtn,
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => openDirections(latitude, longitude)}
            >
              <Text style={s.dirBtnTxt}>Проложить маршрут</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },

  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,

    alignItems: 'center',
    justifyContent: 'center',

    paddingBottom: 12,
    paddingHorizontal: 52,

    backgroundColor: COLORS.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
  },

  title: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text1,
  },

  closeArea: {
    position: 'absolute',
    right: 16,
    bottom: 12,
  },

  floatingContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },

  card: {
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 18,

    paddingHorizontal: 20,
    paddingTop: 20,

    marginHorizontal: 16,
    marginBottom: 32,

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },

  pierName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text1,
    marginBottom: 4,
  },

  pierAddr: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 12,
  },

  dirBtn: {
    backgroundColor: '#F2F2F7',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },

  dirBtnTxt: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text1,
  },
});