import 'server-only';

/**
 * Derives the Fineract provider root from an API base URL.
 * e.g. `https://host/fineract-provider/api/v1` → `https://host/fineract-provider`
 */
export function getFineractProviderRoot(apiBaseUrl: string): string {
  const trimmed = apiBaseUrl.replace(/\/$/, '');
  if (trimmed.endsWith('/api/v1')) {
    return trimmed.slice(0, -'/api/v1'.length);
  }
  if (trimmed.endsWith('/api')) {
    return trimmed.slice(0, -'/api'.length);
  }
  return trimmed;
}

export function actuatorHealthUrl(providerRoot: string): string {
  return `${providerRoot.replace(/\/$/, '')}/actuator/health`;
}

export function actuatorInfoUrl(providerRoot: string): string {
  return `${providerRoot.replace(/\/$/, '')}/actuator/info`;
}
