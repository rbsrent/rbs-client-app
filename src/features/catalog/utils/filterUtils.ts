import { Boat } from "@/store/useCatalogStore";

export interface PierWithCoords {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
}

export type AvailStatus =
  | "fully_available"
  | "partially_available"
  | "not_available";

export interface AvailInfo {
  status: AvailStatus;
  available_hours: number;
  total_hours_in_period: number;
}

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function findPiersInRadius(
  allPiers: PierWithCoords[],
  activePierIds: string[],
  radiusKm: number,
): Set<string> {
  const result = new Set<string>();
  const activePiers = allPiers.filter(
    (p) =>
      activePierIds.includes(p.id) && p.latitude != null && p.longitude != null,
  );
  for (const pier of allPiers) {
    if (pier.latitude == null || pier.longitude == null) continue;
    for (const active of activePiers) {
      const d = haversineKm(
        active.latitude!,
        active.longitude!,
        pier.latitude,
        pier.longitude,
      );
      if (d <= radiusKm) {
        result.add(pier.id);
        break;
      }
    }
  }
  return result;
}

const AVAIL_ORDER: Record<AvailStatus, number> = {
  fully_available: 0,
  partially_available: 1,
  not_available: 2,
};

export type BoatSortBy = "popular" | "price_asc" | "price_desc";

// Mirrors RBS.RENT's Index.tsx sort: pier distance wins outright when a pier
// filter is active (no secondary tie-break); otherwise availability status
// groups the list and price is only a tie-break when the user explicitly
// asked for it — default order otherwise preserves the curated display_order
// from the boats query instead of silently re-sorting by price.
export function sortBoats(
  boats: Boat[],
  opts: {
    pierIds: string[];
    availMap: Record<string, AvailInfo>;
    allPiers: PierWithCoords[];
    radiusKm: number;
    dateActive: boolean;
    sortBy: BoatSortBy;
  },
): Boat[] {
  const { pierIds, availMap, allPiers, radiusKm, dateActive, sortBy } = opts;
  const hasPierFilter = pierIds.length > 0;

  if (hasPierFilter) {
    const activePiers = allPiers.filter(
      (p) =>
        pierIds.includes(p.id) && p.latitude != null && p.longitude != null,
    );
    const distCache = new Map<string, number>();
    for (const boat of boats) {
      const boatPier = allPiers.find((p) => p.id === boat.pier_id);
      if (!boatPier?.latitude || !boatPier?.longitude) {
        distCache.set(boat.id, Infinity);
        continue;
      }
      let minDist = Infinity;
      for (const ap of activePiers) {
        const d = haversineKm(
          ap.latitude!,
          ap.longitude!,
          boatPier.latitude,
          boatPier.longitude,
        );
        if (d < minDist) minDist = d;
      }
      distCache.set(boat.id, minDist);
    }
    return [...boats].sort(
      (a, b) => (distCache.get(a.id) ?? Infinity) - (distCache.get(b.id) ?? Infinity),
    );
  }

  const hasAvailData = dateActive && Object.keys(availMap).length > 0;
  if (!hasAvailData && sortBy === "popular") return boats;

  return [...boats].sort((a, b) => {
    if (hasAvailData) {
      const aa = AVAIL_ORDER[availMap[a.id]?.status ?? "not_available"];
      const ab = AVAIL_ORDER[availMap[b.id]?.status ?? "not_available"];
      if (aa !== ab) return aa - ab;
    }
    if (sortBy === "price_asc") return a.price_per_hour - b.price_per_hour;
    if (sortBy === "price_desc") return b.price_per_hour - a.price_per_hour;
    return 0;
  });
}

import { MONTHS_GEN_RU, MONTHS_S_RU } from "../constants";
import { DateTimeFilter, Filters } from "../types";

export const dtSummary = (dt: DateTimeFilter) =>
  `${dt.date ? fmtShort(dt.date) : "Сегодня"} · ${fmtHour(dt.startHour)} · ${durLabel(dt.durationHours)}`;

export function durLabel(h: number) {
  return h === 1 ? "1 час" : h < 5 ? `${h} часа` : `${h} часов`;
}

export function toLocalDateISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function fmtShort(d: Date) {
  return `${d.getDate()} ${MONTHS_S_RU[d.getMonth()]}`;
}

export function fmtFull(d: Date) {
  return `${d.getDate()} ${MONTHS_GEN_RU[d.getMonth()]} ${d.getFullYear()}`;
}

export function fmtHour(h: number) {
  return `${String(h).padStart(2, "0")}:00`;
}

const _RU_FMT = new Intl.NumberFormat("ru-RU");
export function ruFmt(n: number) {
  return _RU_FMT.format(n);
}

export function countActive(f: Filters): number {
  return [
    f.typeId !== "all",
    f.capacityMin !== null,
    f.priceMin !== null,
    f.priceMax !== null,
    f.hasTarp,
    f.hasToilet,
    f.hasHeating,
    f.dateTime.date !== null,
    f.pierIds.length > 0,
  ].filter(Boolean).length;
}