/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan, resolvePermission } from '@mifos/auth';
import { validateGenerateCollectionSheet } from '@mifos/validation';
import { jsonError, jsonOk } from '@/lib/bff/json-response';
import { requireRoutePermission } from '@/lib/bff/require-session';
import { postGenerateCollectionSheet } from '@/lib/fineract/collection-sheet';

export async function POST(request: Request) {
  const { session, error } = await requireRoutePermission('/collections/collection-sheet');
  if (error) {
    return error;
  }

  try {
    assertCan(session, resolvePermission('collections'));
    const body = await request.json();
    const parsed = validateGenerateCollectionSheet(body);
    if (!parsed.success) {
      return jsonError(new Error('Validation failed'));
    }

    const data = await postGenerateCollectionSheet({
      officeId: parsed.data.officeId,
      staffId: parsed.data.staffId,
      transactionDate: parsed.data.transactionDate
    });

    return jsonOk(data);
  } catch (err) {
    return jsonError(err);
  }
}
