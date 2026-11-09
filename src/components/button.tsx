import { Pressable, StyleSheet, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';

import { Text } from '@/components/text';
import { haptics } from '@/lib/haptics';
import { colors } from '@/theme/tokens';
import { fonts } from '@/theme/fonts';

export type ButtonVariant = 'primary' | 'primaryAmber' | 'secondary' | 'danger' | 'outlineMint' | 'outlineAmber';

const VARIANTS: Record<ButtonVariant, { bg: string; border?: string; color: string; family: string }> = {
  primary: { bg: colors.accent, color: colors.onAccent, family: fonts.interSemiBold },
  primaryAmber: { bg: colors.lanes.career.fg, color: colors.lanes.career.onFg, family: fonts.interSemiBold },
  secondary: { bg: colors.surface2, border: colors.border, color: colors.text, family: fonts.interMedium },
  danger: { bg: colors.danger.bg, border: colors.danger.border, color: colors.danger.text, family: fonts.interMedium },
  outlineMint: { bg: colors.bg, border: colors.highlight.mint.border, color: colors.text, family: fonts.interMedium },
  outlineAmber: { bg: colors.bg, border: colors.highlight.amber.border, color: colors.text, family: fonts.interMedium },
};

/**
 * All radius 12, centered label, Inter family. Light-impact haptic on primary
 * buttons. Sizes: "compact" (minHeight 44, paddingHorizontal 14, auto width,
 * label 13) and "block" (flex 1 / full width, minHeight 46, label 13.5).
 */
export function Button({
  variant,
  size = 'block',
  icon,
  onPress,
  disabled = false,
  style,
  labelStyle,
  children,
}: {
  variant: ButtonVariant;
  size?: 'compact' | 'block';
  icon?: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  children: ReactNode;
}) {
  const v = VARIANTS[variant];
  const compact = size === 'compact';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled, busy: false }}
      disabled={disabled}
      onPress={() => {
        if (variant === 'primary' || variant === 'primaryAmber') haptics.light();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: v.bg, minHeight: compact ? 44 : 46 },
        v.border ? { borderWidth: 1, borderColor: v.border } : null,
        compact ? styles.compact : styles.block,
        disabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}>
      <View style={styles.content}>
        {icon}
        <Text
          style={[{ color: v.color, fontFamily: v.family, fontSize: compact ? 13 : 13.5 }, labelStyle]}
          numberOfLines={1}>
          {children}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compact: {
    minHeight: 44,
    paddingHorizontal: 14,
  },
  block: {
    flex: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.4,
  },
});
