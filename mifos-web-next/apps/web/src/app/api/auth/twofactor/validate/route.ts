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
import { validateValidateTwoFactorOtp } from '@mifos/validation';
import { validateTwoFactorOtp } from '@/lib/fineract/twofactor';
import { sessionCookieAttributes } from '@/lib/session/cookie-options';
import {
  parseTwoFactorPendingAuth,
  TWO_FACTOR_PENDING_COOKIE_NAME,
  twoFactorPendingCookieAttributes
} from '@/lib/session/pending-twofactor';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const pending = parseTwoFactorPendingAuth(
    request.cookies.get(TWO_FACTOR_PENDING_COOKIE_NAME)?.value
  );
  if (!pending) {
    return NextResponse.json(
      { ok: false, message: 'Your sign-in session expired. Sign in again.' },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = validateValidateTwoFactorOtp(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: parsed.error.issues[0]?.message ?? 'Enter the verification code.' },
      { status: 400 }
    );
  }

  const result = await validateTwoFactorOtp(pending, parsed.data.token);
  const clearPending = twoFactorPendingCookieAttributes(0);

  if (!result.ok) {
    const response = NextResponse.json(
      { ok: false, message: result.message },
      { status: result.passwordExpired ? 403 : 400 }
    );
    if (result.passwordExpired) {
      response.cookies.set(clearPending.name, '', {
        ...clearPending,
        maxAge: 0,
        expires: new Date(0)
      });
    }
    return response;
  }

  revalidatePath('/', 'layout');

  const maxAge = result.remember ? 60 * 60 * 24 * 14 : 60 * 60 * 8;
  const attrs = sessionCookieAttributes(maxAge);
  const response = NextResponse.json({ ok: true, redirectTo: result.redirectTo });
  response.cookies.set(attrs.name, JSON.stringify(result.session), attrs);
  response.cookies.set(clearPending.name, '', {
    ...clearPending,
    maxAge: 0,
    expires: new Date(0)
  });
  return response;
}
