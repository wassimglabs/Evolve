import { makeRedirectUri } from 'expo-auth-session';
import { Platform } from 'react-native';

import { getGoogleIosRedirectScheme } from './redirect-scheme';

export type GoogleOAuthConfiguration = {
  clientId: string;
  redirectUri: string;
};

export function getGoogleOAuthConfiguration(): GoogleOAuthConfiguration | null {
  if (Platform.OS === 'ios') {
    const clientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
    const scheme = getGoogleIosRedirectScheme(clientId);
    if (!clientId || !scheme) return null;
    return {
      clientId,
      redirectUri: makeRedirectUri({ native: `${scheme}:/oauth2redirect` }),
    };
  }

  if (Platform.OS === 'android') {
    const clientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
    const redirectUri = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_REDIRECT_URI;
    if (!clientId || !redirectUri) return null;
    try {
      const parsed = new URL(redirectUri);
      if (
        parsed.protocol !== 'https:' ||
        (parsed.port !== '' && parsed.port !== '443') ||
        parsed.username ||
        parsed.password ||
        parsed.search ||
        parsed.hash
      ) {
        return null;
      }
    } catch {
      return null;
    }
    return { clientId, redirectUri };
  }

  return null;
}

export function getGoogleConfigurationMessage(): string {
  if (Platform.OS === 'ios') {
    return 'Add an iOS Google OAuth client ID to the local environment and rebuild the app.';
  }
  if (Platform.OS === 'android') {
    return 'Add an Android Google OAuth client ID and verified HTTPS redirect URI, then rebuild the app.';
  }
  return 'Google account linking is available in an iOS or Android development build.';
}
