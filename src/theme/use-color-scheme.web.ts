import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * Web-only variant: server output renders before hydration, where scheme is
 * unknown. Returns 'light' until the client has hydrated to avoid a mismatch.
 * Bundled only on web (Metro .web.ts platform extension).
 */
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    // Hydration-only flip so server-rendered output stays stable; safe by design.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasHydrated(true);
  }, []);

  const colorScheme = useRNColorScheme();

  if (hasHydrated) {
    return colorScheme;
  }

  return 'light';
}
