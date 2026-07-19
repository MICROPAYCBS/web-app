import 'server-only';

import { FineractClient } from '@mifos/api-client';
import { fineractFetch } from '@/lib/fineract/fineract-fetch';
import { getServerSession } from '@/lib/session/server';
import { getFineractServerConfig } from './server-config';

/**
 * Fineract HTTP client for server-side use only (RSC, Route Handlers, Server Actions).
 */
export async function createFineractClient(): Promise<FineractClient> {
  const { baseUrl, tenantId } = await getFineractServerConfig();
  const session = await getServerSession();

  return new FineractClient({
    baseUrl,
    tenantId,
    fetch: fineractFetch,
    getAuthHeader: async () => {
      if (!session) {
        return null;
      }
      if (session.accessToken) {
        return `Bearer ${session.accessToken}`;
      }
      if (session.base64EncodedAuthenticationKey) {
        return `Basic ${session.base64EncodedAuthenticationKey}`;
      }
      return null;
    }
  });
}
