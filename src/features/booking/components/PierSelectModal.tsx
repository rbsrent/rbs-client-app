import * as Location from "expo-location";
import { Navigation, MapPin, Search, X } from "lucide-react-native";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { COLORS } from "@/shared/colors";
import { FlamePin } from "@/shared/components/FlamePinPiers";
import type { Pier } from "../types";

const SPB_REGION = {
  latitude: 59.9386,
  longitude: 30.3141,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
};
const TOOLBAR_H = 52;
const SEARCH_H = 56;

function useSuppressMapPress() {
  const suppress = useRef(false);
  const arm = useCallback(() => {
    suppress.current = true;
    setTimeout(() => { suppress.current = false; }, 350);
  }, []);
  return { suppress, arm };
}

const PierMarker = memo(function PierMarker({
  pier,
  active,
  onPress,
}: {
  pier: Pier;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Marker
      coordinate={{ latitude: pier.latitude!, longitude: pier.longitude! }}
      onPress={onPress}
      tracksViewChanges={active}
      anchor={{ x: 0.5, y: 1 }}
    >
      <FlamePin active={active} />
    </Marker>
  );
});

interface Props {
  visible: boolean;
  piers: Pier[];
  selectedPier: Pier | null;
  onSelect: (pier: Pier) => void;
  onClose: () => void;
}

