export type GoogleCredentials = {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
};

export type GoogleProfile = {
  sub: string;
  email: string;
  name: string | null;
};

export type GoogleAccountStatus = 'loading' | 'disconnected' | 'connected' | 'reauth_required' | 'error';

export class GoogleIntegrationError extends Error {
  constructor(
    message: string,
    readonly code: 'configuration' | 'oauth' | 'reauth_required' | 'network' | 'storage',
  ) {
    super(message);
    this.name = 'GoogleIntegrationError';
  }
}
