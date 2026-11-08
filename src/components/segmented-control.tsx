import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { useTheme } from '@/theme/use-theme';

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
}) {
  const t = useTheme();

  return (
    <View style={[styles.track, { backgroundColor: t.surface2, borderColor: t.border }]}>
      {options.map((option) => {
        const selected = option === value;
        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            style={[
              styles.option,
              selected && {
                backgroundColor: t.surface,
                borderColor: t.borderStrong,
                shadowColor: '#000',
                shadowOpacity: 0.2,
                shadowRadius: 8,
              },
            ]}>
            <Text variant="caption" style={{ color: selected ? t.text : t.muted, fontWeight: selected ? '600' : '500' }}>
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    padding: 6,
  },
  option: {
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    minHeight: 36,
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: 'transparent',
  },
});
