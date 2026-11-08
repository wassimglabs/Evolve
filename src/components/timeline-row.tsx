import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { useTheme } from '@/theme/use-theme';

export function TimelineRow({
  time,
  title,
  subtitle,
  lane,
  variant = 'class',
  highlight = false,
}: {
  time: string;
  title: string;
  subtitle?: string;
  lane?: string;
  variant?: 'class' | 'free-window' | 'highlight';
  highlight?: boolean;
}) {
  const t = useTheme();
  const dark = variant === 'highlight' ? t.highlightBg : t.surface;

  return (
    <View style={[styles.row, { backgroundColor: dark, borderColor: variant === 'free-window' ? t.dashed : t.border }]}>
      <View style={styles.gutter}>
        <Text variant="caption" style={{ color: t.muted, textAlign: 'center' }}>{time}</Text>
      </View>
      <View style={[styles.block, { borderColor: highlight ? t.highlightBorder : t.border, backgroundColor: variant === 'free-window' ? 'transparent' : t.surface2 }]}>
        {variant === 'free-window' ? <View style={[styles.dash, { borderColor: t.dashed }]} /> : null}
        {!highlight && variant !== 'free-window' ? (
          <View style={styles.metaRow}>
            {lane ? <View style={[styles.badge, { backgroundColor: t.surface, borderColor: t.border }]}><Text variant="small" style={{ color: t.text }}>{lane}</Text></View> : null}
          </View>
        ) : null}
        <Text variant="heading" style={{ fontWeight: '600' }}>{title}</Text>
        {subtitle ? <Text variant="caption">{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
    overflow: 'hidden',
    padding: 12,
  },
  gutter: {
    minWidth: 44,
    justifyContent: 'center',
  },
  block: {
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    gap: 6,
    padding: 12,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  badge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dash: {
    borderColor: '#00000000',
    borderRadius: 999,
    borderStyle: 'dashed',
    borderWidth: 1,
    height: 18,
    width: '100%',
  },
});
