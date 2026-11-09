import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { LargeHeader } from '@/components/large-header';
import { Screen } from '@/components/screen';
import { SectionLabel } from '@/components/section-label';
import { Segmented } from '@/components/segmented';
import { StatusPill } from '@/components/status-pill';
import { Switch } from '@/components/switch';
import { Text } from '@/components/text';
import { haptics } from '@/lib/haptics';
import { VIEWPORT_OPTIONS } from '@/lib/viewport';
import { useDeveloperCounts } from '@/hooks/use-developer-counts';
import { useBooleanSetting, useSetting } from '@/hooks/use-setting';
import { useGoogleAccount } from '@/integrations/google/use-google-account';
import { colors } from '@/theme/tokens';
import { fonts } from '@/theme/fonts';

const TONES: readonly string[] = ['Direct', 'Encouraging', 'Reflective'];
const TONE_LABELS: Record<string, string> = {
  direct: 'Direct',
  encouraging: 'Encouraging',
  reflective: 'Reflective',
};

function toneLabel(stored: string): string {
  return TONE_LABELS[stored] ?? 'Direct';
}

function toneToStored(label: string): string {
  return label.toLowerCase();
}

const VIEWPORT_LABELS: readonly string[] = ['Device', ...VIEWPORT_OPTIONS.map(String)];

export default function SettingsScreen() {
  const [storedLimit, setStoredLimit] = useSetting('notif_daily_limit', '4');
  const [quietHours, setQuietHours] = useBooleanSetting('quiet_hours_on', true);
  const [storedTone, setStoredTone] = useSetting('notif_tone', 'direct');
  const [suggestLowEnergy, setSuggestLowEnergy] = useBooleanSetting('suggest_low_energy', true);
  const [storedViewport, setStoredViewport] = useSetting('dev_viewport', 'device');
  const { line, reload } = useDeveloperCounts();
  const [busy, setBusy] = useState(false);
  const google = useGoogleAccount();

  const dailyLimit = Number(storedLimit);
  const setDailyLimit = useCallback(
    (next: number) => {
      const clamped = Math.min(Math.max(next, 0), 10);
      if (clamped !== dailyLimit) {
        haptics.selection();
        setStoredLimit(String(clamped));
      }
    },
    [dailyLimit, setStoredLimit],
  );

  const runDeveloperAction = useCallback(
    (action: () => Promise<void>) => {
      setBusy(true);
      void (async () => {
        try {
          await action();
        } catch (error) {
          Alert.alert('Action failed', error instanceof Error ? error.message : 'Please try again.');
        } finally {
          setBusy(false);
          await reload();
        }
      })();
    },
    [reload],
  );

  return (
    <Screen gap={16}>
      <LargeHeader overline="Rules and data" title="Settings" onBack={() => router.back()} />

      <View style={styles.section}>
        <SectionLabel>Notifications</SectionLabel>
        <Card variant="flush">
          <View style={[styles.row60, styles.divider]}>
            <Text style={styles.rowTitle}>Daily limit</Text>
            <View style={styles.stepper}>
              <StepperButton glyph="−" disabled={dailyLimit <= 0} onPress={() => setDailyLimit(dailyLimit - 1)} />
              <Text style={styles.stepperValue}>{dailyLimit}</Text>
              <StepperButton glyph="+" disabled={dailyLimit >= 10} onPress={() => setDailyLimit(dailyLimit + 1)} />
            </View>
          </View>
          <View style={[styles.row60, styles.divider]}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowTitle}>Quiet hours</Text>
              <Text style={styles.caption}>22:30 to 07:30</Text>
            </View>
            <Switch value={quietHours} onValueChange={setQuietHours} />
          </View>
          <View style={styles.toneRow}>
            <Text style={styles.rowTitle}>Tone</Text>
            <Segmented
              variant="tone"
              options={TONES}
              value={toneLabel(storedTone)}
              onChange={(next) => setStoredTone(toneToStored(next))}
            />
          </View>
        </Card>
      </View>

      <View style={styles.section}>
        <SectionLabel>Day modes</SectionLabel>
        <Card variant="flush">
          <View style={styles.row64}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowTitle}>Suggest Low energy mode</Text>
              <Text style={styles.caption}>When a check-in reports energy of 2 or less</Text>
            </View>
            <Switch value={suggestLowEnergy} onValueChange={setSuggestLowEnergy} />
          </View>
        </Card>
      </View>

      <View style={styles.section}>
        <SectionLabel>Your data</SectionLabel>
        <Card variant="padded" style={styles.dataCard}>
          <Text style={styles.body}>Everything stays on this phone. Add and manage the records that appear across the app.</Text>
          <Button variant="primary" size="block" onPress={() => router.push('/me/data')}>
            Manage all records
          </Button>
        </Card>
      </View>

      <View style={styles.section}>
        <SectionLabel>Connected accounts</SectionLabel>
        <Card variant="padded" style={styles.accountCard}>
          <View style={styles.accountRow}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowTitle}>Google</Text>
              {google.account ? (
                <Text style={styles.caption}>{google.account.email}</Text>
              ) : null}
            </View>
            <StatusPill
              label={
                google.busy === 'connecting'
                  ? 'Connecting'
                  : google.busy === 'disconnecting'
                    ? 'Disconnecting'
                    : google.status === 'connected'
                      ? 'Connected'
                      : google.status === 'reauth_required'
                        ? 'Reconnect needed'
                        : google.status === 'error'
                          ? 'Error'
                          : google.status === 'loading'
                            ? 'Loading'
                            : 'Not connected'
              }
              tone={google.status === 'connected' ? 'positive' : 'neutral'}
            />
          </View>
          {google.configurationMessage ? (
            <Text style={styles.caption}>{google.configurationMessage}</Text>
          ) : null}
          {google.error ? <Text style={styles.accountError}>{google.error}</Text> : null}
          {google.notice ? <Text style={styles.accountNotice}>{google.notice}</Text> : null}
          <View style={styles.accountActions}>
            {google.account ? (
              <Button
                variant="secondary"
                size="compact"
                disabled={google.busy !== null}
                onPress={() =>
                  Alert.alert('Disconnect Google?', 'Google account access will be removed from this device.', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Disconnect', style: 'destructive', onPress: () => void google.disconnect() },
                  ])
                }>
                {google.busy === 'disconnecting' ? 'Disconnecting…' : 'Disconnect'}
              </Button>
            ) : (
              <Button
                variant="primary"
                size="compact"
                disabled={!google.canConnect || google.busy !== null || google.status === 'loading'}
                onPress={() => void google.connect()}>
                {google.busy === 'connecting' ? 'Connecting…' : 'Connect Google'}
              </Button>
            )}
          </View>
        </Card>
      </View>

      <View style={styles.section}>
        <SectionLabel>Developer</SectionLabel>
        <Card variant="dashedDev" style={styles.devCard}>
          <Text style={[styles.devLine, { fontVariant: ['tabular-nums'] }]}>{line}</Text>
          {__DEV__ ? (
            <View style={styles.viewportRow}>
              <Text style={styles.rowTitle}>Viewport</Text>
              <Segmented
                variant="tone"
                options={VIEWPORT_LABELS}
                value={storedViewport === 'device' ? 'Device' : storedViewport}
                onChange={(next) => setStoredViewport(next === 'Device' ? 'device' : next)}
              />
            </View>
          ) : null}
          <View style={styles.buttonRow}>
            <Button
              variant="danger"
              size="block"
              disabled={busy}
              onPress={() => Alert.alert('Wipe all records?', 'This removes your tasks, habits, logs, jobs, ideas and check-ins from this device.', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Wipe data',
                  style: 'destructive',
                  onPress: () => runDeveloperAction(async () => {
                    const { wipeAllData } = await import('@/db/client');
                    await wipeAllData();
                  }),
                },
              ])}>
              Wipe data
            </Button>
          </View>
        </Card>
      </View>
    </Screen>
  );
}

