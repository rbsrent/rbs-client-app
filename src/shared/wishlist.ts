import * as SQLite from 'expo-sqlite';

const DB_NAME = 'rbs_wishlist2.db';
export const DEFAULT_GROUP_ID = '__default__';
export const RECENT_GROUP_ID  = '__recent__';

let db: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS wishlist_groups (
      id         TEXT PRIMARY KEY NOT NULL,
      name       TEXT NOT NULL,
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
  `);
  await ensureDefaultGroup();
  return db;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WishlistGroup {
  id: string;
  name: string;
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uuid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function ensureDefaultGroup(): Promise<void> {
  const d = await getDb();
  for (const [id, name] of [[DEFAULT_GROUP_ID, 'Избранное'], [RECENT_GROUP_ID, 'Недавно просмотренные']] as const) {
    const exists = await d.getFirstAsync<{ id: string }>(
      'SELECT id FROM wishlist_groups WHERE id = ?', [id],
    );
    if (!exists) {
      await d.runAsync(
        'INSERT INTO wishlist_groups (id, name, created_at) VALUES (?, ?, ?)',
        [id, name, Date.now()],
      );
    }
  }
}

export async function addToRecentlyViewed(boat: BoatData): Promise<void> {
  const d = await getDb();
  // upsert — update saved_at so it moves to top
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
  // keep only last 30
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

// ─── Groups CRUD ──────────────────────────────────────────────────────────────

export async function createGroup(name: string): Promise<string> {
  const d  = await getDb();
  const id = uuid();
  await d.runAsync(
    'INSERT INTO wishlist_groups (id, name, created_at) VALUES (?, ?, ?)',
    [id, name.trim(), Date.now()],
  );
  return id;
}

export async function renameGroup(id: string, name: string): Promise<void> {
  const d = await getDb();
  await d.runAsync('UPDATE wishlist_groups SET name = ? WHERE id = ?', [name.trim(), id]);
}

export async function deleteGroup(id: string): Promise<void> {
  if (id === DEFAULT_GROUP_ID) return; // never delete default
  const d = await getDb();
  await d.runAsync('DELETE FROM wishlist_groups WHERE id = ?', [id]);
}

export async function getAllGroups(): Promise<WishlistGroupMeta[]> {
  const d      = await getDb();
  const groups = await d.getAllAsync<WishlistGroup>(
    'SELECT * FROM wishlist_groups ORDER BY created_at ASC',
  );
  const result: WishlistGroupMeta[] = [];
  for (const g of groups) {
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
  return result;
}

// ─── Items CRUD ───────────────────────────────────────────────────────────────

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
