import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  WorkingDaysConfiguration,
  WorkingDaysMutationResponse
} from '@mifos/api-client';
import type { UpdateWorkingDaysPayload } from '@mifos/validation';
import { buildWorkingDaysPayload } from '@/lib/fineract/build-working-days-payload';
import { createFineractClient } from '@/lib/fineract/create-client';

const BASE_PATH = '/workingdays';

export async function getWorkingDaysConfiguration(): Promise<WorkingDaysConfiguration> {
  const fineract = await createFineractClient();
  return fineract.get<WorkingDaysConfiguration>(BASE_PATH);
}

export async function updateWorkingDaysConfiguration(
  input: UpdateWorkingDaysPayload
): Promise<WorkingDaysMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.put<WorkingDaysMutationResponse>(BASE_PATH, buildWorkingDaysPayload(input));
}
