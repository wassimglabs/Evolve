import { ScrollView, StyleSheet, View, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LargeHeader } from '@/components/large-header';
import { useTheme } from '@/theme/use-theme';

export type ScreenProps = ViewProps & {
  title?: string;
  rightSlot?: React.ReactNode;
  hideScroll?: boolean;
};

export function Screen({ title, rightSlot, hideScroll = false, style, children, ...rest }: ScreenProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  const content = (
    <View style={[styles.content, { paddingBottom: 24 + insets.bottom + 8 }]}>
      {title ? <LargeHeader title={title} rightSlot={rightSlot} /> : null}
      {children}
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: t.background,
          paddingTop: insets.top,
        },
        style,
      ]}
      {...rest}>
      {hideScroll ? content : <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>{content}</ScrollView>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  content: {
    gap: 16,
    paddingHorizontal: 20,
  },
});
