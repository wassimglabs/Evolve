import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';

import { colors } from '@/theme/tokens';

/**
 * surface, radius 14. Variants:
 *  - padded:    padding 14
 *  - flush:     padding 0; children are rows separated by 1pt divider lines
 *  - dashedDev: 1pt dashed border (developer card), padding 14
 */
export function Card({
  variant = 'padded',
  style,
  children,
}: {
  variant?: 'padded' | 'flush' | 'dashedDev';
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  return (
    <View
      style={[
        styles.base,
        variant !== 'flush' && styles.padded,
        variant === 'dashedDev' && styles.dashed,
        style,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderRadius: 14,
  },
  padded: {
    padding: 14,
  },
  dashed: {
    borderWidth: 1,
    borderColor: colors.dashed,
  },
});
