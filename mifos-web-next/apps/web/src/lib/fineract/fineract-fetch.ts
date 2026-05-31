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

export async function buildFineractRequestInit(
  init: RequestInit = {}
): Promise<{ urlBase: string; init: RequestInit }> {
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
