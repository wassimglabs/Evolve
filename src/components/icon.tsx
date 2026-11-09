import type { ReactNode } from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type IconName =
  | 'today'
  | 'plan'
  | 'lanes'
  | 'coach'
  | 'me'
  | 'chevron'
  | 'checkCircle'
  | 'refresh'
  | 'plus'
  | 'close'
  | 'arrowUp';

const DEFAULT_STROKE_WIDTH: Record<IconName, number> = {
  today: 1.75,
  plan: 1.75,
  lanes: 1.75,
  coach: 1.75,
  me: 1.75,
  chevron: 2,
  checkCircle: 2,
  refresh: 2,
  plus: 2,
  close: 2,
  arrowUp: 2.2,
};

const SHAPES: Record<IconName, ReactNode> = {
  today: (
    <>
      <Circle cx={12} cy={12} r={4} />
      <Path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4" />
    </>
  ),
  plan: (
    <>
      <Rect x={3.5} y={5} width={17} height={15} rx={2.5} />
      <Path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  lanes: (
    <>
      <Path d="M12 3.5l8.5 4.7-8.5 4.7-8.5-4.7L12 3.5z" />
      <Path d="M3.5 12.4l8.5 4.7 8.5-4.7" />
    </>
  ),
  coach: (
    <Path d="M5 5.5h14a1.5 1.5 0 011.5 1.5v8a1.5 1.5 0 01-1.5 1.5h-7.5L7 20v-3.5H5A1.5 1.5 0 013.5 15V7A1.5 1.5 0 015 5.5z" />
  ),
  me: (
    <>
      <Circle cx={12} cy={8.5} r={3.5} />
      <Path d="M5 20c.6-3.6 3.5-5.5 7-5.5s6.4 1.9 7 5.5" />
    </>
  ),
  chevron: <Path d="M9 6l6 6-6 6" />,
  checkCircle: (
    <>
      <Circle cx={12} cy={12} r={9} />
      <Path d="M8.5 12.3l2.4 2.4 4.6-5" />
    </>
  ),
  refresh: <Path d="M20 12a8 8 0 11-2.4-5.7M20 4v5h-5" />,
  plus: <Path d="M12 5v14M5 12h14" />,
  close: <Path d="M6 6l12 12M18 6L6 18" />,
  arrowUp: <Path d="M12 19V5M5 12l7-7 7 7" />,
};

export function Icon({
  name,
  size = 24,
  color,
  strokeWidth,
}: {
  name: IconName;
  size: number;
  color: string;
  strokeWidth?: number;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth ?? DEFAULT_STROKE_WIDTH[name]}
      strokeLinecap="round"
      strokeLinejoin="round">
      {SHAPES[name]}
    </Svg>
  );
}
