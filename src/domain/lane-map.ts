import type { LaneKey } from '@/components/tag';

/** Habit category ↔ lane mapping (1:1, UI decision documented in the README).
 * The schema has no lane column on habits; the lane is derived from category. */
export const CATEGORY_TO_LANE: Record<string, LaneKey> = {
  Physical: 'life',
  Intellectual: 'study',
  Professional: 'solven',
  Communication: 'career',
};

export const LANE_TO_CATEGORY: Record<LaneKey, string> = {
  life: 'Physical',
  study: 'Intellectual',
  solven: 'Professional',
  career: 'Communication',
};

export function categoryToLane(category: string): LaneKey {
  return CATEGORY_TO_LANE[category] ?? 'life';
}
