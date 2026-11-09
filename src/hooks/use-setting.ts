import { useCallback, useEffect, useState } from 'react';

import { notify } from '@/db/store';
import { createSetting, getSettingByKey, updateSetting } from '@/repositories/settings';

/** Reads a settings key once on mount; writes through (creating on first write). */
export function useSetting(key: string, fallback: string): [string, (next: string) => void] {
  const [value, setValue] = useState(fallback);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const existing = await getSettingByKey(key);
        if (!active) return;
        if (existing === null) {
          await createSetting(key, fallback);
          if (active) setValue(fallback);
        } else {
          setValue(existing);
        }
      } catch {
        // settings are best-effort in the UI layer; keep the fallback value
      }
    })();
    return () => {
      active = false;
    };
  }, [key, fallback]);

  const write = useCallback(
    (next: string) => {
      setValue(next);
      void (async () => {
        try {
          const existing = await getSettingByKey(key);
          if (existing === null) await createSetting(key, next);
          else await updateSetting(key, next);
          notify('settings');
        } catch {
          // keep the optimistic UI value even if the write failed
        }
      })();
    },
    [key],
  );

  return [value, write];
}

/** Boolean convenience wrapper over useSetting ('true'/'false'). */
export function useBooleanSetting(key: string, fallback: boolean): [boolean, (next: boolean) => void] {
  const [value, write] = useSetting(key, fallback ? 'true' : 'false');
  return [value === 'true', (next: boolean) => write(next ? 'true' : 'false')];
}
