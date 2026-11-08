import type { WidgetSnapshot } from '@/widgets/types';

export function getSmallWidgetModel(snapshot: WidgetSnapshot) {
  return {
    progress: snapshot.progress,
    next: snapshot.next,
    title: snapshot.next?.title ?? 'No upcoming item',
    subtitle: snapshot.next ? `${snapshot.next.kind}` : 'All clear',
  };
}

export function getMediumWidgetModel(snapshot: WidgetSnapshot) {
  return {
    progress: snapshot.progress,
    next: snapshot.next,
    upcoming: snapshot.upcoming.slice(0, 2),
    title: snapshot.next?.title ?? 'No upcoming item',
    compact: snapshot.upcoming.slice(0, 2).map((item) => ({
      title: item.title.length > 18 ? item.title.slice(0, 18) + '…' : item.title,
      laneId: item.laneId,
    })),
  };
}

export function getLargeWidgetModel(snapshot: WidgetSnapshot) {
  return {
    progress: snapshot.progress,
    next: snapshot.next,
    upcoming: snapshot.upcoming.slice(0, 3),
    dueSoon: snapshot.dueSoon.slice(0, 2),
    checkinPrompt: snapshot.checkinPending ? 'Check in tonight' : 'Day is on track',
    title: snapshot.next?.title ?? 'No upcoming item',
  };
}
