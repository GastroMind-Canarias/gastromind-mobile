import * as SQLite from 'expo-sqlite';
import type { UserFavorite } from '../api/FavoriteService';

const DB_NAME = 'gastromind.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;
let initialized = false;

async function getDb() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME);
  }
  return dbPromise;
}

async function ensureSchema() {
  if (initialized) return;
  const db = await getDb();
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS offline_favorites (
      id TEXT PRIMARY KEY NOT NULL,
      recipe_id TEXT NOT NULL,
      recipe_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      synced_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_offline_favorites_created_at ON offline_favorites(created_at DESC);
  `);
  initialized = true;
}

type OfflineFavoriteRow = {
  id: string;
  recipe_json: string;
  created_at: string;
};

export const favoriteOfflineStore = {
  replaceAll: async (favorites: UserFavorite[]) => {
    await ensureSchema();
    const db = await getDb();
    const syncedAt = new Date().toISOString();

    await db.withTransactionAsync(async () => {
      await db.runAsync('DELETE FROM offline_favorites');
      for (const favorite of favorites) {
        await db.runAsync(
          `INSERT OR REPLACE INTO offline_favorites (id, recipe_id, recipe_json, created_at, synced_at)
           VALUES (?, ?, ?, ?, ?)`,
          [
            favorite.id,
            favorite.recipe.id,
            JSON.stringify(favorite.recipe),
            favorite.createdAt,
            syncedAt,
          ]
        );
      }
    });
  },

  getAll: async (): Promise<UserFavorite[]> => {
    await ensureSchema();
    const db = await getDb();
    const rows = await db.getAllAsync<OfflineFavoriteRow>(
      'SELECT id, recipe_json, created_at FROM offline_favorites ORDER BY created_at DESC'
    );

    return rows
      .map((row) => {
        try {
          return {
            id: row.id,
            recipe: JSON.parse(row.recipe_json),
            createdAt: row.created_at,
          } as UserFavorite;
        } catch {
          return null;
        }
      })
      .filter((item): item is UserFavorite => Boolean(item));
  },
};
