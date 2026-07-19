import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractPeriodicAccrualsMutationResponse } from '@mifos/api-client';
import {
  buildExecutePeriodicAccrualsPayload,
  type ExecutePeriodicAccrualsInput
} from '@mifos/validation';
import { createFineractClient } from '@/lib/fineract/create-client';

const RUN_ACCRUALS_PATH = '/runaccruals';

export async function executePeriodicAccruals(
  input: ExecutePeriodicAccrualsInput
): Promise<FineractPeriodicAccrualsMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.post<FineractPeriodicAccrualsMutationResponse>(
    RUN_ACCRUALS_PATH,
    buildExecutePeriodicAccrualsPayload(input)
  );
}
