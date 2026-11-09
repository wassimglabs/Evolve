import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, View } from 'react-native';
import type { ReactNode } from 'react';

import { colors, SCREEN_PADDING_X } from '@/theme/tokens';

/**
 * Screen background + scroll container. paddingTop = safeAreaTop + 8,
 * horizontal padding 20, bottom padding 16; tab bar lives outside the scroll.
 * Vertical gap between top-level sections: 14 by default, 16 (Insights,
 * Settings, Me) or 20 (Check-in) via the `gap` prop.
 */
export function Screen({ children, gap = 14 }: { children: ReactNode; gap?: 14 | 16 | 20 }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingHorizontal: SCREEN_PADDING_X,
          paddingBottom: 16,
          gap,
        }}
        showsVerticalScrollIndicator={false}
        alwaysBounceVertical={false}>
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
});
