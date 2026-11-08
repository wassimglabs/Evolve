import { colors, fontFamilies, fontSizes, radii, sidePadding, spacing } from './tokens';
import { useColorScheme } from './use-color-scheme';

/**
 * Current theme for the system color scheme, with all tokens flattened for
 * direct consumption: `const t = useTheme(); t.background, t.spacing.md, ...`
 */
export function useTheme() {
  const scheme = useColorScheme();
  const palette = scheme === 'dark' ? colors.dark : colors.light;

  return {
    ...palette,
    spacing,
    radius: radii,
    fontSizes,
    fontFamilies,
    sidePadding,
  };
}

export type Theme = ReturnType<typeof useTheme>;
