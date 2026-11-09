import { randomUUID } from 'expo-crypto';

import { getDb } from '@/db/client';
import { notify } from '@/db/store';
import type { TimetableException, TimetableExceptionInput } from '@/db/types';
import { nowIso } from '@/lib/date';

export async function createTimetableException(
  input: TimetableExceptionInput,
): Promise<TimetableException> {
  const exception: TimetableException = { id: randomUUID(), created_at: nowIso(), ...input };
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO timetable_exceptions (id, date, entry_id, type, title, start_min, end_min, note, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    exception.id,
    exception.date,
    exception.entry_id,
    exception.type,
    exception.title,
    exception.start_min,
    exception.end_min,
    exception.note,
    exception.created_at,
  );
  notify('timetable');
  return exception;
}

export async function getTimetableExceptionById(id: string): Promise<TimetableException | null> {
  const db = await getDb();
  return db.getFirstAsync<TimetableException>(`SELECT * FROM timetable_exceptions WHERE id = ?;`, id);
}

export async function listTimetableExceptions(): Promise<TimetableException[]> {
  const db = await getDb();
  return db.getAllAsync<TimetableException>(
    `SELECT * FROM timetable_exceptions ORDER BY date, start_min;`,
  );
}

export async function updateTimetableException(
  id: string,
  patch: Partial<TimetableExceptionInput>,
): Promise<void> {
  const sets = Object.entries(patch).filter(([, value]) => value !== undefined);
  if (sets.length === 0) return;
  const db = await getDb();
  await db.runAsync(
    `UPDATE timetable_exceptions SET ${sets.map(([column]) => `${column} = ?`).join(', ')} WHERE id = ?;`,
    [...sets.map(([, value]) => value), id],
  );
  notify('timetable');
}

export async function deleteTimetableException(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM timetable_exceptions WHERE id = ?;`, id);
  notify('timetable');
}
