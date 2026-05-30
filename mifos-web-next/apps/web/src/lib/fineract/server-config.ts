import 'server-only';

import { resolveFineractApiBaseUrl } from '@mifos/servers';
import { getActiveFineractServer } from '@/lib/servers/catalog-store';

export interface FineractServerConfig {
  baseUrl: string;
  tenantId: string;
  serverName: string;
}

/**
 * Active Fineract target from the user's server catalog (httpOnly cookie).
 */
export async function getFineractServerConfig(): Promise<FineractServerConfig> {
  const active = await getActiveFineractServer();
  if (!active) {
    throw new Error('NO_ACTIVE_SERVER');
  }
  return {
    baseUrl: resolveFineractApiBaseUrl(active.baseUrl),
    tenantId: active.tenantId,
    serverName: active.name
  };
}
