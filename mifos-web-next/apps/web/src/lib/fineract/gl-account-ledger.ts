import 'server-only';

/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractGlAccountLedgerResponse } from '@mifos/api-client';
import { createFineractClient } from '@/lib/fineract/create-client';
import {
  buildGlAccountLedgerQueryParams,
  type GlAccountLedgerFilterInput
} from '@/lib/fineract/gl-account-ledger-query';
import { normalizeGlAccountLedgerResponse } from '@/lib/fineract/gl-account-ledger-normalize';

export type { GlAccountLedgerFilterInput } from '@/lib/fineract/gl-account-ledger-query';
export { buildGlAccountLedgerQueryParams } from '@/lib/fineract/gl-account-ledger-query';
export { normalizeGlAccountLedgerResponse } from '@/lib/fineract/gl-account-ledger-normalize';

/** Period ledger for one GL account via `GET /glaccounts/{id}/ledger`. */
export async function retrieveGlAccountLedger(
  glAccountId: number,
  filters: GlAccountLedgerFilterInput
): Promise<FineractGlAccountLedgerResponse | null> {
  const params = buildGlAccountLedgerQueryParams(filters);
  if (!params || !Number.isFinite(glAccountId) || glAccountId <= 0) {
    return null;
  }
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`/glaccounts/${glAccountId}/ledger`, params);
  return normalizeGlAccountLedgerResponse(raw, glAccountId);
}
