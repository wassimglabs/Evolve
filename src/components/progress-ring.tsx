import Svg, { Circle } from 'react-native-svg';

import { colors } from '@/theme/tokens';

/** Progress ring, size 34 default, viewBox 0 0 36 36, track + round-cap arc. */
export function ProgressRing({ done, total, size = 34 }: { done: number; total: number; size?: number }) {
  const circ = 2 * Math.PI * 14;
  const ratio = total === 0 ? 0 : done / total;

  return (
    <Svg width={size} height={size} viewBox="0 0 36 36">
      <Circle cx={18} cy={18} r={14} stroke={colors.border} strokeWidth={4} fill="none" />
      <Circle
        cx={18}
        cy={18}
        r={14}
        stroke={colors.accent}
        strokeWidth={4}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${circ * ratio} ${circ}`}
        transform="rotate(-90 18 18)"
      />
    </Svg>
  );
}
