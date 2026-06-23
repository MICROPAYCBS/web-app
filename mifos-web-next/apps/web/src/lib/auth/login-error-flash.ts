import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const LOGIN_ERROR_DETAIL_COOKIE = 'mifos-login-error-detail';

/** Keep short errors in the query string; longer troubleshooting output uses a flash cookie. */
const MAX_URL_ERROR_LENGTH = 280;

/** Browsers reject cookies larger than ~4 KB. */
const MAX_COOKIE_VALUE_CHARS = 3_500;

export const LOGIN_ERROR_FLASH_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/login',
  maxAge: 120,
  secure: process.env.NODE_ENV === 'production'
} as const;

function truncateForCookie(message: string): string {
  if (message.length <= MAX_COOKIE_VALUE_CHARS) {
    return message;
  }
  return `${message.slice(0, MAX_COOKIE_VALUE_CHARS)}\n… [truncated — cookie size limit]`;
}

export function loginRedirectWithError(
  request: NextRequest,
  loginUrl: URL,
  message: string
): NextResponse {
  const useFlash = message.length > MAX_URL_ERROR_LENGTH;
  const redirectUrl = new URL(loginUrl.toString());

  if (useFlash) {
    redirectUrl.searchParams.set('error', 'Sign-in failed. See the response details below.');
  } else {
    redirectUrl.searchParams.set('error', message);
  }

  const response = NextResponse.redirect(redirectUrl);
  if (useFlash) {
    try {
      response.cookies.set(
        LOGIN_ERROR_DETAIL_COOKIE,
        truncateForCookie(message),
        LOGIN_ERROR_FLASH_COOKIE_OPTIONS
      );
    } catch {
      redirectUrl.searchParams.set('error', truncateForCookie(message));
      return NextResponse.redirect(redirectUrl);
    }
  }
  return response;
}

export async function readLoginErrorFlash(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const value = cookieStore.get(LOGIN_ERROR_DETAIL_COOKIE)?.value?.trim();
    return value || null;
  } catch {
    return null;
  }
}

export function mergeLoginErrors(
  queryError: string | null,
  flashError: string | null
): string | null {
  if (flashError) {
    return flashError;
  }
  return queryError;
}
