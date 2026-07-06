import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractCommandProcessingResult } from '@mifos/api-client';
import type { FineractLoanAccountDetail } from '@/lib/fineract/loan-account-types';
import { normalizeLoanAccountDetail } from '@/lib/fineract/loan-account-normalize';
import { createFineractClient } from '@/lib/fineract/create-client';

export type {
  FineractLoanAccountCharge,
  FineractLoanAccountDetail,
  FineractLoanAccountSummary,
  FineractLoanAccountTimeline,
  FineractLoanAccountTransaction,
  LoanAccountSummaryMatrixRow
} from '@/lib/fineract/loan-account-types';

export async function getLoanAccount(
  accountId: string | number
): Promise<FineractLoanAccountDetail | null> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`/loans/${accountId}`, {
    associations: 'all',
    exclude: 'guarantors,futureSchedule'
  });
  return normalizeLoanAccountDetail(raw);
}

export async function getLoanOfficerAssignTemplate(
  accountId: string | number
): Promise<{ loanOfficerId?: number; loanOfficerOptions: { id: number; name: string }[] }> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`/loans/${accountId}`, {
    template: 'true',
    fields: 'id,loanOfficerId,loanOfficerOptions'
  });
  if (!raw || typeof raw !== 'object') {
    return { loanOfficerOptions: [] };
  }
  const row = raw as Record<string, unknown>;
  const loanOfficerId = Number.isFinite(Number(row.loanOfficerId))
    ? Number(row.loanOfficerId)
    : undefined;
  const options = Array.isArray(row.loanOfficerOptions)
    ? row.loanOfficerOptions
        .map((item) => {
          if (!item || typeof item !== 'object') {
            return null;
          }
          const option = item as Record<string, unknown>;
          const id = Number(option.id);
          if (!Number.isFinite(id)) {
            return null;
          }
          const name =
            typeof option.displayName === 'string'
              ? option.displayName
              : typeof option.firstname === 'string'
                ? option.firstname
                : `Loan officer ${id}`;
          return { id, name };
        })
        .filter((item): item is { id: number; name: string } => item != null)
    : [];
  return { loanOfficerId, loanOfficerOptions: options };
}

export async function executeLoanAccountCommand(
  accountId: string | number,
  command: 'assignLoanOfficer' | 'unassignLoanOfficer',
  body: Record<string, unknown>
): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.post<FineractCommandProcessingResult>(`/loans/${accountId}`, body, { command });
}
