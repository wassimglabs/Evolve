import { useSyncExternalStore } from 'react';

export type StoreTopic =
  | 'tasks'
  | 'habits'
  | 'habit_logs'
  | 'checkins'
  | 'jobs'
  | 'timetable'
  | 'ideas'
  | 'lanes'
  | 'settings';

type Listener = () => void;

const listeners: Record<StoreTopic, Set<Listener>> = {
  tasks: new Set(),
  habits: new Set(),
  habit_logs: new Set(),
  checkins: new Set(),
  jobs: new Set(),
  timetable: new Set(),
  ideas: new Set(),
  lanes: new Set(),
  settings: new Set(),
};

const topicState: Partial<Record<StoreTopic, unknown>> = {};

export function notify(topic: StoreTopic, value?: unknown): void {
  if (value !== undefined) topicState[topic] = value;
  for (const listener of listeners[topic]) listener();
}

export function subscribe(topic: StoreTopic, listener: Listener): () => void {
  listeners[topic].add(listener);
  return () => {
    listeners[topic].delete(listener);
  };
}

export function getStoreState<T>(topic: StoreTopic, fallback: T): T {
  return (topicState[topic] as T | undefined) ?? fallback;
}

export function useTopic<T>(topic: StoreTopic, selector: (value: unknown) => T, fallback: T): T {
  const value = useSyncExternalStore(
    (listener) => subscribe(topic, listener),
    () => selector(getStoreState(topic, fallback)),
    () => selector(fallback),
  );

  return value;
}
