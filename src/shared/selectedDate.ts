import * as SQLite from 'expo-sqlite';

const DB_NAME = 'rbs_wishlist2.db';
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const d = await SQLite.openDatabaseAsync(DB_NAME);
      await d.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS selected_date (
          id       INTEGER PRIMARY KEY NOT NULL DEFAULT 1,
          date_iso TEXT NOT NULL,
          saved_at INTEGER NOT NULL
        );
      `);
      return d;
    })();
  }
  return dbPromise;
}

export async function saveSelectedDate(date: Date): Promise<void> {
  const db = await getDb();
  const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  await db.runAsync(
    `INSERT OR REPLACE INTO selected_date (id, date_iso, saved_at) VALUES (1, ?, ?)`,
    [iso, Date.now()],
  );
}

export async function getSelectedDate(): Promise<Date | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ date_iso: string; saved_at: number }>(
    `SELECT date_iso, saved_at FROM selected_date WHERE id = 1`,
  );
  if (!row) return null;

  // Expire after 7 days
  if (Date.now() - row.saved_at > 7 * 24 * 60 * 60 * 1000) {
    await clearSelectedDate();
    return null;
  }

  const d = new Date(row.date_iso);
  d.setHours(0, 0, 0, 0);

  // Don't return past dates
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (d < today) {
    await clearSelectedDate();
    return null;
  }

  return d;
}

export async function clearSelectedDate(): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM selected_date WHERE id = 1`);
}
