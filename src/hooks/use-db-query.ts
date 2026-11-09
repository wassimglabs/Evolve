import { useEffect, useState } from 'react';

import { subscribe, type StoreTopic } from '@/db/store';

export function useDbQuery<T>(
  query: () => Promise<T>,
  deps: readonly unknown[] = [],
  fallback: T,
  topics: readonly StoreTopic[] = [],
): { data: T; loading: boolean; error: Error | null } {
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;
    let requestId = 0;

    const refresh = async () => {
      const currentRequestId = ++requestId;
      try {
        setLoading(true);
        setError(null);
        const next = await query();
        if (!active || currentRequestId !== requestId) return;
        setData(next);
      } catch (cause) {
        if (!active || currentRequestId !== requestId) return;
        setData(fallback);
        setError(cause instanceof Error ? cause : new Error(String(cause)));
      } finally {
        if (active && currentRequestId === requestId) setLoading(false);
      }
    };

    void refresh();
    const unsubscribe = topics.map((topic) => subscribe(topic, () => void refresh()));

    return () => {
      active = false;
      unsubscribe.forEach((removeListener) => removeListener());
    };
    // query and topics are captured for this request; deps represent the values used by query.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fallback, ...deps]);

  return { data, loading, error };
}
