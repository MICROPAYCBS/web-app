import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { FINERACT_DATE_FORMAT, FINERACT_LOCALE } from '@/lib/fineract/dates';
import { buildFineractRequestInit, fineractUrl } from '@/lib/fineract/fineract-fetch';

export const SAVINGS_TRANSACTION_RECEIPT_REPORT = 'Savings Transaction Receipt';

export async function fetchSavingsTransactionReceiptPdf(
  transactionId: string | number
): Promise<Response> {
  const { urlBase, init } = await buildFineractRequestInit();
  const url = new URL(
    fineractUrl(urlBase, `runreports/${encodeURIComponent(SAVINGS_TRANSACTION_RECEIPT_REPORT)}`)
  );
  url.searchParams.set('R_transactionId', String(transactionId));
  url.searchParams.set('output-type', 'PDF');
  url.searchParams.set('locale', FINERACT_LOCALE);
  url.searchParams.set('dateFormat', FINERACT_DATE_FORMAT);
  url.searchParams.set('tenantIdentifier', 'default');
  return fetch(url, init);
}
