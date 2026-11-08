const GOOGLE_CLIENT_ID_SUFFIX = '.apps.googleusercontent.com';

export function getGoogleIosRedirectScheme(clientId: string | undefined): string | null {
  if (!clientId?.endsWith(GOOGLE_CLIENT_ID_SUFFIX)) return null;
  const projectId = clientId.slice(0, -GOOGLE_CLIENT_ID_SUFFIX.length);
  return projectId ? `com.googleusercontent.apps.${projectId}` : null;
}
