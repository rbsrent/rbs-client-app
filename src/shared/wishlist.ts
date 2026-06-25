import * as SQLite from 'expo-sqlite';

const DB_NAME = 'rbs_wishlist2.db';
export const DEFAULT_GROUP_ID = '__default__';
export const RECENT_GROUP_ID  = '__recent__';
export const ROUTES_GROUP_ID  = '__routes__';

export type GroupType = 'boat' | 'route';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const d = await SQLite.openDatabaseAsync(DB_NAME);
      await d.runAsync('PRAGMA journal_mode = WAL');
      await d.runAsync('PRAGMA foreign_keys = ON');
      await d.execAsync(`
        CREATE TABLE IF NOT EXISTS wishlist_groups (
          id         TEXT PRIMARY KEY NOT NULL,
          name       TEXT NOT NULL,
          type       TEXT NOT NULL DEFAULT 'boat',
          created_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS wishlist_items (
          id               TEXT PRIMARY KEY NOT NULL,
          group_id         TEXT NOT NULL REFERENCES wishlist_groups(id) ON DELETE CASCADE,
          boat_id          TEXT NOT NULL,
          name             TEXT NOT NULL,
          type             TEXT,
          cover_image_url  TEXT,
          price_per_hour   REAL NOT NULL,
          capacity         INTEGER,
          length_meters    REAL,
          pier_name        TEXT,
          rating           REAL,
          saved_at         INTEGER NOT NULL,
          UNIQUE(group_id, boat_id)
        );
        CREATE TABLE IF NOT EXISTS route_group_items (
          id             TEXT PRIMARY KEY NOT NULL,
          group_id       TEXT NOT NULL REFERENCES wishlist_groups(id) ON DELETE CASCADE,
          route_id       TEXT NOT NULL,
          name           TEXT NOT NULL,
          map_image_url  TEXT,
          duration_hours REAL,
          saved_at       INTEGER NOT NULL,
          UNIQUE(group_id, route_id)
        );
      `);
      // migrate existing DBs that don't have type column
      await d.execAsync(
        `ALTER TABLE wishlist_groups ADD COLUMN type TEXT NOT NULL DEFAULT 'boat'`
      ).catch(() => {});
      await ensureDefaultGroups(d);
      return d;
    })();
  }
  return dbPromise;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WishlistGroup {
  id: string;
  name: string;
  type: GroupType;
  created_at: number;
}

export interface WishlistGroupMeta extends WishlistGroup {
  item_count: number;
  preview_urls: string[];
}

export interface WishlistItem {
  id: string;
  group_id: string;
  boat_id: string;
  name: string;
  type: string | null;
  cover_image_url: string | null;
  price_per_hour: number;
  capacity: number | null;
  length_meters: number | null;
  pier_name: string | null;
  rating: number | null;
  saved_at: number;
}

export interface RouteGroupItem {
  id: string;
  group_id: string;
  route_id: string;
  name: string;
  map_image_url: string | null;
  duration_hours: number | null;
  saved_at: number;
}

export interface BoatData {
  boat_id: string;
  name: string;
  type?: string | null;
  cover_image_url?: string | null;
  price_per_hour: number;
  capacity?: number | null;
  length_meters?: number | null;
  pier_name?: string | null;
  rating?: number | null;
}

export interface RouteData {
  route_id: string;
  name: string;
  map_image_url?: string | null;
  duration_hours?: number | null;
}

function uuid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

async function ensureDefaultGroups(d: SQLite.SQLiteDatabase): Promise<void> {
  const defaults: [string, string, GroupType][] = [
    [DEFAULT_GROUP_ID, 'Избранное',              'boat'],
    [RECENT_GROUP_ID,  'Недавно просмотренные',  'boat'],
    [ROUTES_GROUP_ID,  'Маршруты',               'route'],
  ];
  for (const [id, name, type] of defaults) {
    await d.runAsync(
      'INSERT OR IGNORE INTO wishlist_groups (id, name, type, created_at) VALUES (?, ?, ?, ?)',
      [id, name, type, Date.now()],
    );
    // ensure existing __routes__ group has correct type after migration
    if (id === ROUTES_GROUP_ID) {
      await d.runAsync(
        `UPDATE wishlist_groups SET type = 'route' WHERE id = ? AND type = 'boat'`,
        [id],
      );
    }
  }
}

