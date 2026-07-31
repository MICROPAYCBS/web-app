/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { enrollTotp } from '@/lib/fineract/twofactor';
import {
  parseTwoFactorPendingAuth,
  TWO_FACTOR_PENDING_COOKIE_NAME
} from '@/lib/session/pending-twofactor';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const pending = parseTwoFactorPendingAuth(
      request.cookies.get(TWO_FACTOR_PENDING_COOKIE_NAME)?.value
    );
    if (!pending) {
      return NextResponse.json(
        { ok: false, message: 'Your sign-in session expired. Sign in again.' },
        { status: 401 }
      );
    }

    const result = await enrollTotp(pending);
    if (!result.ok) {
      return NextResponse.json({ ok: false, message: result.message }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      secret: result.result.secret,
      otpauthUri: result.result.otpauthUri
    });
  } catch (error) {
    const message =
      error instanceof Error && error.message.trim()
        ? error.message
        : 'Could not start authenticator enrollment.';
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
