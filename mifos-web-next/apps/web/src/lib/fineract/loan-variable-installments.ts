import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractCommandProcessingResult, LoanScheduleData } from '@mifos/api-client';
import { createFineractClient } from '@/lib/fineract/create-client';
import { normalizeLoanScheduleData } from '@/lib/fineract/loan-schedule-normalize';

export async function previewLoanVariableSchedule(
  loanId: string | number,
  body: Record<string, unknown>
): Promise<LoanScheduleData | null> {
  const fineract = await createFineractClient();
  const raw = await fineract.post<unknown>(
    `/loans/${loanId}/schedule`,
    body,
    { command: 'calculateLoanSchedule' }
  );
  return normalizeLoanScheduleData(raw);
}

export async function submitLoanVariableSchedule(
  loanId: string | number,
  body: Record<string, unknown>
): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.post<FineractCommandProcessingResult>(
    `/loans/${loanId}/schedule`,
    body,
    { command: 'addVariations' }
  );
}

export async function resetLoanVariableSchedule(
  loanId: string | number
): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.post<FineractCommandProcessingResult>(
    `/loans/${loanId}/schedule`,
    {},
    { command: 'deleteVariations' }
  );
}