export async function ensureDefaultGroup(): Promise<void> {
  const d = await getDb();
  await ensureDefaultGroups(d);
}

// ─── Groups CRUD ──────────────────────────────────────────────────────────────

export async function createGroup(name: string, type: GroupType = 'boat'): Promise<string> {
  const d  = await getDb();
  const id = uuid();
  await d.runAsync(
    'INSERT INTO wishlist_groups (id, name, type, created_at) VALUES (?, ?, ?, ?)',
    [id, name.trim(), type, Date.now()],
  );
  return id;
}

export async function renameGroup(id: string, name: string): Promise<void> {
  const d = await getDb();
  await d.runAsync('UPDATE wishlist_groups SET name = ? WHERE id = ?', [name.trim(), id]);
}

export async function deleteGroup(id: string): Promise<void> {
  if (id === DEFAULT_GROUP_ID || id === ROUTES_GROUP_ID) return;
  const d = await getDb();
  await d.runAsync('DELETE FROM wishlist_groups WHERE id = ?', [id]);
}

export async function getGroup(id: string): Promise<WishlistGroup | null> {
  const d = await getDb();
  return (await d.getFirstAsync<WishlistGroup>(
    'SELECT * FROM wishlist_groups WHERE id = ?', [id],
  )) ?? null;
}

export async function getAllGroups(type?: GroupType): Promise<WishlistGroupMeta[]> {
  const d = await getDb();
  const groups = type
    ? await d.getAllAsync<WishlistGroup>(
        'SELECT * FROM wishlist_groups WHERE type = ? ORDER BY created_at ASC', [type],
      )
    : await d.getAllAsync<WishlistGroup>(
        'SELECT * FROM wishlist_groups ORDER BY created_at ASC',
      );

  const result: WishlistGroupMeta[] = [];
  for (const g of groups) {
    if (g.type === 'route') {
      const count = await d.getFirstAsync<{ c: number }>(
        'SELECT COUNT(*) as c FROM route_group_items WHERE group_id = ?', [g.id],
      );
      const previews = await d.getAllAsync<{ map_image_url: string }>(
        'SELECT map_image_url FROM route_group_items WHERE group_id = ? AND map_image_url IS NOT NULL ORDER BY saved_at DESC LIMIT 4',
        [g.id],
      );
      result.push({
        ...g,
        item_count: count?.c ?? 0,
        preview_urls: previews.map((p) => p.map_image_url),
      });
    } else {
      const count = await d.getFirstAsync<{ c: number }>(
        'SELECT COUNT(*) as c FROM wishlist_items WHERE group_id = ?', [g.id],
      );
      const previews = await d.getAllAsync<{ cover_image_url: string }>(
        'SELECT cover_image_url FROM wishlist_items WHERE group_id = ? AND cover_image_url IS NOT NULL ORDER BY saved_at DESC LIMIT 4',
        [g.id],
      );
      result.push({
        ...g,
        item_count: count?.c ?? 0,
        preview_urls: previews.map((p) => p.cover_image_url),
      });
    }
  }
  return result;
}


export async function addToRecentlyViewed(boat: BoatData): Promise<void> {
  const d = await getDb();
  await d.runAsync(
    `INSERT INTO wishlist_items
      (id, group_id, boat_id, name, type, cover_image_url, price_per_hour,
       capacity, length_meters, pier_name, rating, saved_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(group_id, boat_id) DO UPDATE SET saved_at = excluded.saved_at`,
    [
      uuid(), RECENT_GROUP_ID, boat.boat_id, boat.name,
      boat.type ?? null, boat.cover_image_url ?? null, boat.price_per_hour,
      boat.capacity ?? null, boat.length_meters ?? null,
      boat.pier_name ?? null, boat.rating ?? null, Date.now(),
    ],
  );
  await d.runAsync(`
    DELETE FROM wishlist_items
    WHERE group_id = '${RECENT_GROUP_ID}'
      AND id NOT IN (
        SELECT id FROM wishlist_items
        WHERE group_id = '${RECENT_GROUP_ID}'
        ORDER BY saved_at DESC LIMIT 30
      )
  `);
}

