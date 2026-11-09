import { Pressable, StyleSheet, View } from 'react-native';
import type { ComponentProps } from 'react';
import { Tabs } from 'expo-router';

import { Icon, type IconName } from '@/components/icon';
import { Text } from '@/components/text';
import { colors } from '@/theme/tokens';
import { fonts } from '@/theme/fonts';

type BaseTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];
type TabBarProps = Omit<BaseTabBarProps, 'state'> & {
  state: Omit<BaseTabBarProps['state'], 'routes'> & {
    routes: (BaseTabBarProps['state']['routes'][number] & {
      state?: { key: string; index: number };
    })[];
  };
};

const TABS: Record<string, { label: string; icon: IconName }> = {
  index: { label: 'Today', icon: 'today' },
  plan: { label: 'Plan', icon: 'plan' },
  lanes: { label: 'Lanes', icon: 'lanes' },
  coach: { label: 'Coach', icon: 'coach' },
  me: { label: 'Me', icon: 'me' },
};

/**
 * Custom tab bar: tabBar background, 1pt top divider, paddingTop 8,
 * paddingHorizontal 8, paddingBottom = max(safeAreaBottom, 12).
 * Each tab: flex 1, minHeight 48, column, gap 4; icon 24, label 11.
 * Active mint 600, inactive muted 500. Sub-screens (Habits, Insights,
 * Settings) live inside their parent tab's stack, so the parent stays
 * highlighted automatically.
 */
export function TabBar({ state, descriptors, emitter, navigateToTab, insets }: TabBarProps) {
  return (
    <View
      style={[
        styles.root,
        { paddingBottom: Math.max(insets.bottom, 12) },
      ]}>
      {state.routes.map((route, index) => {
        const tab = TABS[route.name];
        const label = descriptors[route.key]?.options.title ?? tab?.label ?? route.name;
        const icon = tab?.icon ?? 'today';
        const focused = state.index === index;

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            onPress={() => {
              const event = emitter.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                navigateToTab(route.key);
              } else if (focused && !event.defaultPrevented && route.state && route.state.index > 0) {
                descriptors[route.key].navigation.dispatch({
                  type: 'POP_TO_TOP',
                  target: route.state.key,
                });
              }
            }}
            onLongPress={() => {
              emitter.emit({ type: 'tabLongPress', target: route.key });
            }}
            style={({ pressed }) => [styles.tab, pressed && { opacity: 0.85 }]}>
            <Icon name={icon} size={24} color={focused ? colors.accent : colors.muted} />
            <Text style={focused ? styles.labelActive : styles.labelInactive} numberOfLines={1}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    backgroundColor: colors.tabBar,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  labelActive: {
    fontSize: 11,
    fontFamily: fonts.interSemiBold,
    color: colors.accent,
  },
  labelInactive: {
    fontSize: 11,
    fontFamily: fonts.interMedium,
    color: colors.muted,
  },
});
