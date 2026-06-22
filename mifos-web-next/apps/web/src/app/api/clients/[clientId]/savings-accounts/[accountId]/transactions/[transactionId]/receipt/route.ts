/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan } from '@mifos/auth';
import { jsonError } from '@/lib/bff/json-response';
import { requireRoutePermission } from '@/lib/bff/require-session';
import { fetchSavingsTransactionReceiptPdf } from '@/lib/fineract/savings-transaction-receipt';

export async function GET(
  _request: Request,
  context: {
    params: Promise<{ clientId: string; accountId: string; transactionId: string }>;
  }
) {
  const { session, error } = await requireRoutePermission('/clients');
  if (error) {
    return error;
  }

  try {
    assertCan(session, 'READ_SAVINGSACCOUNT');
    const { transactionId } = await context.params;
    const res = await fetchSavingsTransactionReceiptPdf(transactionId);
    if (!res.ok) {
      return jsonError(new Error('Receipt could not be generated.'));
    }

    const buffer = await res.arrayBuffer();
    if (!buffer.byteLength) {
      return jsonError(new Error('Receipt is empty.'));
    }

    const contentType = res.headers.get('content-type') ?? 'application/pdf';
    return new Response(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="transaction-${transactionId}-receipt.pdf"`
      }
    });
  } catch (err) {
    return jsonError(err);
  }
}
