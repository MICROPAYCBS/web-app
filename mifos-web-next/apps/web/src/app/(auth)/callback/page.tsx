/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * OAuth provider callback landing route.
 * Token exchange is not wired yet — send users back to sign in.
 */
export default async function OAuthCallbackPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const error = typeof params.error === 'string' ? params.error : undefined;

  if (!error && process.env.OAUTH_CALLBACK_REDIRECT === 'login') {
    redirect('/login');
  }

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-xl font-semibold">Sign-in callback</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        {error
          ? `The identity provider returned an error: ${error}.`
          : 'OAuth sign-in is not configured on this deployment yet. Use username and password on the sign-in page.'}
      </p>
      <Link href="/login" className={cn(buttonVariants())}>
        Back to sign in
      </Link>
    </main>
  );
}
