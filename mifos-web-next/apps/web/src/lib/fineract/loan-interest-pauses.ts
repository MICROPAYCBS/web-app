/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import 'server-only';

import type { FineractCommandProcessingResult } from '@mifos/api-client';
import type { LoanInterestPauseInput } from '@mifos/validation';
import type { LoanInterestPauseRecord } from '@/lib/fineract/loan-account-types';
import { createFineractClient } from '@/lib/fineract/create-client';
import { buildFineractCommandBody } from '@/lib/fineract/client-command-body';

export type { LoanInterestPauseRecord };

function normalizeDate(raw: unknown): number[] | string | undefined {
  if (typeof raw === 'string' && raw.trim()) {
    return raw;
  }
  if (Array.isArray(raw) && raw.length >= 3) {
    return raw as number[];
  }
  return undefined;
}

function normalizePause(raw: unknown): LoanInterestPauseRecord | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  if (!Number.isFinite(id)) {
    return null;
  }
  return {
    id,
    startDate: normalizeDate(row.startDate),
    endDate: normalizeDate(row.endDate)
  };
}

export async function getLoanInterestPauses(
  accountId: string | number
): Promise<LoanInterestPauseRecord[]> {
  const fineract = await createFineractClient();
  const data = await fineract.get<unknown>(`/loans/${accountId}/interest-pauses`);
  if (!Array.isArray(data)) {
    return [];
  }
  return data
    .map((item) => normalizePause(item))
    .filter((item): item is LoanInterestPauseRecord => item != null);
}

export async function createLoanInterestPause(
  accountId: string | number,
  input: LoanInterestPauseInput
): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.post<FineractCommandProcessingResult>(
    `/loans/${accountId}/interest-pauses`,
    buildFineractCommandBody({
      startDate: input.startDate,
      endDate: input.endDate
    })
  );
}

export async function updateLoanInterestPause(
  accountId: string | number,
  variationId: number,
  input: LoanInterestPauseInput
): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.put<FineractCommandProcessingResult>(
    `/loans/${accountId}/interest-pauses/${variationId}`,
    buildFineractCommandBody({
      startDate: input.startDate,
      endDate: input.endDate
    })
  );
}

export async function deleteLoanInterestPause(
  accountId: string | number,
  variationId: number
): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.delete<FineractCommandProcessingResult>(
    `/loans/${accountId}/interest-pauses/${variationId}`
  );
}
