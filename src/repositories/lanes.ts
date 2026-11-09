import { getDb } from '@/db/client';
import { notify } from '@/db/store';
import type { Lane } from '@/db/types';

/** The 4 lane rows are seeded by migration 003 and never created/deleted here;
 * only the weekly minimum is user-editable. */

export async function listLanes(): Promise<Lane[]> {
  const db = await getDb();
  return db.getAllAsync<Lane>(`SELECT * FROM lanes ORDER BY created_at;`);
}

export async function getLaneById(id: string): Promise<Lane | null> {
  const db = await getDb();
  return db.getFirstAsync<Lane>(`SELECT * FROM lanes WHERE id = ?;`, id);
}

export async function updateLane(id: string, patch: { weekly_min_minutes?: number }): Promise<void> {
  const sets = Object.entries(patch).filter(([, value]) => value !== undefined);
  if (sets.length === 0) return;
  const db = await getDb();
  await db.runAsync(
    `UPDATE lanes SET ${sets.map(([column]) => `${column} = ?`).join(', ')} WHERE id = ?;`,
    [...sets.map(([, value]) => value), id],
  );
  notify('lanes');
}
