export type WidgetLaneId = 'study' | 'solven' | 'career' | 'life';

export type WidgetItem = {
  id: string;
  title: string;
  laneId: WidgetLaneId;
  laneColor: string;
  startMin: number;
  endMin: number | null;
  kind: 'class' | 'task' | 'habit';
  deepLink: string;
};

export type WidgetSnapshot = {
  version: 1;
  generatedAt: string;
  date: string;
  progress: { done: number; total: number };
  next: WidgetItem | null;
  upcoming: WidgetItem[];
  dueSoon: { title: string; laneId: WidgetLaneId; dueLabel: string }[];
  checkinPending: boolean;
  dayMode: 'normal' | 'low' | 'recovery';
};
