import { StyleSheet, View, type ViewProps } from 'react-native';

import { useTheme } from '@/theme/use-theme';

export type CardProps = ViewProps & {
  tone?: 'default' | 'highlight';
};

export function Card({ style, tone = 'default', ...rest }: CardProps) {
  const t = useTheme();
  const isHighlight = tone === 'highlight';

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: isHighlight ? t.highlightBg : t.surface,
          borderColor: isHighlight ? t.highlightBorder : t.border,
        },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 16,
  },
});
