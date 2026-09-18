/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import 'server-only';

import type { FineractCommandProcessingResult } from '@mifos/api-client';
import type { LoanTrancheEditInput } from '@mifos/validation';
import { createFineractClient } from '@/lib/fineract/create-client';
import { buildFineractCommandBody } from '@/lib/fineract/client-command-body';

export async function editLoanDisbursements(
  accountId: string | number,
  input: LoanTrancheEditInput
): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.put<FineractCommandProcessingResult>(
    `/loans/${accountId}/disbursements/editDisbursements`,
    buildFineractCommandBody({
      disbursementData: input.disbursementData.map((row) => ({
        id: row.id,
        expectedDisbursementDate: row.expectedDisbursementDate,
        principal: row.principal
      }))
    })
  );
}
