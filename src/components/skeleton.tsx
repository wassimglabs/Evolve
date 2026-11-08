import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';

import { useTheme } from '@/theme/use-theme';

export function Skeleton({ height = 16, width = '100%' }: { height?: number; width?: string | number }) {
  const t = useTheme();
  const opacity = useSharedValue(0.35);
  const animated = useAnimatedStyle(() => ({ opacity: opacity.value }));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    opacity.value = withTiming(0.9, { duration: 400 });
  }, [opacity]);

  return <Animated.View style={[styles.base, { height, width, backgroundColor: t.surface2 }, animated]} />;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 10,
  },
});