export async function addToGroup(groupId: string, boat: BoatData): Promise<void> {
  const d = await getDb();
  await d.runAsync(
    `INSERT OR REPLACE INTO wishlist_items
      (id, group_id, boat_id, name, type, cover_image_url, price_per_hour,
       capacity, length_meters, pier_name, rating, saved_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      uuid(), groupId, boat.boat_id, boat.name,
      boat.type ?? null, boat.cover_image_url ?? null, boat.price_per_hour,
      boat.capacity ?? null, boat.length_meters ?? null,
      boat.pier_name ?? null, boat.rating ?? null, Date.now(),
    ],
  );
}

export async function removeFromGroup(groupId: string, boatId: string): Promise<void> {
  const d = await getDb();
  await d.runAsync(
    'DELETE FROM wishlist_items WHERE group_id = ? AND boat_id = ?', [groupId, boatId],
  );
}

export async function removeFromAllGroups(boatId: string): Promise<void> {
  const d = await getDb();
  await d.runAsync('DELETE FROM wishlist_items WHERE boat_id = ?', [boatId]);
}

export async function isInAnyGroup(boatId: string): Promise<boolean> {
  const d   = await getDb();
  const row = await d.getFirstAsync<{ c: number }>(
    'SELECT COUNT(*) as c FROM wishlist_items WHERE boat_id = ? AND group_id != ?',
    [boatId, RECENT_GROUP_ID],
  );
  return (row?.c ?? 0) > 0;
}

export async function isInGroup(groupId: string, boatId: string): Promise<boolean> {
  const d   = await getDb();
  const row = await d.getFirstAsync<{ c: number }>(
    'SELECT COUNT(*) as c FROM wishlist_items WHERE group_id = ? AND boat_id = ?',
    [groupId, boatId],
  );
  return (row?.c ?? 0) > 0;
}

export async function getGroupItems(groupId: string): Promise<WishlistItem[]> {
  const d = await getDb();
  return d.getAllAsync<WishlistItem>(
    'SELECT * FROM wishlist_items WHERE group_id = ? ORDER BY saved_at DESC', [groupId],
  );
}

export async function getGroupsContaining(boatId: string): Promise<string[]> {
  const d    = await getDb();
  const rows = await d.getAllAsync<{ group_id: string }>(
    'SELECT group_id FROM wishlist_items WHERE boat_id = ?', [boatId],
  );
  return rows.map((r) => r.group_id);
}


export async function addRouteToGroup(groupId: string, route: RouteData): Promise<void> {
  const d = await getDb();
  await d.runAsync(
    `INSERT INTO route_group_items
      (id, group_id, route_id, name, map_image_url, duration_hours, saved_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(group_id, route_id) DO UPDATE SET saved_at = excluded.saved_at`,
    [
      uuid(), groupId, route.route_id, route.name,
      route.map_image_url ?? null, route.duration_hours ?? null, Date.now(),
    ],
  );
}

export async function removeRouteFromGroup(groupId: string, routeId: string): Promise<void> {
  const d = await getDb();
  await d.runAsync(
    'DELETE FROM route_group_items WHERE group_id = ? AND route_id = ?', [groupId, routeId],
  );
}

export async function removeRouteFromAllGroups(routeId: string): Promise<void> {
  const d = await getDb();
  await d.runAsync('DELETE FROM route_group_items WHERE route_id = ?', [routeId]);
}

export async function getRouteGroupItems(groupId: string): Promise<RouteGroupItem[]> {
  const d = await getDb();
  return d.getAllAsync<RouteGroupItem>(
    'SELECT * FROM route_group_items WHERE group_id = ? ORDER BY saved_at DESC', [groupId],
  );
}

export async function getRouteGroupsContaining(routeId: string): Promise<string[]> {
  const d    = await getDb();
  const rows = await d.getAllAsync<{ group_id: string }>(
    'SELECT group_id FROM route_group_items WHERE route_id = ?', [routeId],
  );
  return rows.map((r) => r.group_id);
}

export async function isRouteInAnyGroup(routeId: string): Promise<boolean> {
  const d   = await getDb();
  const row = await d.getFirstAsync<{ c: number }>(
    'SELECT COUNT(*) as c FROM route_group_items WHERE route_id = ?', [routeId],
  );
  return (row?.c ?? 0) > 0;
}

export async function getAllRoutesSavedIds(): Promise<string[]> {
  const d    = await getDb();
  const rows = await d.getAllAsync<{ route_id: string }>(
    'SELECT DISTINCT route_id FROM route_group_items',
  );
  return rows.map((r) => r.route_id);
}
