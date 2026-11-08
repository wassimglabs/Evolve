import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Text } from '@/components/text';
import { useTheme } from '@/theme/use-theme';

export function ProgressRing({
  value,
  max,
  label,
}: {
  value: number;
  max: number;
  label?: string;
}) {
  const t = useTheme();
  const clamped = Math.min(Math.max(value / Math.max(max, 1), 0), 1);
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference * clamped;

  return (
    <View style={styles.wrapper}>
      <Svg width={60} height={60} viewBox="0 0 60 60">
        <Circle cx={30} cy={30} r={radius} stroke={t.border} strokeWidth={6} fill="transparent" />
        <Circle
          cx={30}
          cy={30}
          r={radius}
          stroke={t.accent}
          strokeWidth={6}
          fill="transparent"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          transform="rotate(-90 30 30)"
        />
      </Svg>
      {label ? (
        <Text variant="caption" style={{ position: 'absolute', color: t.text, fontWeight: '600' }}>
          {label}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    width: 60,
  },
});
