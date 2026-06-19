import * as Location from 'expo-location';
import { List, Map, MapPin, Navigation, Search, X } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Platform,
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

const SPB = { lat: 59.9386, lon: 30.3141 };
const PIER_RADIUS = 350;
const INITIAL_ZOOM = 13.5;
const PIER_ZOOM = 15.5;

// Heights for overlay math
const HEADER_H = 56;
const SEARCH_H = 64;

export default function PiersScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<YaMap>(null);

  const [piers, setPiers] = useState<Pier[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<ViewMode>("map");
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState<Pier | null>(null);
  const [userLoc, setUserLoc] = useState<{ lat: number; lon: number } | null>(null);

  // Fetch piers
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

  // Request location permission on mount
  useEffect(() => {
    Location.requestForegroundPermissionsAsync().then(({ status }) => {
      if (status !== 'granted') return;
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).then((loc) => {
        setUserLoc({ lat: loc.coords.latitude, lon: loc.coords.longitude });
      });
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
    let loc = userLoc;
    if (!loc) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      loc = { lat: pos.coords.latitude, lon: pos.coords.longitude };
      setUserLoc(loc);
    }
    mapRef.current?.setCenter({ lat: loc.lat, lon: loc.lon }, 15, 0, 0, 0.5);
  }, [userLoc]);

  const focusPier = useCallback((pier: Pier) => {
    if (!pier.latitude || !pier.longitude) return;
    if (userLoc) {
      // fit both user and pier
      mapRef.current?.fitMarkers([
        { lat: userLoc.lat, lon: userLoc.lon },
        { lat: pier.latitude, lon: pier.longitude },
      ]);
    } else {
      mapRef.current?.setCenter(
        { lat: pier.latitude, lon: pier.longitude },
        PIER_ZOOM, 0, 0, 0.4,
      );
    }
  }, [userLoc]);

  const handleMarkerPress = useCallback((pier: Pier) => {
    setFocused(pier);
    // zoom to pier on marker tap
    if (pier.latitude && pier.longitude) {
      mapRef.current?.setCenter(
        { lat: pier.latitude, lon: pier.longitude },
        PIER_ZOOM, 0, 0, 0.4,
      );
    }
  }, []);

  const handleListTap = useCallback(
    (pier: Pier) => {
      setFocused(pier);
      setMode("map");
      setTimeout(() => {
        if (pier.latitude && pier.longitude) {
          mapRef.current?.setCenter(
            { lat: pier.latitude, lon: pier.longitude },
            PIER_ZOOM, 0, 0, 0.4,
          );
        }
      }, 250);
    },
    [],
  );

  const topPad = insets.top + HEADER_H + SEARCH_H + 8;

  return (
    <View style={s.root}>
      {/* ── Full screen map ── */}
      <View style={[StyleSheet.absoluteFill, mode !== 'map' && s.hidden]}>
        {!loading && (
          <YaMap
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            initialRegion={{
              lat: SPB.lat,
              lon: SPB.lon,
              zoom: INITIAL_ZOOM,
              azimuth: 0,
              tilt: 0,
            }}
            showUserPosition
            userLocationAccuracyFillColor="rgba(43,196,229,0.12)"
            userLocationAccuracyStrokeColor="rgba(43,196,229,0.5)"
            userLocationAccuracyStrokeWidth={1.5}
            onMapPress={() => setFocused(null)}
          >
            {filteredWithCoords.map((pier) => {
              const active = focused?.id === pier.id;
              return (
                <Marker
                  key={pier.id}
                  point={{ lat: pier.latitude!, lon: pier.longitude! }}
                  scale={active ? 1.25 : 1}
                  onPress={() => handleMarkerPress(pier)}
                >
                  <View style={[s.pin, active && s.pinActive]}>
                    <MapPin
                      size={active ? 17 : 14}
                      color="#fff"
                      strokeWidth={2.5}
                    />
                  </View>
                </Marker>
              );
            })}

            {filteredWithCoords.map((pier) => {
              const active = focused?.id === pier.id;
              return (
                <Circle
                  key={`c-${pier.id}`}
                  center={{ lat: pier.latitude!, lon: pier.longitude! }}
                  radius={PIER_RADIUS}
                  fillColor={active
                    ? 'rgba(43,196,229,0.18)'
                    : 'rgba(27,42,65,0.06)'}
                  strokeColor={active
                    ? 'rgba(43,196,229,0.55)'
                    : 'rgba(27,42,65,0.18)'}
                  strokeWidth={active ? 2 : 1}
                />
              );
            })}
          </YaMap>
        )}

        {loading && (
          <View style={s.mapLoader}>
            <Spinner />
          </View>
        )}

        {/* Count badge */}
        {!loading && (
          <View style={[s.countBadge, { top: topPad }]}>
            <MapPin size={11} color={COLORS.brandNavy} strokeWidth={2} />
            <Text style={s.countTxt}>
              {filteredWithCoords.length} причал
              {filteredWithCoords.length === 1 ? "" : filteredWithCoords.length < 5 ? "а" : "ов"}
            </Text>
          </View>
        )}

        {/* FABs */}
        <Pressable
          style={[s.fab, { bottom: focused ? 192 : 32 }]}
          onPress={centerOnMe}
          hitSlop={8}
        >
          <Navigation size={18} color={COLORS.brandNavy} strokeWidth={2} />
        </Pressable>
        <Pressable
          style={[s.fab, { bottom: focused ? 248 : 88 }]}
          onPress={fitAll}
          hitSlop={8}
        >
          <MapPin size={18} color={COLORS.brandNavy} strokeWidth={2} />
        </Pressable>

        {/* Focused pier card */}
        {focused && (
          <View style={[s.focusCard, { paddingBottom: insets.bottom + 16 }]}>
            <View style={s.focusDrag} />
            <View style={s.focusCardInner}>
              <View style={s.focusIconWrap}>
                <MapPin size={20} color={COLORS.brandCyan} strokeWidth={2} />
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
              <View style={s.focusActions}>
                <Pressable
                  style={s.fitBtn}
                  onPress={() => focusPier(focused)}
                  hitSlop={8}
                >
                  <Navigation size={15} color={COLORS.brandCyan} strokeWidth={2} />
                  <Text style={s.fitBtnTxt}>Показать путь</Text>
                </Pressable>
                <Pressable onPress={() => setFocused(null)} hitSlop={8} style={s.closeBtn}>
                  <X size={16} color={COLORS.text3} strokeWidth={2} />
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* ── List mode ── */}
      {mode === 'list' && (
        <ScrollView
          style={s.list}
          contentContainerStyle={[s.listContent, { paddingTop: topPad, paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {loading ? (
            <View style={s.listLoader}><Spinner /></View>
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

      {/* ── Floating header ── */}
      <View style={[s.headerWrap, { paddingTop: insets.top }]} pointerEvents="box-none">
        <View style={s.header}>
          <Text style={s.headerTitle}>Причалы</Text>
          <View style={s.modeToggle}>
            <Pressable
              style={[s.modeBtn, mode === "map" && s.modeBtnOn]}
              onPress={() => setMode("map")}
              hitSlop={6}
            >
              <Map size={15} color={mode === "map" ? COLORS.white : COLORS.text2} strokeWidth={2} />
            </Pressable>
            <Pressable
              style={[s.modeBtn, mode === "list" && s.modeBtnOn]}
              onPress={() => setMode("list")}
              hitSlop={6}
            >
              <List size={15} color={mode === "list" ? COLORS.white : COLORS.text2} strokeWidth={2} />
            </Pressable>
          </View>
        </View>

        {/* Search */}
        <View style={s.searchWrap}>
          <Search size={15} color={COLORS.text3} strokeWidth={2} />
          <TextInput
            style={s.searchInput}
            placeholder="Поиск по названию или адресу"
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
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.backgroundAlt },
  hidden: { display: 'none' },

  // ── Map
  mapLoader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },

  pin: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.brandNavy,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 5,
  },
  pinActive: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.brandCyan,
  },

  countBadge: {
    position: 'absolute', left: 16,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.white,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1, borderColor: COLORS.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 3,
  },
  countTxt: { fontSize: 12, fontWeight: '600', color: COLORS.text1 },

  fab: {
    position: 'absolute', right: 16,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.white,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 6, elevation: 6,
    borderWidth: 1, borderColor: COLORS.border,
  },

  focusCard: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 16, paddingTop: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12, shadowRadius: 12, elevation: 12,
  },
  focusDrag: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: COLORS.greyDark,
    alignSelf: 'center', marginBottom: 14,
  },
  focusCardInner: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  focusIconWrap: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: COLORS.brandCyan + '15',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  focusName: { fontSize: 15, fontWeight: '700', color: COLORS.text1, lineHeight: 20 },
  focusAddr: { fontSize: 13, color: COLORS.text2, marginTop: 3, lineHeight: 18 },
  focusDesc: { fontSize: 12, color: COLORS.text3, marginTop: 4, lineHeight: 17 },
  focusActions: { alignItems: 'flex-end', gap: 8, flexShrink: 0 },
  fitBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    backgroundColor: COLORS.brandCyan + '15',
    borderRadius: 10,
  },
  fitBtnTxt: { fontSize: 12, fontWeight: '600', color: COLORS.brandCyan },
  closeBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.muted,
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Floating header
  headerWrap: {
    position: 'absolute', top: 0, left: 0, right: 0,
    pointerEvents: 'box-none',
  },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    height: HEADER_H,
    paddingHorizontal: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 6,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text1 },
  modeToggle: {
    flexDirection: 'row', gap: 6,
    backgroundColor: COLORS.backgroundAlt,
    borderRadius: 12, padding: 4,
    borderWidth: 1, borderColor: COLORS.border,
  },
  modeBtn: {
    width: 32, height: 32, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  modeBtnOn: { backgroundColor: COLORS.brandNavy },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    height: SEARCH_H,
    paddingHorizontal: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 3,
  },
  searchInputInner: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.backgroundAlt,
    borderRadius: 12, borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 12, height: 42,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.text1, height: 42 },

  // ── List
  list: { flex: 1 },
  listContent: {},
  listLoader: { paddingTop: 40, alignItems: 'center' },
  pierRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    paddingHorizontal: 16, paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.border,
    marginBottom: 1,
  },
  pierIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: COLORS.brandNavy + '12',
    alignItems: 'center', justifyContent: 'center', marginTop: 1,
  },
  pierBody: { flex: 1 },
  pierName: { fontSize: 15, fontWeight: '700', color: COLORS.text1, lineHeight: 20 },
  pierAddr: { fontSize: 13, color: COLORS.text2, marginTop: 3, lineHeight: 18 },
  pierDesc: { fontSize: 12, color: COLORS.text3, marginTop: 4, lineHeight: 17 },
  onMapBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 7, paddingVertical: 3,
    backgroundColor: COLORS.brandCyan + '15',
    borderRadius: 6, marginTop: 2, flexShrink: 0,
  },
  onMapTxt: { fontSize: 10, fontWeight: '600', color: COLORS.brandCyan },

  emptyBox: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 8 },
  emptyTxt: { fontSize: 16, fontWeight: '600', color: COLORS.text2 },
  emptyHint: { fontSize: 13, color: COLORS.text3 },
});
