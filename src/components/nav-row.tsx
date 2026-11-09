import { Pressable, StyleSheet, View } from 'react-native';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { Icon } from '@/components/icon';
import { Text } from '@/components/text';
import { colors } from '@/theme/tokens';
import { fonts } from '@/theme/fonts';

/**
 * Row, space-between, gap 10. Left column gap 1 (title + subtitle), right side
 * defaults to a chevron. 1pt bottom divider unless `last`. Used inside flush
 * cards (insetX 14) and standalone (insetX 16, minHeight 56, radius 14).
 * Optional `left` node renders before the text column (e.g. a status icon).
 */
export function NavRow({
  title,
  subtitle,
  onPress,
  right,
  left,
  minHeight = 64,
  insetX = 14,
  titleSize = 14.5,
  last = false,
  style,
}: {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  right?: ReactNode;
  left?: ReactNode;
  minHeight?: number;
  insetX?: number;
  titleSize?: 14.5 | 15;
  last?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const row = (
    <View style={[styles.row, { minHeight, paddingHorizontal: insetX, borderBottomWidth: last ? 0 : 1 }, style]}>
      {left}
      <View style={styles.left}>
        <Text style={[styles.title, { fontSize: titleSize }]} numberOfLines={1} ellipsizeMode="tail">
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={2} ellipsizeMode="tail">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ?? <Icon name="chevron" size={20} color={colors.muted} strokeWidth={2} />}
    </View>
  );

  if (!onPress) return row;

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [pressed && { opacity: 0.85 }]}>
      {row}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    borderBottomColor: colors.divider,
  },
  left: {
    gap: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: fonts.interMedium,
    color: colors.text,
  },
  subtitle: {
    fontSize: 12.5,
    fontFamily: fonts.inter,
    color: colors.muted,
  },
});
