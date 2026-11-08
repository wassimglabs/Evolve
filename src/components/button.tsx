import { Pressable, StyleSheet, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from '@/components/text';
import { useTheme } from '@/theme/use-theme';

export type ButtonProps = Omit<PressableProps, 'style'> & {
  title: string;
  variant?: 'primary' | 'secondary' | 'destructive';
  style?: StyleProp<ViewStyle>;
};

export function Button({ title, variant = 'primary', disabled, style, ...rest }: ButtonProps) {
  const t = useTheme();

  const backgroundColor =
    variant === 'destructive' ? t.danger : variant === 'secondary' ? t.surface2 : t.accent;
  const foreground = variant === 'destructive' ? '#FFFFFF' : t.onAccent;

  return (
    <Pressable
      style={[styles.base, { backgroundColor, opacity: disabled ? 0.5 : 1 }, style]}
      disabled={disabled}
      {...rest}>
      <Text variant="heading" style={{ color: foreground }}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
