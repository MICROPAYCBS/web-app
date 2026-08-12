/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { invalidateTwoFactorAccessToken } from '@/lib/fineract/twofactor';
import { SESSION_COOKIE_NAME } from '@/lib/session/constants';
import { sessionCookieAttributes } from '@/lib/session/cookie-options';
import { parseServerSessionJson } from '@/lib/session/sanitize';
import { twoFactorPendingCookieAttributes } from '@/lib/session/pending-twofactor';

export const dynamic = 'force-dynamic';

/**
 * Sign out via full navigation — clears `mifos-session` on the redirect response.
 * Prefer this over server-action logout; Set-Cookie is reliable on Route Handlers.
 */
async function logoutRedirect(request: NextRequest) {
  const reason = request.nextUrl.searchParams.get('reason');
  const sessionEnded = reason === 'sessionSuperseded' || reason === 'sessionExpired';
  const session = parseServerSessionJson(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  // Dead TFA tokens 401; skip invalidate so we do not loop through the client.
  if (!sessionEnded && session?.twoFactorAccessToken) {
    await invalidateTwoFactorAccessToken(session);
  }

  const loginUrl = new URL('/login', request.url);
  if (reason === 'sessionSuperseded') {
    loginUrl.searchParams.set('sessionSuperseded', '1');
  } else if (reason === 'sessionExpired') {
    loginUrl.searchParams.set('sessionExpired', '1');
  } else {
    loginUrl.searchParams.set('signedOut', '1');
  }
  const response = NextResponse.redirect(loginUrl);

  const attrs = sessionCookieAttributes(0);
  response.cookies.set(attrs.name, '', {
    ...attrs,
    maxAge: 0,
    expires: new Date(0)
  });

  const pendingAttrs = twoFactorPendingCookieAttributes(0);
  response.cookies.set(pendingAttrs.name, '', {
    ...pendingAttrs,
    maxAge: 0,
    expires: new Date(0)
  });

  return response;
}

export async function GET(request: NextRequest) {
  return logoutRedirect(request);
}

export async function POST(request: NextRequest) {
  return logoutRedirect(request);
}
