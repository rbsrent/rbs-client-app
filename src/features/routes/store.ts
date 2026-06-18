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
