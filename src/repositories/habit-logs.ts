import { randomUUID } from 'expo-crypto';

import { getDb } from '@/db/client';
import { notify } from '@/db/store';
import type { HabitLog, HabitLogInput } from '@/db/types';
import { nowIso } from '@/lib/date';

/** Habit logs are user records and can be corrected or deleted from the data manager. */

export async function createHabitLog(input: HabitLogInput): Promise<HabitLog> {
  const log: HabitLog = { id: randomUUID(), created_at: nowIso(), ...input };
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO habit_logs (id, habit_id, date, level, duration_min, note, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?);`,
    log.id,
    log.habit_id,
    log.date,
    log.level,
    log.duration_min,
    log.note,
    log.created_at,
  );
  notify('habit_logs');
  return log;
}

export async function getHabitLogById(id: string): Promise<HabitLog | null> {
  const db = await getDb();
  return db.getFirstAsync<HabitLog>(`SELECT * FROM habit_logs WHERE id = ?;`, id);
}

export async function listHabitLogs(): Promise<HabitLog[]> {
  const db = await getDb();
  return db.getAllAsync<HabitLog>(
    `SELECT * FROM habit_logs ORDER BY date DESC, created_at DESC;`,
  );
}

export async function updateHabitLog(id: string, patch: Partial<HabitLogInput>): Promise<void> {
  const sets = Object.entries(patch).filter(([, value]) => value !== undefined);
  if (sets.length === 0) return;
  const db = await getDb();
  await db.runAsync(
    `UPDATE habit_logs SET ${sets.map(([column]) => `${column} = ?`).join(', ')} WHERE id = ?;`,
    [...sets.map(([, value]) => value), id],
  );
  notify('habit_logs');
}

export async function deleteHabitLog(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM habit_logs WHERE id = ?;`, id);
  notify('habit_logs');
}
