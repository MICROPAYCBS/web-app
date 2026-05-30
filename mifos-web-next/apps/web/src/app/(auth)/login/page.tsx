/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { LoginShell } from '@/components/auth/login-shell';
import { getServerCatalog } from '@/lib/servers/catalog-store';
import { isDemoSessionEnabled } from '@/lib/session/demo-session';
import { getServerSession } from '@/lib/session/server';
import { getActiveServer } from '@mifos/servers';
import { redirect } from 'next/navigation';

function safeRedirectPath(value: string | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return '/';
  }
  if (value.startsWith('/login') || value.startsWith('/connect')) {
    return '/';
  }
  return value;
}

function buildLoginQuery(params: {
  from?: string;
  signedOut?: string;
  servers?: string;
}): string {
  const q = new URLSearchParams();
  if (params.from) {
    q.set('from', params.from);
  }
  if (params.signedOut === '1') {
    q.set('signedOut', '1');
  }
  if (params.servers === '1') {
    q.set('servers', '1');
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

/** login-04 page shell with integrated Fineract server manager sheet */
export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ from?: string; signedOut?: string; servers?: string }>;
}) {
  const params = await searchParams;
  const redirectTo = safeRedirectPath(params.from);
  const signedOut = params.signedOut === '1';
  const session = await getServerSession();

  if (session) {
    redirect(redirectTo);
  }

  const catalog = await getServerCatalog();
  const active = getActiveServer(catalog);
  const hasActiveServer = active !== null;

  // Drop ?servers=1 when a server is already selected (refresh/bookmark hygiene).
  if (params.servers === '1' && hasActiveServer) {
    redirect(
      `/login${buildLoginQuery({ from: params.from, signedOut: params.signedOut })}`
    );
  }

  const openServers = params.servers === '1' && !hasActiveServer;

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <LoginShell
          catalog={catalog}
          redirectTo={redirectTo}
          signedOut={signedOut}
          demoEnabled={isDemoSessionEnabled()}
          initialServersOpen={openServers}
        />
      </div>
    </div>
  );
}
