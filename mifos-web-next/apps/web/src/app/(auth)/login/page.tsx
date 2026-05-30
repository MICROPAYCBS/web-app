/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { LoginForm } from '@/components/auth/login-form';
import { getActiveFineractServer } from '@/lib/servers/catalog-store';
import { isDemoSessionEnabled } from '@/lib/session/demo-session';
import { getServerSession } from '@/lib/session/server';
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

/** login-04 page shell */
export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const params = await searchParams;
  const redirectTo = safeRedirectPath(params.from);
  const session = await getServerSession();

  if (session) {
    redirect(redirectTo);
  }

  const active = await getActiveFineractServer();
  if (!active) {
    redirect('/connect');
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <LoginForm
          redirectTo={redirectTo}
          demoEnabled={isDemoSessionEnabled()}
          serverName={active.name}
          tenantId={active.tenantId}
        />
      </div>
    </div>
  );
}
