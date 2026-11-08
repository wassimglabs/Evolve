import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  deleteGoogleCredentials,
  getGoogleCredentials,
  saveGoogleCredentials,
} from './credentials';
import { getGoogleConfigurationMessage, getGoogleOAuthConfiguration } from './config';
import {
  finishGoogleAuthorization,
  GOOGLE_DISCOVERY,
  refreshGoogleCredentials,
  revokeGoogleCredentials,
} from './oauth';
import type { GoogleAccountStatus } from './types';
import { GoogleIntegrationError as IntegrationError } from './types';
import {
  deleteConnectedAccount,
  getConnectedAccount,
  saveConnectedAccount,
  updateConnectedAccountStatus,
} from '@/repositories/connected-accounts';
import type { ConnectedAccount } from '@/db/types';

WebBrowser.maybeCompleteAuthSession();

const PROVIDER = 'google';
const REFRESH_BUFFER_MS = 60_000;

function safeErrorMessage(error: unknown): string {
  return error instanceof IntegrationError ? error.message : 'Google account linking failed. Please try again.';
}

export function useGoogleAccount() {
  const [account, setAccount] = useState<ConnectedAccount | null>(null);
  const [status, setStatus] = useState<GoogleAccountStatus>('loading');
  const [busy, setBusy] = useState<'connecting' | 'disconnecting' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [nonce, setNonce] = useState(() => Crypto.randomUUID());

  const configuration = useMemo(() => getGoogleOAuthConfiguration(), []);
  const requestConfig = useMemo<AuthSession.AuthRequestConfig>(
    () => ({
      clientId: configuration?.clientId ?? '',
      redirectUri: configuration?.redirectUri ?? 'evolve:/oauth2redirect',
      responseType: AuthSession.ResponseType.Code,
      scopes: ['openid', 'email', 'profile'],
      usePKCE: true,
      extraParams: {
        nonce,
        access_type: 'offline',
        prompt: 'select_account consent',
      },
    }),
    [configuration, nonce],
  );
  const [request, , promptAsync] = AuthSession.useAuthRequest(requestConfig, GOOGLE_DISCOVERY);

  const loadAccount = useCallback(async () => {
    try {
      const saved = await getConnectedAccount(PROVIDER);
      setStatus('loading');
      setError(null);
      setAccount(saved);
      if (!saved) {
        const orphanedCredentials = await getGoogleCredentials();
        if (orphanedCredentials) {
          let revoked = true;
          try {
            await revokeGoogleCredentials(orphanedCredentials);
          } catch {
            revoked = false;
          }
          await deleteGoogleCredentials();
          if (!revoked) {
            setError('Saved Google credentials were cleared, but remote access could not be revoked.');
          }
        }
        setStatus('disconnected');
        return;
      }

      let credentials;
      try {
        credentials = await getGoogleCredentials();
      } catch (credentialError) {
        if (
          credentialError instanceof IntegrationError &&
          credentialError.code === 'reauth_required'
        ) {
          await updateConnectedAccountStatus(PROVIDER, 'reauth_required');
          setAccount({ ...saved, status: 'reauth_required' });
          setStatus('reauth_required');
          setError(credentialError.message);
          return;
        }
        throw credentialError;
      }
      if (!credentials) {
        await updateConnectedAccountStatus(PROVIDER, 'reauth_required');
        setAccount({ ...saved, status: 'reauth_required' });
        setStatus('reauth_required');
        return;
      }

      if (credentials.expiresAt <= Date.now() + REFRESH_BUFFER_MS) {
        if (!configuration) {
          await updateConnectedAccountStatus(PROVIDER, 'reauth_required');
          setAccount({ ...saved, status: 'reauth_required' });
          setStatus('reauth_required');
          return;
        }
        try {
          const refreshed = await refreshGoogleCredentials(configuration.clientId, credentials);
          await saveGoogleCredentials(refreshed);
          await updateConnectedAccountStatus(PROVIDER, 'connected');
          setAccount({ ...saved, status: 'connected' });
          setStatus('connected');
          return;
        } catch (refreshError) {
          if (
            refreshError instanceof IntegrationError &&
            refreshError.code === 'reauth_required'
          ) {
            await updateConnectedAccountStatus(PROVIDER, 'reauth_required');
            setAccount({ ...saved, status: 'reauth_required' });
            setStatus('reauth_required');
            setError(refreshError.message);
            return;
          }
          throw refreshError;
        }
      }

      if (saved.status !== 'connected') {
        await updateConnectedAccountStatus(PROVIDER, 'connected');
        setAccount({ ...saved, status: 'connected' });
      }
      setStatus('connected');
    } catch (loadError) {
      setStatus('error');
      setError(safeErrorMessage(loadError));
    }
  }, [configuration]);

  useEffect(() => {
    void Promise.resolve().then(loadAccount);
  }, [loadAccount]);

  const connect = useCallback(async () => {
    if (!configuration) {
      setError(getGoogleConfigurationMessage());
      return;
    }
    if (!request) {
      setError('Google sign-in is still preparing. Please try again in a moment.');
      return;
    }

    const requestNonce = nonce;
    setNonce(Crypto.randomUUID());
    setBusy('connecting');
    setError(null);
    setNotice(null);
    try {
      const result = await promptAsync();
      if (result.type === 'cancel' || result.type === 'dismiss') {
        setNotice('Google connection canceled.');
        return;
      }

      const completed = await finishGoogleAuthorization(result, request, configuration.clientId, requestNonce);
      let previous: Awaited<ReturnType<typeof getGoogleCredentials>> = null;
      try {
        previous = await getGoogleCredentials();
      } catch (credentialError) {
        if (
          !(credentialError instanceof IntegrationError) ||
          credentialError.code !== 'reauth_required'
        ) {
          throw credentialError;
        }
      }
      const previousAccount = await getConnectedAccount(PROVIDER);
      const nextCredentials =
        !completed.credentials.refreshToken && previousAccount?.account_id === completed.profile.sub
          ? { ...completed.credentials, refreshToken: previous?.refreshToken }
          : completed.credentials;
      const connectedAccount: ConnectedAccount = {
        provider: PROVIDER,
        account_id: completed.profile.sub,
        email: completed.profile.email,
        display_name: completed.profile.name,
        scopes: completed.scopes,
        status: 'connected',
        connected_at: new Date().toISOString(),
      };

      await saveGoogleCredentials(nextCredentials);
      try {
        await saveConnectedAccount(connectedAccount);
      } catch {
        try {
          if (previous) {
            await saveGoogleCredentials(previous);
          } else {
            await deleteGoogleCredentials();
          }
        } catch {
          throw new IntegrationError(
            'Google account metadata could not be saved and previous secure credentials could not be restored.',
            'storage',
          );
        }
        throw new IntegrationError('Google account metadata could not be saved.', 'storage');
      }

      setAccount(connectedAccount);
      setStatus('connected');
      setNotice('Google account connected.');
    } catch (connectError) {
      setError(safeErrorMessage(connectError));
    } finally {
      setBusy(null);
    }
  }, [configuration, nonce, promptAsync, request]);

  const disconnect = useCallback(async () => {
    setBusy('disconnecting');
    setError(null);
    setNotice(null);

    let revocationFailed = false;
    try {
      const credentials = await getGoogleCredentials();
      if (credentials) await revokeGoogleCredentials(credentials);
    } catch {
      revocationFailed = true;
    }

    let credentialCleanupFailed = false;
    let accountCleanupFailed = false;
    try {
      await deleteGoogleCredentials();
    } catch {
      credentialCleanupFailed = true;
    }
    try {
      await deleteConnectedAccount(PROVIDER);
    } catch {
      accountCleanupFailed = true;
    }

    if (!credentialCleanupFailed && !accountCleanupFailed) {
      setAccount(null);
      setStatus('disconnected');
    } else {
      setStatus('error');
    }

    if (credentialCleanupFailed || accountCleanupFailed) {
      setError('Google disconnect could not fully clear local account data. Please try again.');
    } else if (revocationFailed) {
      setError('Google was disconnected on this device, but remote access could not be revoked.');
    } else {
      setNotice('Google account disconnected.');
    }
    setBusy(null);
  }, []);

  return {
    account,
    status,
    busy,
    error,
    notice,
    canConnect: configuration !== null && request !== null,
    configurationMessage: configuration ? null : getGoogleConfigurationMessage(),
    connect,
    disconnect,
    reload: loadAccount,
  };
}
