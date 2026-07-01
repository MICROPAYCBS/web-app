/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan, ForbiddenError, resolvePermission } from '@mifos/auth';
import { NextResponse } from 'next/server';
import { jsonError, jsonOk } from '@/lib/bff/json-response';
import { requireServerSession } from '@/lib/bff/require-session';
import { getCheckerInboxPendingCount } from '@/lib/fineract/checker-inbox';

/**
 * BFF: pending maker-checker count for the signed-in checker (header badge).
 */
export async function GET() {
  const { session, error } = await requireServerSession();
  if (error) {
    return error;
  }

  try {
    assertCan(session, resolvePermission('checkerInbox'));
    const count = await getCheckerInboxPendingCount();
    return jsonOk({ count });
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    return jsonError(err);
  }
}
