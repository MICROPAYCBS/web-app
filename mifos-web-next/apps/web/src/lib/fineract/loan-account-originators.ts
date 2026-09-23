/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import 'server-only';

import type { FineractCommandProcessingResult, LoanOriginatorListItem } from '@mifos/api-client';
import { createFineractClient } from '@/lib/fineract/create-client';
import { normalizeLoanOriginatorListItem } from '@/lib/fineract/loan-originator-display';

export type { LoanOriginatorListItem };

function normalizeOriginators(raw: unknown): LoanOriginatorListItem[] {
  let rows: unknown[] = [];
  if (Array.isArray(raw)) {
    rows = raw;
  } else if (raw && typeof raw === 'object') {
    const wrapped = raw as Record<string, unknown>;
    if (Array.isArray(wrapped.originators)) {
      rows = wrapped.originators;
    }
  }
  return rows
    .map((item) => normalizeLoanOriginatorListItem(item))
    .filter((item): item is LoanOriginatorListItem => item !== null)
    .sort((left, right) => left.id - right.id);
}

export async function getLoanAccountOriginators(
  accountId: string | number
): Promise<LoanOriginatorListItem[]> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`/loans/${accountId}/originators`);
  return normalizeOriginators(raw);
}

export async function attachLoanOriginator(
  accountId: string | number,
  originatorId: number
): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.post<FineractCommandProcessingResult>(
    `/loans/${accountId}/originators/${originatorId}`,
    {}
  );
}

export async function detachLoanOriginator(
  accountId: string | number,
  originatorId: number
): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.delete<FineractCommandProcessingResult>(
    `/loans/${accountId}/originators/${originatorId}`
  );
}
