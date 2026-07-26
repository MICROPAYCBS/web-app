/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { validateRequestTwoFactorOtp } from '@mifos/validation';
import { requestTwoFactorOtp } from '@/lib/fineract/twofactor';
import {
  parseTwoFactorPendingAuth,
  TWO_FACTOR_PENDING_COOKIE_NAME
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

  const parsed = validateRequestTwoFactorOtp(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: parsed.error.issues[0]?.message ?? 'Invalid delivery method.' },
      { status: 400 }
    );
  }

  const result = await requestTwoFactorOtp(pending, parsed.data.deliveryMethod);
  if (!result.ok) {
    return NextResponse.json({ ok: false, message: result.message }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    tokenLiveTimeInSec: result.result.tokenLiveTimeInSec
  });
}
