import { WaterRoute } from './types';

const TTL = 5 * 60 * 1000; // 5 min

let _data: WaterRoute[] | null = null;
let _ts = 0;

export function getCachedRoutes(): WaterRoute[] | null {
  return _data && Date.now() - _ts < TTL ? _data : null;
}

export function setCachedRoutes(data: WaterRoute[]) {
  _data = data;
  _ts = Date.now();
}

export function invalidateRoutesCache() {
  _ts = 0;
}

// ── individual route cache ────────────────────────────────────────────────────
const _detail = new Map<string, { data: WaterRoute; ts: number }>();

export function getCachedRoute(slug: string): WaterRoute | null {
  // check list cache first
  const list = getCachedRoutes();
  if (list) {
    const found = list.find((r) => r.seo_slug === slug || r.id === slug);
    if (found) return found;
  }
  // fall back to individual cache
  const entry = _detail.get(slug);
  if (entry && Date.now() - entry.ts < TTL) return entry.data;
  return null;
}

export function setCachedRoute(slug: string, data: WaterRoute) {
  _detail.set(slug, { data, ts: Date.now() });
}

// ── route preview (for smooth detail transition) ──────────────────────────────
export interface RoutePreview {
  slug:     string;
  name:     string;
  imageUrl: string | null;
}

let _preview: RoutePreview | null = null;

export function setRoutePreview(p: RoutePreview) { _preview = p; }
export function getRoutePreview(slug: string): RoutePreview | null {
  return _preview?.slug === slug ? _preview : null;
}
