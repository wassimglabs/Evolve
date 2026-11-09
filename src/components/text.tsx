import { Text as RNText, type TextProps } from 'react-native';

/** Shared Text: caps Dynamic Type in one place so layouts wrap or ellipsize
 * instead of clipping. cap 1.2 for tab labels, tags, chips, segmented labels,
 * buttons, status pills, big numbers and tile labels; 1.35 (default) for
 * body/caption text. An explicit maxFontSizeMultiplier prop still wins. */
export function Text({ cap = 1.35, ...props }: TextProps & { cap?: number }) {
  return <RNText maxFontSizeMultiplier={cap} {...props} />;
}
