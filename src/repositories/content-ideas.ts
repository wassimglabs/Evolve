import { randomUUID } from 'expo-crypto';

import { getDb } from '@/db/client';
import { notify } from '@/db/store';
import type { ContentIdea, ContentIdeaInput } from '@/db/types';
import { nowIso } from '@/lib/date';

export async function createContentIdea(input: ContentIdeaInput): Promise<ContentIdea> {
  const idea: ContentIdea = { id: randomUUID(), created_at: nowIso(), updated_at: nowIso(), ...input };
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO content_ideas (id, title, body, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?);`,
    idea.id,
    idea.title,
    idea.body,
    idea.status,
    idea.created_at,
    idea.updated_at,
  );
  notify('ideas');
  return idea;
}

export async function getContentIdeaById(id: string): Promise<ContentIdea | null> {
  const db = await getDb();
  return db.getFirstAsync<ContentIdea>(`SELECT * FROM content_ideas WHERE id = ?;`, id);
}

export async function listContentIdeas(): Promise<ContentIdea[]> {
  const db = await getDb();
  return db.getAllAsync<ContentIdea>(`SELECT * FROM content_ideas ORDER BY created_at DESC;`);
}

export async function updateContentIdea(id: string, patch: Partial<ContentIdeaInput>): Promise<void> {
  const sets = Object.entries(patch).filter(([, value]) => value !== undefined);
  if (sets.length === 0) return;
  const db = await getDb();
  await db.runAsync(
    `UPDATE content_ideas SET ${sets.map(([column]) => `${column} = ?`).join(', ')}, updated_at = ? WHERE id = ?;`,
    [...sets.map(([, value]) => value), nowIso(), id],
  );
  notify('ideas');
}

export async function deleteContentIdea(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM content_ideas WHERE id = ?;`, id);
  notify('ideas');
}
