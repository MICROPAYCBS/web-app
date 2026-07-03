/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import 'server-only';

import { getServerSession } from '@/lib/session/server';
import { getFineractServerConfig } from './server-config';

/**
 * Dev-only: allow HTTPS to Fineract with self-signed certificates (typical localhost:8443).
 * Disabled when `FINERACT_STRICT_TLS=1` or outside development.
 */
export function isDevInsecureTlsEnabled(): boolean {
  if (process.env.NODE_ENV !== 'development') {
    return false;
  }
  const strict = process.env.FINERACT_STRICT_TLS?.trim().toLowerCase();
  return strict !== '1' && strict !== 'true';
}

/**
 * Node's native `fetch` cannot use a custom undici `Agent` from the npm package — it breaks
 * all HTTPS requests. In dev we relax TLS verification process-wide instead.
 */
function configureDevInsecureTls(): void {
  if (!isDevInsecureTlsEnabled()) {
    return;
  }
  if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0') {
    return;
  }
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

configureDevInsecureTls();

/** Server-side fetch to Fineract (TLS relaxed in dev when {@link isDevInsecureTlsEnabled}). */
export function fineractFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  configureDevInsecureTls();
  return fetch(input, {
    ...init,
    cache: init?.cache ?? 'no-store'
  });
}

export async function buildFineractRequestInit(
  init: RequestInit = {}
): Promise<{ urlBase: string; init: RequestInit }> {
  configureDevInsecureTls();
  const { baseUrl, tenantId } = await getFineractServerConfig();
  const session = await getServerSession();
  const headers = new Headers(init.headers);
  headers.set('Fineract-Platform-TenantId', tenantId);
  if (session?.accessToken) {
    headers.set('Authorization', `Bearer ${session.accessToken}`);
  } else if (session?.base64EncodedAuthenticationKey) {
    headers.set('Authorization', `Basic ${session.base64EncodedAuthenticationKey}`);
  }
  return {
    urlBase: baseUrl.replace(/\/$/, ''),
    init: { ...init, headers }
  };
}

export function fineractUrl(urlBase: string, path: string): string {
  return `${urlBase}/${path.replace(/^\//, '')}`;
}
