import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import type { LaneKey } from '@/components/tag';
import { haptics } from '@/lib/haptics';
import { colors } from '@/theme/tokens';
import { fonts } from '@/theme/fonts';

export type SegmentedVariant = 'modeToday' | 'tone' | 'lane' | 'period' | 'chips';

const LANE_BY_LABEL: Record<string, LaneKey> = {
  Study: 'study',
  Solven: 'solven',
  Career: 'career',
  Life: 'life',
};

/**
 * One component, five visual variants (spec section 3):
 *  - modeToday: day-mode segmented on Today (container surface, r14, font 13)
 *  - tone:      Settings tone segmented (container bg, r12, font 12.5)
 *  - lane:      Lanes tab, no container, lane-colored buttons
 *  - period:    Insights 7/30/90 days
 *  - chips:     Habits categories, horizontal, bleeds to screen edges
 */
export function Segmented({
  variant,
  options,
  value,
  onChange,
}: {
  variant: SegmentedVariant;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
}) {
  const press = (option: string) => {
    if (option !== value) {
      haptics.selection();
      onChange(option);
    }
  };

  if (variant === 'chips') {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsContainer}>
        {options.map((option) => {
          const active = option === value;
          return (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => press(option)}
              style={({ pressed }) => [
                styles.chip,
                active ? styles.chipActive : null,
                pressed && styles.pressed,
              ]}>
              <Text
                style={active ? styles.chipTextActive : styles.chipText}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.85}>
                {option}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    );
  }

  if (variant === 'lane') {
    return (
      <View style={styles.laneRow}>
        {options.map((option) => {
          const active = option === value;
          const lane = LANE_BY_LABEL[option] ?? 'study';
          const laneColors = colors.lanes[lane];
          const activeText = lane === 'career' ? colors.lanes.career.onFg : colors.bg;
          return (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => press(option)}
              style={({ pressed }) => [
                styles.flexButton,
                styles.radius12,
                { backgroundColor: active ? laneColors.fg : colors.surface },
                pressed && styles.pressed,
              ]}>
              <Text
                style={[
                  styles.font13,
                  { color: active ? activeText : laneColors.fg, fontFamily: active ? fonts.interSemiBold : fonts.interMedium },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.85}>
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  if (variant === 'period') {
    return (
      <View style={styles.periodRow}>
        {options.map((option) => {
          const active = option === value;
          return (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => press(option)}
              style={({ pressed }) => [
                styles.flexButton,
                styles.radius12,
                { backgroundColor: active ? PERIOD_ACTIVE_BG : colors.surface },
                pressed && styles.pressed,
              ]}>
              <Text
                style={[
                  styles.font13,
                  { color: active ? PERIOD_ACTIVE_FG : colors.text, fontFamily: active ? fonts.interSemiBold : fonts.interMedium },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.85}>
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  // modeToday | tone
  const isToday = variant === 'modeToday';
  return (
    <View
      style={[
        styles.modeContainer,
        { backgroundColor: isToday ? colors.surface : colors.bg, borderRadius: isToday ? 14 : 12 },
      ]}>
      {options.map((option) => {
        const active = option === value;
        return (
          <Pressable
            key={option}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => press(option)}
            style={({ pressed }) => [
              styles.flexButton,
              { borderRadius: isToday ? 11 : 9, backgroundColor: active ? colors.accent : 'transparent' },
              pressed && styles.pressed,
            ]}>
            <Text
              style={[
                { fontSize: isToday ? 13 : 12.5, color: active ? colors.onAccent : colors.muted, fontFamily: active ? fonts.interSemiBold : fonts.interMedium },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}>
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// The two literal active colors allowed outside tokens (spec section 14).
const PERIOD_ACTIVE_BG = '#ECEEF2';
const PERIOD_ACTIVE_FG = '#0E1014';

const styles = StyleSheet.create({
  modeContainer: {
    flexDirection: 'row',
    padding: 4,
    gap: 4,
  },
  laneRow: {
    flexDirection: 'row',
    gap: 6,
  },
  periodRow: {
    flexDirection: 'row',
    gap: 8,
  },
  flexButton: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radius12: {
    borderRadius: 12,
  },
  chipsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  chip: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  chipActive: {
    backgroundColor: PERIOD_ACTIVE_BG,
  },
  chipText: {
    fontSize: 13,
    fontFamily: fonts.interMedium,
    color: colors.text,
  },
  chipTextActive: {
    fontSize: 13,
    fontFamily: fonts.interSemiBold,
    color: PERIOD_ACTIVE_FG,
  },
  pressed: {
    opacity: 0.85,
  },
  font13: {
    fontSize: 13,
  },
});
