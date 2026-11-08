import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { fontFamilies, fontSizes } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

export type TextProps = RNTextProps & {
  variant?: 'title' | 'heading' | 'body' | 'muted' | 'caption' | 'small';
};

export function Text({ variant = 'body', style, ...rest }: TextProps) {
  const t = useTheme();
  const palette = {
    title: { color: t.text, fontFamily: fontFamilies.title, fontSize: fontSizes.h1, lineHeight: 38 },
    heading: { color: t.text, fontFamily: fontFamilies.bodySemiBold, fontSize: fontSizes.h2, lineHeight: 22 },
    body: { color: t.text, fontFamily: fontFamilies.body, fontSize: fontSizes.body, lineHeight: 22 },
    muted: { color: t.muted, fontFamily: fontFamilies.body, fontSize: fontSizes.body, lineHeight: 22 },
    caption: { color: t.muted, fontFamily: fontFamilies.body, fontSize: fontSizes.small, lineHeight: 18 },
    small: { color: t.text, fontFamily: fontFamilies.body, fontSize: fontSizes.micro, lineHeight: 16 },
  } as const;

  return <RNText style={[palette[variant], style]} {...rest} />;
}
