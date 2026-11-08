import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';

import { useTheme } from '@/theme/use-theme';

const ICONS = {
  index: 'today-outline',
  schedule: 'calendar-outline',
  habits: 'checkmark-done-outline',
  insights: 'stats-chart-outline',
  settings: 'settings-outline',
} as const satisfies Record<string, ComponentProps<typeof Ionicons>['name']>;

function iconColor(color: string | number | null | object | undefined): string | undefined {
  if (typeof color === 'string') return color;
  if (typeof color === 'number') return `#${color.toString(16).padStart(6, '0')}`;
  return undefined;
}

export default function TabLayout() {
  const t = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.accent,
        tabBarInactiveTintColor: t.muted,
        tabBarStyle: {
          backgroundColor: t.tabBar,
          borderTopColor: t.border,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color, size }) => (
            <Ionicons size={size} name={ICONS.index} color={iconColor(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Schedule',
          tabBarIcon: ({ color, size }) => (
            <Ionicons size={size} name={ICONS.schedule} color={iconColor(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="habits"
        options={{
          title: 'Habits',
          tabBarIcon: ({ color, size }) => (
            <Ionicons size={size} name={ICONS.habits} color={iconColor(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color, size }) => (
            <Ionicons size={size} name={ICONS.insights} color={iconColor(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons size={size} name={ICONS.settings} color={iconColor(color)} />
          ),
        }}
      />
    </Tabs>
  );
}
