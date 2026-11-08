import type { WidgetSnapshot } from '@/widgets/types';

export function nextRefreshAt(snapshot: WidgetSnapshot, now: Date): Date {
  const items: Date[] = [];

  for (const item of snapshot.upcoming.concat(snapshot.next ? [snapshot.next] : [])) {
    const start = item.startMin;
    const event = new Date(now);
    event.setHours(Math.floor(start / 60), start % 60, 0, 0);
    if (event.getTime() > now.getTime()) items.push(event);

    if (item.endMin !== null) {
      const end = new Date(now);
      end.setHours(Math.floor(item.endMin / 60), item.endMin % 60, 0, 0);
      if (end.getTime() > now.getTime()) items.push(end);
    }
  }

  if (snapshot.checkinPending) {
    const checkin = new Date(now);
    checkin.setHours(20, 0, 0, 0);
    items.push(checkin);
  }

  const nextMidnight = new Date(now);
  nextMidnight.setHours(24, 0, 0, 0);
  items.push(nextMidnight);

  const earliest = items.sort((a, b) => a.getTime() - b.getTime())[0] ?? now;
  const minimum = new Date(now.getTime() + 15 * 60 * 1000);
  return earliest.getTime() < minimum.getTime() ? minimum : earliest;
}
