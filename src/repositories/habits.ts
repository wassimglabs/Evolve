import { randomUUID } from 'expo-crypto';

import { getDb } from '@/db/client';
import type { Habit, HabitInput } from '@/db/types';
import { nowIso } from '@/lib/date';

export async function createHabit(input: HabitInput): Promise<Habit> {
  const habit: Habit = { id: randomUUID(), archived: 0, created_at: nowIso(), ...input };
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO habits (id, name, category, min_target, full_target, preferred_time, archived, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
    habit.id,
    habit.name,
    habit.category,
    habit.min_target,
    habit.full_target,
    habit.preferred_time,
    habit.archived,
    habit.created_at,
  );
  return habit;
}

export async function getHabitById(id: string): Promise<Habit | null> {
  const db = await getDb();
  return db.getFirstAsync<Habit>(`SELECT * FROM habits WHERE id = ?;`, id);
}

export async function listHabits(): Promise<Habit[]> {
  const db = await getDb();
  return db.getAllAsync<Habit>(`SELECT * FROM habits ORDER BY created_at;`);
}

export async function updateHabit(id: string, patch: Partial<HabitInput & { archived: 0 | 1 }>): Promise<void> {
  const sets = Object.entries(patch).filter(([, value]) => value !== undefined);
  if (sets.length === 0) return;
  const db = await getDb();
  await db.runAsync(
    `UPDATE habits SET ${sets.map(([column]) => `${column} = ?`).join(', ')} WHERE id = ?;`,
    [...sets.map(([, value]) => value), id],
  );
}

export async function deleteHabit(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM habits WHERE id = ?;`, id);
}
