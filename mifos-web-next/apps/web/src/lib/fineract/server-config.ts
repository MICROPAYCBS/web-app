import 'server-only';

export interface FineractServerConfig {
  /** Absolute Fineract API base, e.g. https://localhost:8443/fineract-provider/api/v1 */
  baseUrl: string;
  tenantId: string;
}

/**
 * Server-only Fineract connection settings.
 * Never use NEXT_PUBLIC_* for Fineract — the browser must not know backend URLs or tenants.
 */
export function getFineractServerConfig(): FineractServerConfig {
  const baseUrl =
    process.env.FINERACT_API_URL ??
    process.env.FINERACT_API_BASE_URL ??
    'http://localhost:8443/fineract-provider/api/v1';

  const tenantId = process.env.FINERACT_TENANT_ID ?? 'default';

  return { baseUrl, tenantId };
}
