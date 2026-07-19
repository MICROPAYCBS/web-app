/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { NextResponse } from 'next/server';
import { jsonError, jsonOk } from '@/lib/bff/json-response';
import { requireServerSession } from '@/lib/bff/require-session';
import { getNotificationsUnreadCount } from '@/lib/fineract/notifications';

/** BFF: unread notification count for the signed-in user (header badge). */
export async function GET() {
  const { error } = await requireServerSession();
  if (error) {
    return error;
  }

  try {
    const count = await getNotificationsUnreadCount();
    return jsonOk({ count });
  } catch (err) {
    return jsonError(err);
  }
}
