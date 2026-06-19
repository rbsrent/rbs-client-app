import * as Location from 'expo-location';
import { List, Map, MapPin, Navigation, Search, X } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import YaMap, { Circle, Marker } from "react-native-yamap";

import { COLORS } from "@/shared/colors";
import { publicSupabase } from "@/shared/supabase/publicClient";
import { initYaMap } from "@/shared/yamap";
import { Spinner } from '@/shared/components/Spinner';

initYaMap();

interface Pier {
  id: string;
  name: string;
  address: string | null;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
}

type ViewMode = "map" | "list";

// SPb center
const SPB = { lat: 59.9386, lon: 30.3141 };
const PIER_RADIUS = 350; // meters

export default function PiersScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<YaMap>(null);

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

  const fitAll = useCallback(() => {
    if (piersWithCoords.length === 0) return;
    mapRef.current?.fitAllMarkers?.();
  }, [piersWithCoords]);

  const centerOnMe = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    mapRef.current?.setCenter(
      { lat: loc.coords.latitude, lon: loc.coords.longitude },
      15, 0, 0, 0.5,
    );
  }, []);

  const centerOnPier = useCallback((pier: Pier) => {
    if (!pier.latitude || !pier.longitude) return;
    mapRef.current?.setCenter(
      { lat: pier.latitude, lon: pier.longitude },
      16, 0, 0, 0.4,
    );
  }, []);

  const handleMarkerPress = useCallback((pier: Pier) => {
    setFocused(pier);
    centerOnPier(pier);
  }, [centerOnPier]);

  const handleListTap = useCallback(
    (pier: Pier) => {
      setFocused(pier);
      setMode("map");
      setTimeout(() => centerOnPier(pier), 200);
    },
    [centerOnPier],
  );

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Причалы</Text>
        <View style={s.headerRight}>
          <Pressable
            style={[s.modeBtn, mode === "map" && s.modeBtnOn]}
            onPress={() => setMode("map")}
            hitSlop={6}
          >
            <Map size={16} color={mode === "map" ? COLORS.white : COLORS.text2} strokeWidth={2} />
          </Pressable>
          <Pressable
            style={[s.modeBtn, mode === "list" && s.modeBtnOn]}
            onPress={() => setMode("list")}
            hitSlop={6}
          >
            <List size={16} color={mode === "list" ? COLORS.white : COLORS.text2} strokeWidth={2} />
          </Pressable>
        </View>
      </View>

      {/* ── Search ── */}
      <View style={s.searchWrap}>
        <Search size={15} color={COLORS.text3} strokeWidth={2} />
        <TextInput
          style={s.searchInput}
          placeholder="Поиск причала по названию или адресу"
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

      {loading ? (
        <View style={s.loader}>
          <Spinner />
        </View>
      ) : (
        <>
          {/* ── MAP ── */}
          {mode === "map" && (
            <View style={s.mapContainer}>
              <YaMap
                ref={mapRef}
                style={s.map}
                initialRegion={{
                  lat: SPB.lat,
                  lon: SPB.lon,
                  zoom: 12,
                  azimuth: 0,
                  tilt: 0,
                }}
                showUserPosition
                onMapPress={() => setFocused(null)}
              >
                {filteredWithCoords.map((pier) => {
                  const active = focused?.id === pier.id;
                  return (
                    <Marker
                      key={pier.id}
                      point={{ lat: pier.latitude!, lon: pier.longitude! }}
                      scale={active ? 1.3 : 1}
                      onPress={() => handleMarkerPress(pier)}
                    >
                      <View style={[s.pin, active && s.pinActive]}>
                        <MapPin size={active ? 18 : 14} color="#fff" strokeWidth={2.2} />
                      </View>
                    </Marker>
                  );
                })}

                {/* Radius circles */}
                {filteredWithCoords.map((pier) => {
                  const active = focused?.id === pier.id;
                  return (
                    <Circle
                      key={`circle-${pier.id}`}
                      center={{ lat: pier.latitude!, lon: pier.longitude! }}
                      radius={PIER_RADIUS}
                      fillColor={active
                        ? 'rgba(43,196,229,0.15)'
                        : 'rgba(27,42,65,0.07)'}
                      strokeColor={active
                        ? 'rgba(43,196,229,0.6)'
                        : 'rgba(27,42,65,0.2)'}
                    />
                  );
                })}
              </YaMap>

              {/* Center on me */}
              <Pressable
                style={[s.fab, { bottom: focused ? 168 : 80 }]}
                onPress={centerOnMe}
                hitSlop={8}
              >
                <Navigation size={18} color={COLORS.brandNavy} strokeWidth={2} />
              </Pressable>

              {/* Fit all */}
              <Pressable
                style={[s.fab, { bottom: focused ? 224 : 136 }]}
                onPress={fitAll}
                hitSlop={8}
              >
                <MapPin size={18} color={COLORS.brandNavy} strokeWidth={2} />
              </Pressable>

              {/* Pier count badge */}
              <View style={s.countBadge}>
                <MapPin size={12} color={COLORS.brandNavy} strokeWidth={2} />
                <Text style={s.countTxt}>
                  {filteredWithCoords.length} причал
                  {filteredWithCoords.length === 1
                    ? ""
                    : filteredWithCoords.length < 5
                      ? "а"
                      : "ов"}
                </Text>
              </View>

              {/* Focused pier card */}
              {focused && (
                <View style={[s.focusCard, { paddingBottom: insets.bottom + 16 }]}>
                  <View style={s.focusCardInner}>
                    <View style={s.focusIcon}>
                      <MapPin size={20} color={COLORS.brandNavy} strokeWidth={2} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.focusName}>{focused.name}</Text>
                      {focused.address ? (
                        <Text style={s.focusAddr} numberOfLines={2}>{focused.address}</Text>
                      ) : null}
                      {focused.description ? (
                        <Text style={s.focusDesc} numberOfLines={2}>{focused.description}</Text>
                      ) : null}
                    </View>
                    <Pressable onPress={() => setFocused(null)} hitSlop={8}>
                      <X size={18} color={COLORS.text3} strokeWidth={2} />
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* ── LIST ── */}
          {mode === "list" && (
            <ScrollView
              style={s.list}
              contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {filtered.length === 0 ? (
                <View style={s.emptyBox}>
                  <MapPin size={40} color={COLORS.text3} strokeWidth={1.2} />
                  <Text style={s.emptyTxt}>Причалы не найдены</Text>
                  <Text style={s.emptyHint}>Попробуйте другой запрос</Text>
                </View>
              ) : (
                filtered.map((pier, i) => (
                  <Pressable
                    key={pier.id}
                    style={[s.pierRow, i === 0 && { borderTopWidth: 0 }]}
                    onPress={() => handleListTap(pier)}
                  >
                    <View style={s.pierIconWrap}>
                      <MapPin size={18} color={COLORS.brandNavy} strokeWidth={1.8} />
                    </View>
                    <View style={s.pierBody}>
                      <Text style={s.pierName}>{pier.name}</Text>
                      {pier.address ? (
                        <Text style={s.pierAddr} numberOfLines={2}>{pier.address}</Text>
                      ) : null}
                      {pier.description ? (
                        <Text style={s.pierDesc} numberOfLines={3}>{pier.description}</Text>
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
          )}
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.backgroundAlt },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: 20, fontWeight: "800", color: COLORS.text1 },
  headerRight: { flexDirection: "row", gap: 8 },
  modeBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.backgroundAlt,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: COLORS.border,
  },
  modeBtnOn: { backgroundColor: COLORS.brandNavy, borderColor: COLORS.brandNavy },

  searchWrap: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginHorizontal: 16, marginVertical: 10,
    backgroundColor: COLORS.white, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 12, paddingVertical: 11,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.text1 },

  loader: { flex: 1, alignItems: "center", justifyContent: "center" },

  mapContainer: { flex: 1, position: "relative" },
  map: { flex: 1 },

  pin: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: COLORS.brandNavy,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 5,
  },
  pinActive: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: COLORS.brandCyan,
  },

  fab: {
    position: "absolute", right: 16,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.white,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 6, elevation: 6,
    borderWidth: 1, borderColor: COLORS.border,
  },

  countBadge: {
    position: "absolute", top: 10, left: 16,
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: COLORS.white,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1, borderColor: COLORS.border,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 3,
  },
  countTxt: { fontSize: 12, fontWeight: "600", color: COLORS.text1 },

  focusCard: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.white,
    borderTopWidth: 1, borderTopColor: COLORS.border,
    paddingTop: 16, paddingHorizontal: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1, shadowRadius: 10, elevation: 10,
  },
  focusCardInner: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  focusIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: COLORS.brandNavy + "10",
    alignItems: "center", justifyContent: "center",
  },
  focusName: { fontSize: 15, fontWeight: "700", color: COLORS.text1, lineHeight: 20 },
  focusAddr: { fontSize: 13, color: COLORS.text2, marginTop: 3, lineHeight: 18 },
  focusDesc: { fontSize: 12, color: COLORS.text3, marginTop: 4, lineHeight: 17 },

  list: { flex: 1 },
  pierRow: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    paddingHorizontal: 16, paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.border,
    marginBottom: 1,
  },
  pierIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: COLORS.brandNavy + "10",
    alignItems: "center", justifyContent: "center", marginTop: 1,
  },
  pierBody: { flex: 1 },
  pierName: { fontSize: 15, fontWeight: "700", color: COLORS.text1, lineHeight: 20 },
  pierAddr: { fontSize: 13, color: COLORS.text2, marginTop: 3, lineHeight: 18 },
  pierDesc: { fontSize: 12, color: COLORS.text3, marginTop: 4, lineHeight: 17 },
  onMapBadge: {
    flexDirection: "row", alignItems: "center", gap: 3,
    paddingHorizontal: 7, paddingVertical: 3,
    backgroundColor: COLORS.brandCyan + "15",
    borderRadius: 6, marginTop: 2,
  },
  onMapTxt: { fontSize: 10, fontWeight: "600", color: COLORS.brandCyan },

  emptyBox: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 8 },
  emptyTxt: { fontSize: 16, fontWeight: "600", color: COLORS.text2 },
  emptyHint: { fontSize: 13, color: COLORS.text3 },
});
