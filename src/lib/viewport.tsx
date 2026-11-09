import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useWindowDimensions, View } from 'react-native';

import { subscribe } from '@/db/store';
import { getSettingByKey } from '@/repositories/settings';
import { colors } from '@/theme/tokens';

/** Dev-only viewport simulator. All layout code reads width/height ONLY from
 * useViewport(): the override width when set (Settings -> Developer), otherwise
 * the real window. On wide screens (>= 600, e.g. iPad in Expo Go) content is
 * centered in a column capped at 560. Safe-area insets stay real. */

export const VIEWPORT_OPTIONS = [320, 375, 390, 430] as const;
const MAX_CONTENT_WIDTH = 560;

type Viewport = { width: number; height: number };

const ViewportContext = createContext<Viewport | null>(null);

export function ViewportProvider({ children }: { children: ReactNode }) {
  const dims = useWindowDimensions();
  const [override, setOverride] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    const load = () => {
      getSettingByKey('dev_viewport')
        .then((value) => {
          if (!active) return;
          const parsed = value === null ? null : Number(value);
          const valid =
            parsed !== null && VIEWPORT_OPTIONS.some((option) => option === parsed);
          setOverride(valid ? (parsed as number) : null);
        })
        .catch(() => undefined);
    };
    load();
    const unsubscribe = subscribe('settings', load);
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const value = useMemo<Viewport>(() => {
    const width = override ?? (dims.width >= 600 ? MAX_CONTENT_WIDTH : dims.width);
    return { width, height: dims.height };
  }, [override, dims.width, dims.height]);

  const needsWrapper = override !== null || value.width < dims.width;

  if (!needsWrapper) {
    return <ViewportContext.Provider value={value}>{children}</ViewportContext.Provider>;
  }

  return (
    <ViewportContext.Provider value={value}>
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center' }}>
        <View style={{ width: value.width, flex: 1, overflow: 'hidden' }}>{children}</View>
      </View>
    </ViewportContext.Provider>
  );
}

/** The only sanctioned source of layout dimensions. */
export function useViewport(): Viewport {
  const value = useContext(ViewportContext);
  if (!value) {
    throw new Error('useViewport must be used inside ViewportProvider');
  }
  return value;
}
