import * as SQLite from 'expo-sqlite';
import { create } from 'zustand';

const DB_NAME = 'rbs_wishlist2.db';

let db: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS saved_routes (
      route_id TEXT PRIMARY KEY NOT NULL,
      saved_at INTEGER NOT NULL
    );
  `);
  return db;
}

interface RouteSavedStore {
  savedIds: Set<string>;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  isSaved: (id: string) => boolean;
  toggle: (id: string) => Promise<boolean>;
  remove: (id: string) => Promise<void>;
}

export async function getSavedRoutesWithDates(): Promise<{ route_id: string; saved_at: number }[]> {
  const d = await getDb();
  return d.getAllAsync<{ route_id: string; saved_at: number }>(
    'SELECT route_id, saved_at FROM saved_routes ORDER BY saved_at DESC',
  );
}

export const useRouteSavedStore = create<RouteSavedStore>((set, get) => ({
  savedIds: new Set(),
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;
    const d = await getDb();
    const rows = await d.getAllAsync<{ route_id: string }>('SELECT route_id FROM saved_routes');
    set({ savedIds: new Set(rows.map((r) => r.route_id)), hydrated: true });
  },

  isSaved: (id) => get().savedIds.has(id),

  remove: async (id) => {
    const d = await getDb();
    await d.runAsync('DELETE FROM saved_routes WHERE route_id = ?', id);
    set((s) => {
      const next = new Set(s.savedIds);
      next.delete(id);
      return { savedIds: next };
    });
  },

  toggle: async (id) => {
    const d = await getDb();
    const alreadySaved = get().savedIds.has(id);
    if (alreadySaved) {
      await d.runAsync('DELETE FROM saved_routes WHERE route_id = ?', id);
      set((s) => {
        const next = new Set(s.savedIds);
        next.delete(id);
        return { savedIds: next };
      });
      return false;
    } else {
      await d.runAsync(
        'INSERT OR REPLACE INTO saved_routes (route_id, saved_at) VALUES (?, ?)',
        id,
        Date.now(),
      );
      set((s) => {
        const next = new Set(s.savedIds);
        next.add(id);
        return { savedIds: next };
      });
      return true;
    }
  },
}));
