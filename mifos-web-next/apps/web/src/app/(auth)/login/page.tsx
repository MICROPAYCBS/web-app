/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { LoginShell } from '@/components/auth/login-shell';
import { mergeLoginErrors, readLoginErrorFlash } from '@/lib/auth/login-error-flash';
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

function buildLoginQuery(params: { from?: string; servers?: string; error?: string }): string {
  const q = new URLSearchParams();
  if (params.from) {
    q.set('from', params.from);
  }
  if (params.servers === '1') {
    q.set('servers', '1');
  }
  if (params.error) {
    q.set('error', params.error);
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

/** Full-viewport split login with server manager sheet */
export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ from?: string; servers?: string; error?: string; passwordChanged?: string }>;
}) {
  const params = await searchParams;
  const redirectTo = safeRedirectPath(params.from);
  const flashError = await readLoginErrorFlash();
  const loginError = mergeLoginErrors(params.error?.trim() || null, flashError);
  const hadFlashError = Boolean(flashError);
  const loginSuccess =
    params.passwordChanged === '1'
      ? 'Your password was updated. Sign in again with your new password.'
      : null;
  const session = await getServerSession();

  if (session) {
    redirect(redirectTo);
  }

  const catalog = await getServerCatalog();
  const active = getActiveServer(catalog);
  const hasActiveServer = active !== null;

  if (params.servers === '1' && hasActiveServer) {
    redirect(
      `/login${buildLoginQuery({
        from: params.from,
        error: params.error
      })}`
    );
  }

  const openServers = params.servers === '1' && !hasActiveServer;

  return (
    <LoginShell
      catalog={catalog}
      redirectTo={redirectTo}
      loginError={loginError}
      loginSuccess={loginSuccess}
      hadFlashError={hadFlashError}
      demoEnabled={isDemoSessionEnabled()}
      initialServersOpen={openServers}
    />
  );
}
