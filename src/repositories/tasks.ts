import { randomUUID } from 'expo-crypto';

import { getDb } from '@/db/client';
import { notify } from '@/db/store';
import type { Task, TaskInput } from '@/db/types';
import { nowIso } from '@/lib/date';

export async function createTask(input: TaskInput & { source?: string | null }): Promise<Task> {
  const task: Task = {
    id: randomUUID(),
    done: 0,
    source: null,
    created_at: nowIso(),
    updated_at: nowIso(),
    ...input,
  };
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO tasks (id, title, lane, due_date, est_minutes, scheduled_date, scheduled_start_min, done, source, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    task.id,
    task.title,
    task.lane,
    task.due_date,
    task.est_minutes,
    task.scheduled_date,
    task.scheduled_start_min,
    task.done,
    task.source,
    task.created_at,
    task.updated_at,
  );
  notify('tasks');
  return task;
}

export async function getTaskById(id: string): Promise<Task | null> {
  const db = await getDb();
  return db.getFirstAsync<Task>(`SELECT * FROM tasks WHERE id = ?;`, id);
}

export async function listTasks(): Promise<Task[]> {
  const db = await getDb();
  return db.getAllAsync<Task>(`SELECT * FROM tasks ORDER BY created_at;`);
}

export async function updateTask(id: string, patch: Partial<TaskInput & { done: 0 | 1; source: string | null }>): Promise<void> {
  const sets = Object.entries(patch).filter(([, value]) => value !== undefined);
  if (sets.length === 0) return;
  const db = await getDb();
  await db.runAsync(
    `UPDATE tasks SET ${sets.map(([column]) => `${column} = ?`).join(', ')}, updated_at = ? WHERE id = ?;`,
    [...sets.map(([, value]) => value), nowIso(), id],
  );
  notify('tasks');
}

export async function deleteTask(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM tasks WHERE id = ?;`, id);
  notify('tasks');
}
