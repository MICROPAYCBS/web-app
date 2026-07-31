/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { listTwoFactorDeliveryMethods } from '@/lib/fineract/twofactor';
import {
  parseTwoFactorPendingAuth,
  TWO_FACTOR_PENDING_COOKIE_NAME
} from '@/lib/session/pending-twofactor';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const pending = parseTwoFactorPendingAuth(
    request.cookies.get(TWO_FACTOR_PENDING_COOKIE_NAME)?.value
  );
  if (!pending) {
    return NextResponse.json(
      {
        ok: false,
        message:
          'Verification session is missing. Sign in again to continue two-factor authentication.'
      },
      { status: 401 }
    );
  }

  const result = await listTwoFactorDeliveryMethods(pending);
  if (!result.ok) {
    return NextResponse.json({ ok: false, message: result.message }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    methods: result.methods,
    deliveryMethod: pending.deliveryMethod,
    totpEnabled: pending.totpEnabled,
    totpEnrollmentRequired: pending.totpEnrollmentRequired
  });
}
