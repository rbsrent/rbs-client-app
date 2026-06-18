import { Boat } from '@/store/useCatalogStore';

export interface PierWithCoords {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
}

export type AvailStatus = 'fully_available' | 'partially_available' | 'not_available';

export interface AvailInfo {
  status: AvailStatus;
  available_hours: number;
  total_hours_in_period: number;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
    (p) => activePierIds.includes(p.id) && p.latitude != null && p.longitude != null,
  );
  for (const pier of allPiers) {
    if (pier.latitude == null || pier.longitude == null) continue;
    for (const active of activePiers) {
      const d = haversineKm(active.latitude!, active.longitude!, pier.latitude, pier.longitude);
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

export function sortBoats(
  boats: Boat[],
  opts: {
    pierIds: string[];
    availMap: Record<string, AvailInfo>;
    allPiers: PierWithCoords[];
    radiusKm: number;
    dateActive: boolean;
  },
): Boat[] {
  const { pierIds, availMap, allPiers, radiusKm, dateActive } = opts;
  const hasPierFilter = pierIds.length > 0;
  const hasAvailData = dateActive && Object.keys(availMap).length > 0;

  if (!hasPierFilter && !hasAvailData) return boats;

  const piersInRadius = hasPierFilter
    ? findPiersInRadius(allPiers, pierIds, radiusKm)
    : null;

  const distCache = new Map<string, number>();
  if (hasPierFilter) {
    const activePiers = allPiers.filter(
      (p) => pierIds.includes(p.id) && p.latitude != null && p.longitude != null,
    );
    for (const boat of boats) {
      const boatPier = allPiers.find((p) => p.id === boat.pier_id);
      if (!boatPier?.latitude || !boatPier?.longitude) {
        distCache.set(boat.id, Infinity);
        continue;
      }
      let minDist = Infinity;
      for (const ap of activePiers) {
        const d = haversineKm(ap.latitude!, ap.longitude!, boatPier.latitude, boatPier.longitude);
        if (d < minDist) minDist = d;
      }
      distCache.set(boat.id, minDist);
    }
  }

  return [...boats].sort((a, b) => {
    if (hasPierFilter) {
      const da = distCache.get(a.id) ?? Infinity;
      const db = distCache.get(b.id) ?? Infinity;
      if (da !== db) return da - db;
    }
    if (hasAvailData) {
      const aa = AVAIL_ORDER[availMap[a.id]?.status ?? 'not_available'];
      const ab = AVAIL_ORDER[availMap[b.id]?.status ?? 'not_available'];
      if (aa !== ab) return aa - ab;
    }
    return a.price_per_hour - b.price_per_hour;
  });
}
