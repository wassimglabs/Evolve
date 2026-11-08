import * as SecureStore from 'expo-secure-store';

import type { GoogleCredentials } from './types';
import { GoogleIntegrationError } from './types';

const CREDENTIALS_KEY = 'evolve.google.oauth.credentials.v1';

function isGoogleCredentials(value: unknown): value is GoogleCredentials {
  if (typeof value !== 'object' || value === null || !('accessToken' in value) || !('expiresAt' in value)) {
    return false;
  }
  return (
    typeof value.accessToken === 'string' &&
    value.accessToken.length > 0 &&
    typeof value.expiresAt === 'number' &&
    Number.isFinite(value.expiresAt) &&
    (!('refreshToken' in value) || value.refreshToken === undefined || typeof value.refreshToken === 'string')
  );
}

export async function getGoogleCredentials(): Promise<GoogleCredentials | null> {
  let value: string | null;
  try {
    value = await SecureStore.getItemAsync(CREDENTIALS_KEY);
  } catch {
    throw new GoogleIntegrationError('Google credentials could not be read from secure storage.', 'storage');
  }
  if (!value) return null;

  try {
    const credentials: unknown = JSON.parse(value);
    if (!isGoogleCredentials(credentials)) {
      await deleteGoogleCredentials();
      throw new GoogleIntegrationError('Saved Google credentials are invalid. Reconnect your account.', 'reauth_required');
    }
    return credentials;
  } catch (error) {
    if (error instanceof GoogleIntegrationError) throw error;
    await deleteGoogleCredentials();
    throw new GoogleIntegrationError('Saved Google credentials are invalid. Reconnect your account.', 'reauth_required');
  }
}

export async function saveGoogleCredentials(credentials: GoogleCredentials): Promise<void> {
  try {
    await SecureStore.setItemAsync(CREDENTIALS_KEY, JSON.stringify(credentials));
  } catch {
    throw new GoogleIntegrationError('Google credentials could not be saved securely.', 'storage');
  }
}

export async function deleteGoogleCredentials(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(CREDENTIALS_KEY);
  } catch {
    throw new GoogleIntegrationError('Google credentials could not be removed from secure storage.', 'storage');
  }
}
