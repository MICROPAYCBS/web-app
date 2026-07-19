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
import { enrichNotifications } from '@/lib/notifications/notification-display';
import { listNotifications } from '@/lib/fineract/notifications';

/** BFF: recent notifications for the signed-in user (header popover). */
export async function GET(request: Request) {
  const { error } = await requireServerSession();
  if (error) {
    return error;
  }

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get('limit') ?? '8');
  const unreadOnly = url.searchParams.get('unreadOnly') !== 'false';
  const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 50) : 8;

  try {
    const page = await listNotifications({
      unreadOnly,
      limit: safeLimit,
      offset: 0
    });
    const items = await enrichNotifications(page.pageItems);
    return jsonOk({
      totalFilteredRecords: page.totalFilteredRecords,
      items
    });
  } catch (err) {
    return jsonError(err);
  }
}
