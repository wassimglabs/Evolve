import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { useTheme } from '@/theme/use-theme';

export type LaneId = 'study' | 'solven' | 'career' | 'life';

export function Tag({ label, lane }: { label: string; lane: LaneId }) {
  const t = useTheme();
  const laneColors: Record<LaneId, { bg: string; text: string }> = {
    study: { bg: t.laneStudy + '22', text: t.laneStudy },
    solven: { bg: t.laneSolven + '22', text: t.laneSolven },
    career: { bg: t.laneCareer + '22', text: t.laneCareer },
    life: { bg: t.laneLife + '22', text: t.laneLife },
  };

  const colors = laneColors[lane] ?? laneColors.study;

  return (
    <View style={[styles.tag, { backgroundColor: colors.bg, borderColor: colors.text + '55' }]}>
      <Text variant="caption" style={{ color: colors.text, fontWeight: '600' }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
});
