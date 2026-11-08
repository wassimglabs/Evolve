import type { ConfigContext, ExpoConfig } from 'expo/config';

function getAndroidRedirectData(redirectUri: string | undefined): { scheme: string; host: string; path?: string } | null {
  if (!redirectUri) return null;
  let redirect: URL;
  try {
    redirect = new URL(redirectUri);
  } catch {
    throw new Error('EXPO_PUBLIC_GOOGLE_ANDROID_REDIRECT_URI must be a valid HTTPS URL.');
  }
  if (
    redirect.protocol !== 'https:' ||
    !redirect.hostname ||
    (redirect.port !== '' && redirect.port !== '443') ||
    redirect.username ||
    redirect.password ||
    redirect.search ||
    redirect.hash
  ) {
    throw new Error('EXPO_PUBLIC_GOOGLE_ANDROID_REDIRECT_URI must be an HTTPS URL without query or fragment.');
  }
  return { scheme: 'https', host: redirect.hostname, ...(redirect.pathname !== '/' ? { path: redirect.pathname } : {}) };
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const iosSuffix = '.apps.googleusercontent.com';
  const googleIosScheme =
    iosClientId?.endsWith(iosSuffix) && iosClientId.length > iosSuffix.length
      ? `com.googleusercontent.apps.${iosClientId.slice(0, -iosSuffix.length)}`
      : null;
  const androidRedirect = getAndroidRedirectData(process.env.EXPO_PUBLIC_GOOGLE_ANDROID_REDIRECT_URI);
  const appSchemes = Array.isArray(config.scheme)
    ? config.scheme
    : config.scheme
      ? [config.scheme]
      : [];

  return {
    ...config,
    name: config.name ?? 'Evolve',
    slug: config.slug ?? 'Evolve',
    scheme: [...new Set([...appSchemes, ...(googleIosScheme ? [googleIosScheme] : [])])],
    ...(androidRedirect
      ? {
          android: {
            ...config.android,
            intentFilters: [
              ...(config.android?.intentFilters ?? []),
              {
                action: 'VIEW',
                autoVerify: true,
                category: ['BROWSABLE', 'DEFAULT'],
                data: androidRedirect,
              },
            ],
          },
        }
      : {}),
  };
};
