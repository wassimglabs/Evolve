import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Text } from '@/components/text';
import { colors } from '@/theme/tokens';
import { fonts } from '@/theme/fonts';

/** surface card, radius 14, padding 20, centered title + muted caption.
 * Optional compact primary `action` renders below (used by empty lists). */
export function EmptyState({
  title,
  caption,
  action,
}: {
  title: string;
  caption: string;
  action?: { label: string; onPress: () => void };
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>
      <Text style={styles.caption} numberOfLines={3}>
        {caption}
      </Text>
      {action ? (
        <Button variant="primary" size="compact" onPress={action.onPress} style={styles.action}>
          {action.label}
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    gap: 4,
  },
  action: {
    marginTop: 12,
  },
  title: {
    fontSize: 15,
    fontFamily: fonts.interSemiBold,
    color: colors.text,
    textAlign: 'center',
  },
  caption: {
    fontSize: 12.5,
    fontFamily: fonts.inter,
    color: colors.muted,
    textAlign: 'center',
  },
});
