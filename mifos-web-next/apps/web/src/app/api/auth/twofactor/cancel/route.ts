/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { NextResponse } from 'next/server';
import { twoFactorPendingCookieAttributes } from '@/lib/session/pending-twofactor';

export const dynamic = 'force-dynamic';

/** Clear the short-lived pending 2FA cookie and return to the password step. */
export async function POST() {
  const response = NextResponse.json({ ok: true });
  const attrs = twoFactorPendingCookieAttributes(0);
  response.cookies.set(attrs.name, '', {
    ...attrs,
    maxAge: 0,
    expires: new Date(0)
  });
  return response;
}
