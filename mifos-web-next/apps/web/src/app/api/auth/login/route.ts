/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { LoginApiFailure, LoginApiNeedsTwoFactor, LoginApiSuccess } from '@/lib/auth/login-api';
import { performLogin, safeLoginRedirectPath } from '@/lib/auth/login-request';
import { loginRedirectWithError } from '@/lib/auth/login-error-flash';
import { wantsJsonLoginResponse } from '@/lib/auth/login-api-server';
import { sessionCookieAttributes } from '@/lib/session/cookie-options';
import {
  TWO_FACTOR_PENDING_MAX_AGE,
  twoFactorPendingCookieAttributes
} from '@/lib/session/pending-twofactor';

export const dynamic = 'force-dynamic';

function loginPageUrl(request: NextRequest, options: { from?: string; error?: string }) {
  const url = new URL('/login', request.url);
  if (options.from && options.from !== '/') {
    url.searchParams.set('from', options.from);
  }
  if (options.error) {
    url.searchParams.set('error', options.error);
  }
  return url;
}

/**
 * Fineract sign-in via standard form POST — Set-Cookie on redirect (reliable on Vercel).
 * Prefer this over server-action login; FormData is read from the request body.
 */
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const redirectTo = safeLoginRedirectPath(String(formData.get('redirectTo') ?? '/'));
  const jsonResponse = wantsJsonLoginResponse(request);
  const result = await performLogin(formData);

  if (!result.ok) {
    if (jsonResponse) {
      const body: LoginApiFailure = { ok: false, message: result.message };
      const status = result.message === 'Username and password are required.' ? 400 : 401;
      return NextResponse.json(body, { status });
    }
    return loginRedirectWithError(
      request,
      loginPageUrl(request, { from: redirectTo }),
      result.message
    );
  }

  if (result.needsTwoFactor) {
    const pendingAttrs = twoFactorPendingCookieAttributes(TWO_FACTOR_PENDING_MAX_AGE);
    if (jsonResponse) {
      const body: LoginApiNeedsTwoFactor = { ok: true, needsTwoFactor: true };
      const response = NextResponse.json(body);
      response.cookies.set(pendingAttrs.name, JSON.stringify(result.pending), pendingAttrs);
      return response;
    }
    const response = NextResponse.redirect(
      loginPageUrl(request, { from: result.pending.redirectTo })
    );
    response.cookies.set(pendingAttrs.name, JSON.stringify(result.pending), pendingAttrs);
    return response;
  }

  revalidatePath('/', 'layout');

  const maxAge = result.remember ? 60 * 60 * 24 * 14 : 60 * 60 * 8;
  const attrs = sessionCookieAttributes(maxAge);
  const clearPending = twoFactorPendingCookieAttributes(0);

  if (jsonResponse) {
    const body: LoginApiSuccess = { ok: true, redirectTo: result.redirectTo };
    const response = NextResponse.json(body);
    response.cookies.set(attrs.name, JSON.stringify(result.session), attrs);
    response.cookies.set(clearPending.name, '', {
      ...clearPending,
      maxAge: 0,
      expires: new Date(0)
    });
    return response;
  }

  const response = NextResponse.redirect(new URL(result.redirectTo, request.url));
  response.cookies.set(attrs.name, JSON.stringify(result.session), attrs);
  response.cookies.set(clearPending.name, '', {
    ...clearPending,
    maxAge: 0,
    expires: new Date(0)
  });
  return response;
}
