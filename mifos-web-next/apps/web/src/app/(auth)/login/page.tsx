/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { AppLink } from '@/components/routes/app-link';
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

  const demoEnabled = isDemoSessionEnabled();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="rounded-lg border border-border bg-muted/40 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Fineract server
          </p>
          <p className="mt-1 font-medium">{active.name}</p>
          <p className="text-xs text-muted-foreground">Tenant: {active.tenantId}</p>
          <AppLink
            route="connect"
            className="mt-3 inline-block text-sm text-primary underline-offset-4 hover:underline"
          >
            Change server
          </AppLink>
        </div>

        <div className="rounded-lg border border-border bg-card p-8 shadow-sm">
          <div className="mb-6">
            <h1 className="text-xl font-semibold">Sign in</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your credentials are sent to Fineract through this app&apos;s server only — never
              from the browser directly.
            </p>
          </div>
          <LoginForm redirectTo={redirectTo} demoEnabled={demoEnabled} />
        </div>
      </div>
    </div>
  );
}
