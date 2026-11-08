import { randomUUID } from 'expo-crypto';

import { getDb } from '@/db/client';
import type { TimetableEntry, TimetableEntryInput } from '@/db/types';
import { nowIso } from '@/lib/date';

export async function createTimetableEntry(input: TimetableEntryInput): Promise<TimetableEntry> {
  const entry: TimetableEntry = { id: randomUUID(), created_at: nowIso(), ...input };
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO timetable_entries (id, title, day_of_week, start_min, end_min, location, kind, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
    entry.id,
    entry.title,
    entry.day_of_week,
    entry.start_min,
    entry.end_min,
    entry.location,
    entry.kind,
    entry.created_at,
  );
  return entry;
}

export async function getTimetableEntryById(id: string): Promise<TimetableEntry | null> {
  const db = await getDb();
  return db.getFirstAsync<TimetableEntry>(`SELECT * FROM timetable_entries WHERE id = ?;`, id);
}

export async function listTimetableEntries(): Promise<TimetableEntry[]> {
  const db = await getDb();
  return db.getAllAsync<TimetableEntry>(
    `SELECT * FROM timetable_entries ORDER BY day_of_week, start_min;`,
  );
}

export async function updateTimetableEntry(
  id: string,
  patch: Partial<TimetableEntryInput>,
): Promise<void> {
  const sets = Object.entries(patch).filter(([, value]) => value !== undefined);
  if (sets.length === 0) return;
  const db = await getDb();
  await db.runAsync(
    `UPDATE timetable_entries SET ${sets.map(([column]) => `${column} = ?`).join(', ')} WHERE id = ?;`,
    [...sets.map(([, value]) => value), id],
  );
}

export async function deleteTimetableEntry(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM timetable_entries WHERE id = ?;`, id);
}
