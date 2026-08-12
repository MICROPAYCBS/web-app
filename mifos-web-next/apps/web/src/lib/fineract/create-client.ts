import 'server-only';

import { FineractClient } from '@mifos/api-client';
import { redirect } from 'next/navigation';
import {
  sessionTerminatedLoginReason,
  sessionTerminatedLogoutPath
} from '@/lib/auth/session-terminated';
import { fineractFetch } from '@/lib/fineract/fineract-fetch';
import { getServerSession } from '@/lib/session/server';
import { getFineractServerConfig } from './server-config';

/**
 * Fineract HTTP client for server-side use only (RSC, Route Handlers, Server Actions).
 */
export async function createFineractClient(): Promise<FineractClient> {
  const { baseUrl, tenantId } = await getFineractServerConfig();
  const session = await getServerSession();
  const hadTfaToken = Boolean(session?.twoFactorAccessToken);

  return new FineractClient({
    baseUrl,
    tenantId,
    fetch: async (input, init) => {
      if (!session?.twoFactorAccessToken) {
        return fineractFetch(input, init);
      }
      const headers = new Headers(init?.headers);
      headers.set('Fineract-Platform-TFA-Token', session.twoFactorAccessToken);
      return fineractFetch(input, { ...init, headers });
    },
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
    },
    onUnauthorized: (error) => {
      const reason = sessionTerminatedLoginReason(
        error.status,
        error.platformReason,
        hadTfaToken
      );
      if (!reason) {
        return;
      }
      // Route Handler logout clears cookies reliably. Do not invalidate the dead
      // TFA token through this client — that would 401-loop.
      redirect(sessionTerminatedLogoutPath(reason));
    }
  });
}
