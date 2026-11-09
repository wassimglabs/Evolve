import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/tokens';
import { fonts } from '@/theme/fonts';

export type LaneKey = 'study' | 'solven' | 'career' | 'life';

const LABELS: Record<LaneKey, string> = {
  study: 'Study',
  solven: 'Solven',
  career: 'Career',
  life: 'Life',
};

/** The lane pill: 11.5/500, radius 8, paddingV 2, paddingH 8. */
export function Tag({ lane }: { lane: LaneKey }) {
  const laneColors = colors.lanes[lane];

  return (
    <View style={[styles.pill, { backgroundColor: laneColors.bg }]}>
      <Text style={[styles.label, { color: laneColors.fg }]} numberOfLines={1}>
        {LABELS[lane]}
      </Text>
    </View>
  );
}

export function laneLabelText(lane: LaneKey): string {
  return LABELS[lane];
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: 8,
    paddingVertical: 2,
    paddingHorizontal: 8,
    alignSelf: 'flex-start',
    flexShrink: 0,
  },
  label: {
    fontSize: 11.5,
    fontFamily: fonts.interMedium,
  },
});