export function PierSelectModal({ visible, piers, selectedPier, onSelect, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const { suppress, arm } = useSuppressMapPress();

  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState<Pier | null>(null);

  const piersWithCoords = useMemo(
    () => piers.filter((p) => p.latitude != null && p.longitude != null),
    [piers],
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return piersWithCoords;
    const q = query.toLowerCase();
    return piersWithCoords.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.address ?? "").toLowerCase().includes(q),
    );
  }, [piersWithCoords, query]);

  const backToSpb = useCallback(() => {
    mapRef.current?.animateToRegion(SPB_REGION, 500);
  }, []);

  const fitAll = useCallback(() => {
    if (piersWithCoords.length === 0) { backToSpb(); return; }
    if (piersWithCoords.length === 1) {
      mapRef.current?.animateToRegion(
        { latitude: piersWithCoords[0].latitude!, longitude: piersWithCoords[0].longitude!, latitudeDelta: 0.01, longitudeDelta: 0.01 },
        500,
      );
      return;
    }
    mapRef.current?.fitToCoordinates(
      piersWithCoords.map((p) => ({ latitude: p.latitude!, longitude: p.longitude! })),
      { edgePadding: { top: 120, bottom: 160, left: 60, right: 60 }, animated: true },
    );
  }, [piersWithCoords, backToSpb]);

  const centerOnMe = useCallback(async () => {
    const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      if (!canAskAgain) {
        Alert.alert(
          "Геолокация отключена",
          "Разрешите доступ в настройках устройства.",
          [{ text: "Отмена", style: "cancel" }, { text: "Открыть настройки", onPress: () => Linking.openSettings() }],
        );
      }
      return;
    }
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    mapRef.current?.animateToRegion(
      { latitude: pos.coords.latitude, longitude: pos.coords.longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 },
      500,
    );
  }, []);

  const handleMarkerPress = useCallback((pier: Pier) => {
    arm();
    setFocused(pier);
    if (pier.latitude && pier.longitude) {
      mapRef.current?.animateToRegion(
        { latitude: pier.latitude, longitude: pier.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 },
        400,
      );
    }
  }, [arm]);

  const markerPressHandlers = useMemo(
    () => Object.fromEntries(filtered.map((p) => [p.id, () => handleMarkerPress(p)])),
    [filtered, handleMarkerPress],
  );

  // On open: focus selectedPier and fit map
  useEffect(() => {
    if (!visible) { setQuery(""); setFocused(null); return; }
    const initial = selectedPier ?? null;
    setFocused(initial);
    setTimeout(() => {
      if (!mapRef.current) return;
      if (initial?.latitude && initial?.longitude) {
        mapRef.current.animateToRegion(
          { latitude: initial.latitude, longitude: initial.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 },
          400,
        );
      } else {
        fitAll();
      }
    }, 400);
  }, [visible, selectedPier, fitAll]);

  const topPad = insets.top + TOOLBAR_H + SEARCH_H;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      {/* collapsable={false} fixes blank MapView on first open in Android */}
      <View style={s.root} collapsable={false}>
        {/* Map */}
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={SPB_REGION}
          showsUserLocation
          showsMyLocationButton={false}
          minZoomLevel={10}
          maxZoomLevel={18}
          onPress={() => {
            if (!suppress.current) {
              setFocused(null);
              setTimeout(backToSpb, 100);
            }
          }}
        >
          {filtered.map((pier) => (
            <PierMarker
              key={pier.id}
              pier={pier}
              active={focused?.id === pier.id}
              onPress={markerPressHandlers[pier.id]}
            />
          ))}
        </MapView>

        {/* Count badge */}
        <View style={[s.countBadge, { top: topPad + 8 }]}>
          <MapPin size={11} color={COLORS.brandNavy} strokeWidth={2} />
          <Text style={s.countTxt}>
            {filtered.length} причал{filtered.length === 1 ? "" : filtered.length < 5 ? "а" : "ов"}
          </Text>
        </View>

        {/* FABs when no card */}
        {!focused && (
          <>
            <Pressable style={[s.fab, s.fabFixed, { bottom: 32 }]} onPress={centerOnMe} hitSlop={8}>
              <Navigation size={18} color={COLORS.brandNavy} strokeWidth={2} />
            </Pressable>
            <Pressable style={[s.fab, s.fabFixed, { bottom: 88 }]} onPress={fitAll} hitSlop={8}>
              <MapPin size={18} color={COLORS.brandNavy} strokeWidth={2} />
            </Pressable>
          </>
        )}

        {/* Floating pier card */}
        {focused && (
          <View style={s.floatingContainer} pointerEvents="box-none">
            <View style={s.fabsRow} pointerEvents="box-none">
              <Pressable style={s.fab} onPress={fitAll} hitSlop={8} pointerEvents="auto">
                <MapPin size={18} color={COLORS.brandNavy} strokeWidth={2} />
              </Pressable>
              <Pressable style={s.fab} onPress={centerOnMe} hitSlop={8} pointerEvents="auto">
                <Navigation size={18} color={COLORS.brandNavy} strokeWidth={2} />
              </Pressable>
            </View>
            <View
              style={[s.card, { paddingBottom: Math.max(insets.bottom, 16), marginBottom: Math.max(insets.bottom + 50, 70) }]}
              pointerEvents="auto"
            >
              <Text style={s.focusName} numberOfLines={2}>{focused.name}</Text>
              {focused.address ? (
                <Text style={s.focusAddr} numberOfLines={2}>Санкт-Петербург, {focused.address}</Text>
              ) : null}
              <Pressable
                style={({ pressed }) => [s.selectBtn, pressed && { opacity: 0.75 }]}
                onPress={() => { onSelect(focused); onClose(); }}
              >
                <Text style={s.selectBtnTxt}>
                  {selectedPier?.id === focused.id ? "Выбрано ✓" : "Выбрать этот причал"}
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Toolbar + Search */}
        <View style={[s.toolbarWrap, { paddingTop: insets.top }]} pointerEvents="box-none">
          <View style={s.toolbar} pointerEvents="box-none">
            <Pressable style={s.closeBtn} onPress={onClose} hitSlop={8} pointerEvents="auto">
              <X size={20} color={COLORS.text1} strokeWidth={2} />
            </Pressable>
          </View>
          <View style={s.searchOuter} pointerEvents="auto">
            <View style={s.searchInner}>
              <Search size={15} color={COLORS.brandNavy} strokeWidth={2} />
              <TextInput
                style={s.searchInput}
                placeholder="Поиск причала"
                placeholderTextColor={COLORS.text3}
                value={query}
                onChangeText={setQuery}
                returnKeyType="search"
                clearButtonMode="while-editing"
              />
              {query.length > 0 && Platform.OS === "android" && (
                <Pressable onPress={() => setQuery("")} hitSlop={8}>
                  <X size={14} color={COLORS.text3} strokeWidth={2} />
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.backgroundAlt },

  countBadge: {
    position: "absolute",
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.white,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  countTxt: { fontSize: 12, fontWeight: "600", color: COLORS.text1 },

  fab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  fabFixed: { position: "absolute", right: 16 },

  floatingContainer: { position: "absolute", bottom: 0, left: 0, right: 0 },
  fabsRow: { flexDirection: "row", justifyContent: "flex-end", gap: 10, paddingHorizontal: 16, marginBottom: 12 },

  card: {
    backgroundColor: "rgba(255,255,255,0.97)",
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  focusName: { fontSize: 18, fontWeight: "600", color: COLORS.text1, lineHeight: 24, marginBottom: 4, paddingRight: 36 },
  focusAddr: { fontSize: 13, color: "#8E8E93", lineHeight: 18, marginBottom: 12 },
  selectBtn: {
    backgroundColor: COLORS.brandNavy,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  selectBtnTxt: { fontSize: 16, fontWeight: "600", color: COLORS.white },

  toolbarWrap: { position: "absolute", top: 0, left: 0, right: 0 },
  toolbar: {
    height: TOOLBAR_H,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 6,
  },
  searchOuter: { paddingHorizontal: 16, paddingVertical: 10 },
  searchInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: SEARCH_H - 20,
    paddingHorizontal: 14,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 6,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.text1, height: "100%" },
});
