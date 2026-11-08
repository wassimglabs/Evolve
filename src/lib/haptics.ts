import * as Haptics from 'expo-haptics';

export const haptics = {
  selection: () => Haptics.selectionAsync().catch(() => undefined),
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined),
  medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined),
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined),
};

export function enableHaptics() {
  return true;
}

export function disableHaptics() {
  return false;
}
