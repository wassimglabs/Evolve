import { randomUUID } from 'expo-crypto';

import { getDb } from '@/db/client';
import { notify } from '@/db/store';
import type { Job, JobInput } from '@/db/types';
import { nowIso } from '@/lib/date';

export async function createJob(input: JobInput): Promise<Job> {
  const job: Job = { id: randomUUID(), created_at: nowIso(), updated_at: nowIso(), ...input };
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO jobs (id, title, company, link, status, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
    job.id,
    job.title,
    job.company,
    job.link,
    job.status,
    job.notes,
    job.created_at,
    job.updated_at,
  );
  notify('jobs');
  return job;
}

export async function getJobById(id: string): Promise<Job | null> {
  const db = await getDb();
  return db.getFirstAsync<Job>(`SELECT * FROM jobs WHERE id = ?;`, id);
}

export async function listJobs(): Promise<Job[]> {
  const db = await getDb();
  return db.getAllAsync<Job>(`SELECT * FROM jobs ORDER BY updated_at DESC;`);
}

export async function updateJob(id: string, patch: Partial<JobInput>): Promise<void> {
  const sets = Object.entries(patch).filter(([, value]) => value !== undefined);
  if (sets.length === 0) return;
  const db = await getDb();
  await db.runAsync(
    `UPDATE jobs SET ${sets.map(([column]) => `${column} = ?`).join(', ')}, updated_at = ? WHERE id = ?;`,
    [...sets.map(([, value]) => value), nowIso(), id],
  );
  notify('jobs');
}

export async function deleteJob(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM jobs WHERE id = ?;`, id);
  notify('jobs');
}