function StepperButton({ glyph, onPress, disabled }: { glyph: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled ?? false }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.stepperButton, (pressed || disabled) && { opacity: disabled ? 0.4 : 0.85 }]}>
      <Text style={styles.stepperGlyph}>{glyph}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 8,
  },
  row60: {
    minHeight: 60,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  row64: {
    minHeight: 64,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  rowLeft: {
    gap: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  rowTitle: {
    fontSize: 14.5,
    fontFamily: fonts.interMedium,
    color: colors.text,
  },
  caption: {
    fontSize: 12.5,
    fontFamily: fonts.inter,
    color: colors.muted,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepperButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperGlyph: {
    fontSize: 20,
    fontFamily: fonts.inter,
    color: colors.text,
  },
  stepperValue: {
    minWidth: 28,
    textAlign: 'center',
    fontSize: 16,
    fontFamily: fonts.interSemiBold,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  toneRow: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  dataCard: {
    gap: 10,
  },
  accountCard: {
    gap: 10,
  },
  accountRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  accountActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  accountError: {
    color: colors.danger.text,
    fontSize: 12.5,
    fontFamily: fonts.inter,
  },
  accountNotice: {
    color: colors.accent,
    fontSize: 12.5,
    fontFamily: fonts.inter,
  },
  devCard: {
    gap: 10,
  },
  devLine: {
    fontSize: 12.5,
    fontFamily: fonts.inter,
    color: colors.muted,
  },
  viewportRow: {
    gap: 10,
  },
  body: {
    fontSize: 13,
    fontFamily: fonts.inter,
    color: colors.muted,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
});
