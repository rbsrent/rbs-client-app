import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { ArrowLeft, MapPin, Navigation, Search, X } from "lucide-react-native";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActionSheetIOS,
  Alert,
  Linking,
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
import { Spinner } from "@/shared/components/Spinner";
import { publicSupabase } from "@/shared/supabase/publicClient";

interface Pier {
  id: string;
  name: string;
  address: string | null;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
}

type ViewMode = "map" | "list";

const SPB_REGION = {
  latitude: 59.9386,
  longitude: 30.3141,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
};
const TOOLBAR_H = 52;
const SEARCH_H = 56;

// Prevent MapView onPress from immediately clearing focused after marker tap
function useSuppressMapPress() {
  const suppress = useRef(false);
  const arm = useCallback(() => {
    suppress.current = true;
    setTimeout(() => {
      suppress.current = false;
    }, 350);
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

function openDirections(lat: number, lng: number) {
  if (Platform.OS === "ios") {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: "Проложить маршрут в...",
        options: ["Apple Maps", "Яндекс.Карты", "Отмена"],
        cancelButtonIndex: 2,
      },
      (idx) => {
        if (idx === 0) {
          Linking.openURL(
            `maps://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`,
          );
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
    Alert.alert("Проложить маршрут в...", undefined, [
      {
        text: "Google Maps",
        onPress: () =>
          Linking.openURL(
            `comgooglemaps://?daddr=${lat},${lng}&directionsmode=driving`,
          ).catch(() =>
            Linking.openURL(`https://maps.google.com/?daddr=${lat},${lng}`),
          ),
      },
      {
        text: "Яндекс.Карты",
        onPress: () =>
          Linking.openURL(
            `yandexmaps://maps.yandex.ru/?rtext=~${lat},${lng}&rtt=auto`,
          ).catch(() =>
            Linking.openURL(
              `https://maps.yandex.ru/?rtext=~${lat},${lng}&rtt=auto`,
            ),
          ),
      },
      { text: "Отмена", style: "cancel" },
    ]);
  }
}

export default function PiersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const { suppress, arm } = useSuppressMapPress();

  const [piers, setPiers] = useState<Pier[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<ViewMode>("map");
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState<Pier | null>(null);

  useEffect(() => {
    publicSupabase
      .from("piers")
      .select("id, name, address, description, latitude, longitude")
      .eq("is_active", true)
      .order("name")
      .then(({ data }) => {
        setPiers((data as Pier[]) ?? []);
        setLoading(false);
      });
  }, []);

  const piersWithCoords = useMemo(
    () => piers.filter((p) => p.latitude != null && p.longitude != null),
    [piers],
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return piers;
    const q = query.toLowerCase();
    return piers.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.address ?? "").toLowerCase().includes(q),
    );
  }, [piers, query]);

  const filteredWithCoords = useMemo(
    () => filtered.filter((p) => p.latitude != null && p.longitude != null),
    [filtered],
  );

  const backToSpb = useCallback(() => {
    mapRef.current?.animateToRegion(SPB_REGION, 500);
  }, []);

  const fitAll = useCallback(() => {
    if (piersWithCoords.length === 0) {
      backToSpb();
      return;
    }
    if (piersWithCoords.length === 1) {
      mapRef.current?.animateToRegion(
        {
          latitude: piersWithCoords[0].latitude!,
          longitude: piersWithCoords[0].longitude!,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        500,
      );
      return;
    }
    mapRef.current?.fitToCoordinates(
      piersWithCoords.map((p) => ({
        latitude: p.latitude!,
        longitude: p.longitude!,
      })),
      {
        edgePadding: { top: 120, bottom: 160, left: 60, right: 60 },
        animated: true,
      },
    );
  }, [piersWithCoords, backToSpb]);

  const centerOnMe = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    mapRef.current?.animateToRegion(
      {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      },
      500,
    );
  }, []);

  const handleMarkerPress = useCallback(
    (pier: Pier) => {
      arm(); // suppress the MapView onPress that follows
      setFocused(pier);
      if (pier.latitude && pier.longitude) {
        mapRef.current?.animateToRegion(
          {
            latitude: pier.latitude,
            longitude: pier.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
          400,
        );
      }
    },
    [arm],
  );

  const markerPressHandlers = useMemo(
    () =>
      Object.fromEntries(
        filteredWithCoords.map((p) => [p.id, () => handleMarkerPress(p)]),
      ),
    [filteredWithCoords, handleMarkerPress],
  );

  const handleListTap = useCallback((pier: Pier) => {
    setFocused(pier);
    setMode("map");
    setTimeout(() => {
      if (pier.latitude && pier.longitude) {
        mapRef.current?.animateToRegion(
          {
            latitude: pier.latitude,
            longitude: pier.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
          400,
        );
      }
    }, 250);
  }, []);

  const topPad = insets.top + TOOLBAR_H + SEARCH_H;

  return (
    <View style={s.root}>
      {/* ── Map mode ── */}
      <View style={[StyleSheet.absoluteFill, mode !== "map" && s.hidden]}>
        {!loading ? (
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
            {filteredWithCoords.map((pier) => (
              <PierMarker
                key={pier.id}
                pier={pier}
                active={focused?.id === pier.id}
                onPress={markerPressHandlers[pier.id]}
              />
            ))}
          </MapView>
        ) : (
          <View style={s.mapLoader}>
            <Spinner />
          </View>
        )}

        {/* Count badge */}
        {!loading && (
          <View style={[s.countBadge, { top: topPad + 8 }]}>
            <MapPin size={11} color={COLORS.brandNavy} strokeWidth={2} />
            <Text style={s.countTxt}>
              {filteredWithCoords.length} причал
              {filteredWithCoords.length === 1
                ? ""
                : filteredWithCoords.length < 5
                  ? "а"
                  : "ов"}
            </Text>
          </View>
        )}

        {/* FABs when no card — inside map container is fine (no touch conflict) */}
        {!focused && (
          <>
            <Pressable
              style={[s.fab, s.fabFixed, { bottom: 32 }]}
              onPress={centerOnMe}
              hitSlop={8}
            >
              <Navigation size={18} color={COLORS.brandNavy} strokeWidth={2} />
            </Pressable>
            <Pressable
              style={[s.fab, s.fabFixed, { bottom: 88 }]}
              onPress={fitAll}
              hitSlop={8}
            >
              <MapPin size={18} color={COLORS.brandNavy} strokeWidth={2} />
            </Pressable>
          </>
        )}
      </View>

      {/* ── List mode ── */}
      {/* {mode === "list" && (
        <ScrollView
          style={s.list}
          contentContainerStyle={{
            paddingTop: topPad,
            paddingBottom: insets.bottom + 24,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {loading ? (
            <View style={{ paddingTop: 40, alignItems: "center" }}>
              <Spinner />
            </View>
          ) : filtered.length === 0 ? (
            <View style={s.emptyBox}>
              <MapPin size={40} color={COLORS.text3} strokeWidth={1.2} />
              <Text style={s.emptyTxt}>Причалы не найдены</Text>
              <Text style={s.emptyHint}>Попробуйте другой запрос</Text>
            </View>
          ) : (
            filtered.map((pier, i) => (
              <Pressable
                key={pier.id}
                style={({ pressed }) => [
                  s.pierRow,
                  i === 0 && { borderTopWidth: 0 },
                  pressed && { opacity: 0.85 },
                ]}
                onPress={() => handleListTap(pier)}
              >
                <View style={s.pierIconWrap}>
                  <MapPin
                    size={18}
                    color={COLORS.brandNavy}
                    strokeWidth={1.8}
                  />
                </View>
                <View style={s.pierBody}>
                  <Text style={s.pierName}>{pier.name}</Text>
                  {pier.address ? (
                    <Text style={s.pierAddr} numberOfLines={2}>
                      {pier.address}
                    </Text>
                  ) : null}
                  {pier.description ? (
                    <Text style={s.pierDesc} numberOfLines={3}>
                      {pier.description}
                    </Text>
                  ) : null}
                </View>
                {pier.latitude ? (
                  <View style={s.onMapBadge}>
                    <Map size={11} color={COLORS.brandCyan} strokeWidth={2} />
                    <Text style={s.onMapTxt}>На карте</Text>
                  </View>
                ) : null}
              </Pressable>
            ))
          )}
        </ScrollView>
      )} */}

      {/* ── Floating pier card — direct child of root so MapView cannot intercept touches ── */}
      {focused && mode === "map" && (
        <View style={s.floatingContainer} pointerEvents="box-none">
          <View style={s.fabsRow} pointerEvents="box-none">
            <Pressable
              style={s.fab}
              onPress={fitAll}
              hitSlop={8}
              pointerEvents="auto"
            >
              <MapPin size={18} color={COLORS.brandNavy} strokeWidth={2} />
            </Pressable>
            <Pressable
              style={s.fab}
              onPress={centerOnMe}
              hitSlop={8}
              pointerEvents="auto"
            >
              <Navigation size={18} color={COLORS.brandNavy} strokeWidth={2} />
            </Pressable>
          </View>

          <View
            style={[
              s.card,
              {
                paddingBottom: Math.max(insets.bottom, 16),
                marginBottom: Math.max(insets.bottom + 50, 70),
              },
            ]}
            pointerEvents="auto"
          >
            <Text style={s.focusName} numberOfLines={2}>
              {focused.name}
            </Text>
            {focused.address ? (
              <Text style={s.focusAddr} numberOfLines={2}>
                Санкт-Петербург, {focused.address}
              </Text>
            ) : null}

            {focused.latitude && focused.longitude ? (
              <Pressable
                style={({ pressed }) => [
                  s.dirBtn,
                  pressed && { opacity: 0.75 },
                ]}
                onPress={() =>
                  openDirections(focused.latitude!, focused.longitude!)
                }
              >
                <Text style={s.dirBtnTxt}>Проложить маршрут</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      )}

      {/* ── Toolbar + Search (always on top) ── */}
      <View
        style={[s.toolbarWrap, { paddingTop: insets.top }]}
        pointerEvents="box-none"
      >
        {/* Toolbar row: back + mode toggle */}
        <View style={s.toolbar} pointerEvents="box-none">
          <Pressable
            style={s.backBtn}
            onPress={() => router.back()}
            hitSlop={8}
            pointerEvents="auto"
          >
            <ArrowLeft size={20} color={COLORS.text1} strokeWidth={2} />
          </Pressable>

          {/* <View style={s.modeToggle} pointerEvents="auto">
            <Pressable
              style={[s.modeBtn, mode === "map" && s.modeBtnOn]}
              onPress={() => setMode("map")}
              hitSlop={6}
            >
              <Map
                size={15}
                color={mode === "map" ? COLORS.white : COLORS.text2}
                strokeWidth={2}
              />
            </Pressable>
            <Pressable
              style={[s.modeBtn, mode === "list" && s.modeBtnOn]}
              onPress={() => setMode("list")}
              hitSlop={6}
            >
              <List
                size={15}
                color={mode === "list" ? COLORS.white : COLORS.text2}
                strokeWidth={2}
              />
            </Pressable>
          </View> */}
        </View>

        {/* Search bar */}
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
            {query.length > 0 && (
              <Pressable onPress={() => setQuery("")} hitSlop={8}>
                <X size={14} color={COLORS.text3} strokeWidth={2} />
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.backgroundAlt },
  hidden: { display: "none" },

  // Map
  mapLoader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
  },

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

  // Floating card container (card + FABs above it)
  floatingContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  fabsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
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
  focusClose: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  focusName: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text1,
    lineHeight: 24,
    marginBottom: 4,
    paddingRight: 36,
  },
  focusAddr: {
    fontSize: 13,
    color: "#8E8E93",
    lineHeight: 18,
    marginBottom: 12,
  },
  dirBtn: {
    backgroundColor: "#F2F2F7",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  dirBtnTxt: { fontSize: 16, fontWeight: "500", color: COLORS.text1 },

  // Toolbar
  toolbarWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  toolbar: {
    height: TOOLBAR_H,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  backBtn: {
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
  modeToggle: {
    flexDirection: "row",
    gap: 4,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 6,
  },
  modeBtn: {
    width: 30,
    height: 30,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  modeBtnOn: { backgroundColor: COLORS.brandNavy },

  // Search
  searchOuter: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
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
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text1,
    height: "100%",
  },

  // List mode
  list: { flex: 1 },
  pierRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    marginBottom: 1,
  },
  pierIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.brandNavy + "12",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  pierBody: { flex: 1 },
  pierName: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text1,
    lineHeight: 20,
  },
  pierAddr: { fontSize: 13, color: COLORS.text2, marginTop: 3, lineHeight: 18 },
  pierDesc: { fontSize: 12, color: COLORS.text3, marginTop: 4, lineHeight: 17 },
  onMapBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    backgroundColor: COLORS.brandCyan + "15",
    borderRadius: 6,
    marginTop: 2,
    flexShrink: 0,
  },
  onMapTxt: { fontSize: 10, fontWeight: "600", color: COLORS.brandCyan },

  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    gap: 8,
  },
  emptyTxt: { fontSize: 16, fontWeight: "600", color: COLORS.text2 },
  emptyHint: { fontSize: 13, color: COLORS.text3 },
});
