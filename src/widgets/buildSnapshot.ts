import { toDateString } from '@/lib/date';
import { DEEP_LINKS } from '@/widgets/deepLinks';
import type { WidgetItem, WidgetSnapshot, WidgetLaneId } from '@/widgets/types';

type WidgetRecord = {
  id: string;
  title: string;
  laneId?: WidgetLaneId | string;
  startMin?: number;
  endMin?: number | null;
  kind?: 'class' | 'task' | 'habit';
  done?: boolean;
  dueLabel?: string;
  dueDate?: string;
  deepLink?: string;
  laneColor?: string;
};

type WidgetData = {
  tasks?: WidgetRecord[];
  habits?: WidgetRecord[];
  timetable?: WidgetRecord[];
  dayMode?: 'normal' | 'low' | 'recovery';
  checkins?: { date: string }[];
  checkinPending?: boolean;
};

function normalizeLaneId(value: WidgetLaneId | string | undefined): WidgetLaneId {
  if (value === 'study' || value === 'solven' || value === 'career' || value === 'life') return value;
  return 'study';
}

function toWidgetItem(entry: WidgetRecord, fallbackLink = DEEP_LINKS.today): WidgetItem {
  return {
    id: entry.id,
    title: entry.title,
    laneId: normalizeLaneId(entry.laneId),
    laneColor: entry.laneColor ?? '#6FE3B5',
    startMin: entry.startMin ?? 0,
    endMin: entry.endMin ?? null,
    kind: entry.kind ?? 'task',
    deepLink: entry.deepLink ?? fallbackLink,
  };
}

export function buildWidgetSnapshot(now: Date, data: WidgetData = {}): WidgetSnapshot {
  const dateString = toDateString(now);
  const actives = [
    ...(data.tasks ?? []).map((item) => ({ ...item, kind: 'task' as const })),
    ...(data.habits ?? []).map((item) => ({ ...item, kind: 'habit' as const })),
    ...(data.timetable ?? []).map((item) => ({ ...item, kind: 'class' as const })),
  ];

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const upcoming = actives
    .filter((item) => (item.startMin ?? 0) >= nowMinutes || (item.kind === 'task' && !item.done))
    .map((item) => toWidgetItem(item, DEEP_LINKS.today))
    .sort((a, b) => (a.startMin ?? 0) - (b.startMin ?? 0));

  const next = upcoming[0] ?? null;
  const future = upcoming.filter((item) => item.id !== next?.id).slice(0, 3);
  const total = actives.length; const done = actives.filter((item) => item.done).length;

  const dueSoon = (data.tasks ?? [])
    .filter((item) => item.dueDate && item.dueDate >= dateString)
    .slice(0, 2)
    .map((item) => ({
      title: item.title,
      laneId: normalizeLaneId(item.laneId),
      dueLabel: item.dueLabel ?? 'Due soon',
    }));

  const checkinExists = (data.checkins ?? []).some((checkin) => checkin.date === dateString);
  const checkinPending = Boolean(data.checkinPending ?? (now.getHours() >= 20 && !checkinExists));

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    date: dateString,
    progress: { done, total },
    next,
    upcoming: future,
    dueSoon,
    checkinPending,
    dayMode: data.dayMode ?? 'normal',
  };
}
