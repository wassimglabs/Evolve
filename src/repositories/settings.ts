import { getDb } from '@/db/client';
import type { SettingRow } from '@/db/types';

/** settings is a key/value table: `key` is the primary key, so "getById" is by key. */

export async function createSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`INSERT INTO settings (key, value) VALUES (?, ?);`, key, value);
}

export async function getSettingByKey(key: string): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<SettingRow>(`SELECT * FROM settings WHERE key = ?;`, key);
  return row?.value ?? null;
}

export async function listSettings(): Promise<SettingRow[]> {
  const db = await getDb();
  return db.getAllAsync<SettingRow>(`SELECT * FROM settings ORDER BY key;`);
}

export async function updateSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE settings SET value = ? WHERE key = ?;`, value, key);
}

export async function deleteSetting(key: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM settings WHERE key = ?;`, key);
}
