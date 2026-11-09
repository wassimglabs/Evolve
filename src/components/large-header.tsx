import { Pressable, StyleSheet, View } from 'react-native';
import type { ReactNode } from 'react';

import { Icon } from '@/components/icon';
import { Text } from '@/components/text';
import { colors } from '@/theme/tokens';
import { fonts } from '@/theme/fonts';
import { type } from '@/theme/type';

export function LargeHeader({
  overline,
  title,
  right,
  onBack,
}: {
  overline: string;
  title: string;
  right?: ReactNode;
  onBack?: () => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.heading}>
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={onBack}
            style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.85 }]}>
            <View style={styles.backIcon}>
              <Icon name="arrowUp" size={18} color={colors.text} />
            </View>
          </Pressable>
        ) : null}
        <View style={styles.left}>
          <Text style={styles.overline} numberOfLines={1} ellipsizeMode="tail">
            {overline}
          </Text>
          <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
            {title}
          </Text>
        </View>
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
    minWidth: 0,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    transform: [{ rotate: '-90deg' }],
  },
  left: {
    gap: 2,
    flexShrink: 1,
    minWidth: 0,
  },
  right: {
    flexShrink: 0,
    // `right` slot aligned to the bottom of the header row
  },
  overline: {
    fontSize: 13,
    fontFamily: fonts.inter,
    color: colors.muted,
  },
  title: {
    ...type.screenTitle,
    color: colors.text,
  },
});
