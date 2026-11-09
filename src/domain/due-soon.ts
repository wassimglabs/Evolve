import type { Task } from '@/db/types';
import { dateOffset, dueLabel, laneLabel } from './format';

/** Up to 2 open tasks due within 3 days (overdue first — they are the most
 * urgent), ordered by due date. */
export function dueSoon(
  now: Date,
  tasks: Task[],
): { id: string; title: string; subtitle: string }[] {
  const today = dateOffset(now, 0);
  const horizon = dateOffset(now, 3);

  return tasks
    .filter((task) => task.done === 0 && task.due_date !== null && task.due_date <= horizon)
    .sort((a, b) => (a.due_date ?? '').localeCompare(b.due_date ?? '') || a.created_at.localeCompare(b.created_at))
    .slice(0, 2)
    .map((task) => ({
      id: task.id,
      title: task.title,
      subtitle: `${dueLabel(task.due_date ?? today, today)} · ${laneLabel(task.lane)}`,
    }));
}

/** Open tasks with a due date of today or later, ordered by date. */
export function deadlines(now: Date, tasks: Task[]): Task[] {
  const today = dateOffset(now, 0);
  return tasks
    .filter((task) => task.done === 0 && task.due_date !== null && task.due_date >= today)
    .sort((a, b) => (a.due_date ?? '').localeCompare(b.due_date ?? '') || a.created_at.localeCompare(b.created_at));
}

/** Top open Career task: earliest due date, else oldest created. */
export function topCareerTask(tasks: Task[]): Task | null {
  const open = tasks.filter((task) => task.done === 0 && task.lane === 'career');
  if (open.length === 0) return null;
  return open.sort((a, b) => {
    const dueA = a.due_date ?? '9999-12-31';
    const dueB = b.due_date ?? '9999-12-31';
    if (dueA !== dueB) return dueA.localeCompare(dueB);
    return a.created_at.localeCompare(b.created_at);
  })[0];
}
