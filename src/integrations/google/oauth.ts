import * as AuthSession from 'expo-auth-session';

import type { GoogleCredentials, GoogleProfile } from './types';
import { GoogleIntegrationError } from './types';

export const GOOGLE_SCOPES = ['openid', 'email', 'profile'] as const;

export const GOOGLE_DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
  userInfoEndpoint: 'https://openidconnect.googleapis.com/v1/userinfo',
} as const;

type IdTokenClaims = {
  aud?: string | string[];
  azp?: string;
  exp?: number;
  iss?: string;
  nonce?: string;
  sub?: string;
  email?: string;
  email_verified?: boolean;
};

function decodeIdTokenClaims(idToken: string): IdTokenClaims {
  const payload = idToken.split('.')[1];
  if (!payload) throw new GoogleIntegrationError('Google returned an invalid identity token.', 'oauth');

  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = decodeURIComponent(
      Array.from(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')))
        .map((character) => `%${character.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join(''),
    );
    return JSON.parse(decoded) as IdTokenClaims;
  } catch {
    throw new GoogleIntegrationError('Google returned an invalid identity token.', 'oauth');
  }
}

function validateIdToken(idToken: string, clientId: string, nonce: string): IdTokenClaims {
  const claims = decodeIdTokenClaims(idToken);
  const audienceMatches = Array.isArray(claims.aud)
    ? claims.aud.includes(clientId)
    : claims.aud === clientId;
  if (
    !audienceMatches ||
    (Array.isArray(claims.aud) && claims.azp !== undefined && claims.azp !== clientId) ||
    (claims.iss !== 'https://accounts.google.com' && claims.iss !== 'accounts.google.com') ||
    typeof claims.exp !== 'number' ||
    claims.exp <= Math.floor(Date.now() / 1000) ||
    claims.nonce !== nonce ||
    typeof claims.sub !== 'string' ||
    !claims.sub
  ) {
    throw new GoogleIntegrationError('Google identity verification failed. Please try again.', 'oauth');
  }
  return claims;
}

async function getGoogleProfile(accessToken: string, claims: IdTokenClaims): Promise<GoogleProfile> {
  let response: Response;
  try {
    response = await fetch(GOOGLE_DISCOVERY.userInfoEndpoint, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch {
    throw new GoogleIntegrationError('Could not reach Google. Check your connection and try again.', 'network');
  }
  if (!response.ok) {
    throw new GoogleIntegrationError('Google could not verify this account. Please try again.', 'oauth');
  }

  let profile: unknown;
  try {
    profile = await response.json();
  } catch {
    throw new GoogleIntegrationError('Google returned an invalid account profile.', 'oauth');
  }
  if (
    typeof profile !== 'object' ||
    profile === null ||
    !('sub' in profile) ||
    typeof profile.sub !== 'string' ||
    profile.sub !== claims.sub ||
    !('email' in profile) ||
    typeof profile.email !== 'string' ||
    !('email_verified' in profile) ||
    profile.email_verified !== true ||
    ('name' in profile && profile.name !== null && typeof profile.name !== 'string')
  ) {
    throw new GoogleIntegrationError('Google did not return a verified email address.', 'oauth');
  }
  return {
    sub: profile.sub,
    email: profile.email,
    name: 'name' in profile && typeof profile.name === 'string' ? profile.name : null,
  };
}

export async function finishGoogleAuthorization(
  result: AuthSession.AuthSessionResult,
  request: AuthSession.AuthRequest,
  clientId: string,
  nonce: string,
): Promise<{ profile: GoogleProfile; credentials: GoogleCredentials; scopes: string[] }> {
  if (result.type !== 'success') {
    if (result.type === 'error') {
      throw new GoogleIntegrationError('Google sign-in failed. Please try again.', 'oauth');
    }
    throw new GoogleIntegrationError('Google sign-in did not complete.', 'oauth');
  }
  if (result.params.state !== request.state) {
    throw new GoogleIntegrationError('Google sign-in could not be verified. Please try again.', 'oauth');
  }
  if (!request.codeVerifier || !result.params.code) {
    throw new GoogleIntegrationError('Google sign-in did not return an authorization code.', 'oauth');
  }

  let tokens: AuthSession.TokenResponse;
  try {
    tokens = await AuthSession.exchangeCodeAsync(
      {
        clientId,
        code: result.params.code,
        redirectUri: request.redirectUri,
        scopes: [...GOOGLE_SCOPES],
        extraParams: { code_verifier: request.codeVerifier },
      },
      GOOGLE_DISCOVERY,
    );
  } catch {
    throw new GoogleIntegrationError('Could not complete Google sign-in. Please try again.', 'oauth');
  }
  if (!tokens.idToken || !tokens.accessToken || !tokens.expiresIn) {
    throw new GoogleIntegrationError('Google returned an incomplete sign-in response.', 'oauth');
  }

  const claims = validateIdToken(tokens.idToken, clientId, nonce);
  if (claims.email_verified !== true) {
    throw new GoogleIntegrationError('Google did not verify this email address.', 'oauth');
  }
  const profile = await getGoogleProfile(tokens.accessToken, claims);
  if (claims.email && claims.email.toLowerCase() !== profile.email.toLowerCase()) {
    throw new GoogleIntegrationError('Google returned inconsistent account details.', 'oauth');
  }
  return {
    profile,
    credentials: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: (tokens.issuedAt + tokens.expiresIn) * 1000,
    },
    scopes: tokens.scope ? tokens.scope.split(' ') : [...GOOGLE_SCOPES],
  };
}

function parseTokenResponse(value: unknown): {
  access_token?: unknown;
  expires_in?: unknown;
  refresh_token?: unknown;
  scope?: unknown;
  error?: unknown;
} {
  if (typeof value !== 'object' || value === null) {
    throw new GoogleIntegrationError('Google returned an invalid token response.', 'oauth');
  }
  return value;
}

export async function refreshGoogleCredentials(
  clientId: string,
  credentials: GoogleCredentials,
): Promise<GoogleCredentials> {
  if (!credentials.refreshToken) {
    throw new GoogleIntegrationError('Reconnect your Google account to continue.', 'reauth_required');
  }

  let response: Response;
  try {
    response = await fetch(GOOGLE_DISCOVERY.tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        grant_type: 'refresh_token',
        refresh_token: credentials.refreshToken,
      }).toString(),
    });
  } catch {
    throw new GoogleIntegrationError('Could not check Google credentials. Check your connection and retry.', 'network');
  }

  let payload: ReturnType<typeof parseTokenResponse>;
  try {
    payload = parseTokenResponse(await response.json());
  } catch {
    throw new GoogleIntegrationError('Google returned an invalid token response.', 'oauth');
  }
  if (!response.ok) {
    if (payload.error === 'invalid_grant' || payload.error === 'invalid_token') {
      throw new GoogleIntegrationError('Reconnect your Google account to continue.', 'reauth_required');
    }
    throw new GoogleIntegrationError('Google credentials could not be refreshed. Please retry.', 'oauth');
  }
  if (typeof payload.access_token !== 'string' || typeof payload.expires_in !== 'number') {
    throw new GoogleIntegrationError('Google returned an incomplete token response.', 'oauth');
  }
  return {
    accessToken: payload.access_token,
    refreshToken: typeof payload.refresh_token === 'string' ? payload.refresh_token : credentials.refreshToken,
    expiresAt: Date.now() + payload.expires_in * 1000,
  };
}

export async function revokeGoogleCredentials(credentials: GoogleCredentials): Promise<void> {
  const token = credentials.refreshToken ?? credentials.accessToken;
  let response: Response;
  try {
    response = await fetch(GOOGLE_DISCOVERY.revocationEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ token }).toString(),
    });
  } catch {
    throw new GoogleIntegrationError('Google could not be reached to revoke access.', 'network');
  }
  if (!response.ok) {
    throw new GoogleIntegrationError('Google could not revoke access.', 'oauth');
  }
}
