import { randomUUID } from 'expo-crypto';

import { getDb } from '@/db/client';
import { notify } from '@/db/store';
import type { Habit, HabitInput } from '@/db/types';
import { nowIso } from '@/lib/date';

export async function createHabit(input: HabitInput): Promise<Habit> {
  const habit: Habit = { id: randomUUID(), archived: 0, created_at: nowIso(), ...input };
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO habits (id, name, category, days, min_target, full_target, preferred_time, archived, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    habit.id,
    habit.name,
    habit.category,
    habit.days,
    habit.min_target,
    habit.full_target,
    habit.preferred_time,
    habit.archived,
    habit.created_at,
  );
  notify('habits');
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
  notify('habits');
}

export async function deleteHabit(id: string): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync(`DELETE FROM habit_logs WHERE habit_id = ?;`, id);
    await db.runAsync(`DELETE FROM habits WHERE id = ?;`, id);
  });
  notify('habits');
  notify('habit_logs');
}
