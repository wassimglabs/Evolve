import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Text } from '@/components/text';
import type { ConnectedAccount } from '@/db/types';
import type { GoogleAccountStatus } from '@/integrations/google/types';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

type ConnectedAccountCardProps = {
  account: ConnectedAccount | null;
  status: GoogleAccountStatus;
  busy: 'connecting' | 'disconnecting' | null;
  error: string | null;
  notice: string | null;
  canConnect: boolean;
  configurationMessage: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
  onRetry: () => void;
};

export function ConnectedAccountCard({
  account,
  status,
  busy,
  error,
  notice,
  canConnect,
  configurationMessage,
  onConnect,
  onDisconnect,
  onRetry,
}: ConnectedAccountCardProps) {
  const t = useTheme();
  const expired = account?.status === 'reauth_required';

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <FontAwesome name="google" size={22} color="#4285F4" />
        <Text variant="body" style={styles.providerName}>
          Google
        </Text>
      </View>

      {status === 'loading' ? (
        <View style={styles.feedback}>
          <ActivityIndicator color={t.primary} />
          <Text variant="caption">Checking Google connection…</Text>
        </View>
      ) : account ? (
        <>
          <View style={styles.statusRow}>
            <Ionicons
              name={expired || status === 'error' ? 'alert-circle-outline' : 'checkmark-circle-outline'}
              size={18}
              color={expired || status === 'error' ? t.destructive : t.primary}
            />
            <Text variant="caption">
              {expired ? 'Connection expired' : status === 'error' ? 'Could not verify connection' : 'Connected'}
            </Text>
          </View>
          <Text variant="body">{account.email}</Text>
          {account.display_name ? <Text variant="caption">{account.display_name}</Text> : null}
          {expired ? (
            <Text variant="caption">Reconnect to restore your Google account link.</Text>
          ) : status === 'error' ? (
            <Button title="Retry status check" disabled={busy !== null} onPress={onRetry} />
          ) : null}
          {expired ? (
            <Button
              title={busy === 'connecting' ? 'Connecting…' : 'Reconnect Google'}
              disabled={busy !== null || !canConnect}
              onPress={onConnect}
            />
          ) : null}
          <Button
            title={busy === 'disconnecting' ? 'Disconnecting…' : 'Disconnect'}
            variant="destructive"
            disabled={busy !== null}
            onPress={onDisconnect}
          />
        </>
      ) : (
        <>
          <Text variant="muted">
            Link your Google account to keep your account identity connected on this device. Evolve does not access
            Calendar or Classroom.
          </Text>
          {configurationMessage ? <Text variant="caption">{configurationMessage}</Text> : null}
          {status === 'error' ? (
            <Button title="Retry status check" disabled={busy !== null} onPress={onRetry} />
          ) : null}
          <Button
            title={busy === 'connecting' ? 'Connecting…' : canConnect ? 'Connect Google' : 'Google setup required'}
            disabled={busy !== null || !canConnect}
            onPress={onConnect}
          />
        </>
      )}

      {busy ? (
        <View style={styles.feedback}>
          <ActivityIndicator color={t.primary} />
          <Text variant="caption">
            {busy === 'connecting' ? 'Connecting to Google…' : 'Disconnecting Google…'}
          </Text>
        </View>
      ) : null}
      {error ? <Text variant="caption" style={{ color: t.destructive }}>{error}</Text> : null}
      {notice ? <Text variant="caption">{notice}</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  providerName: {
    fontWeight: 600,
  },
  statusRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  feedback: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
