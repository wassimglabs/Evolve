import { randomUUID } from 'expo-crypto';

import { getDb } from '@/db/client';
import { notify } from '@/db/store';
import type { DailyCheckin, DailyCheckinInput } from '@/db/types';
import { nowIso } from '@/lib/date';

/** daily_checkins keyed by UUID; `date` is UNIQUE (one row per local day). */

export async function createDailyCheckin(input: DailyCheckinInput): Promise<DailyCheckin> {
  const checkin: DailyCheckin = { id: randomUUID(), created_at: nowIso(), ...input };
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO daily_checkins (id, date, energy, focus, mood, note, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?);`,
    checkin.id,
    checkin.date,
    checkin.energy,
    checkin.focus,
    checkin.mood,
    checkin.note,
    checkin.created_at,
  );
  notify('checkins');
  return checkin;
}

export async function getDailyCheckinById(id: string): Promise<DailyCheckin | null> {
  const db = await getDb();
  return db.getFirstAsync<DailyCheckin>(`SELECT * FROM daily_checkins WHERE id = ?;`, id);
}

export async function listDailyCheckins(): Promise<DailyCheckin[]> {
  const db = await getDb();
  return db.getAllAsync<DailyCheckin>(`SELECT * FROM daily_checkins ORDER BY date DESC;`);
}

export async function updateDailyCheckin(
  id: string,
  patch: Partial<{ date: string; energy: number; focus: number; mood: number; note: string | null }>,
): Promise<void> {
  const sets = Object.entries(patch).filter(([, value]) => value !== undefined);
  if (sets.length === 0) return;
  const db = await getDb();
  await db.runAsync(
    `UPDATE daily_checkins SET ${sets.map(([column]) => `${column} = ?`).join(', ')} WHERE id = ?;`,
    [...sets.map(([, value]) => value), id],
  );
  notify('checkins');
}

export async function deleteDailyCheckin(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM daily_checkins WHERE id = ?;`, id);
  notify('checkins');
}
