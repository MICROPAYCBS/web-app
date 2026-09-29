'use server';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan, resolvePermission } from '@mifos/auth';
import {
  loanTrancheEditSchema,
  toFineractActionError,
  actionSuccessFromFineractCommand
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import { clientAccountGeneralPath } from '@/lib/fineract/client-account-links';
import type { LoanAccountActionResult } from '@/lib/fineract/loan-account-action-result';
import { editLoanDisbursements } from '@/lib/fineract/loan-tranches';
import { amountCoversPayoff, earliestDisbursementTranche } from '@/lib/fineract/loan-topup';
import { loadLoanTopupContext } from '@/lib/fineract/loan-topup-load';
import { createFineractClient } from '@/lib/fineract/create-client';
import { getServerSession } from '@/lib/session/server';

async function topupTrancheBlocker(
  accountId: number,
  tranches: { expectedDisbursementDate: string; principal: number }[]
): Promise<LoanAccountActionResult | null> {
  const earliest = earliestDisbursementTranche(tranches);
  if (!earliest) {
    return null;
  }
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`/loans/${accountId}`);
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const closureLoanId = Number(row.closureLoanId);
  if (row.isTopup !== true || !Number.isFinite(closureLoanId) || closureLoanId <= 0) {
    return null;
  }
  const context = await loadLoanTopupContext(closureLoanId, earliest.expectedDisbursementDate);
  if (!context.ok) {
    return { ok: false, message: context.message };
  }
  if (!context.context.active) {
    return { ok: false, message: 'That loan is no longer active' };
  }
  if (
    context.context.payoff &&
    !amountCoversPayoff(earliest.principal, context.context.payoff.amount)
  ) {
    return { ok: false, message: 'Principal must cover the payoff' };
  }
  return null;
}

export async function editLoanTranchesAction(
  clientId: string,
  accountId: number,
  raw: unknown
): Promise<LoanAccountActionResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, resolvePermission('loans.update'));
  } catch {
    return { ok: false, message: 'You do not have permission to edit tranches.' };
  }

  const parsed = loanTrancheEditSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === 'string') {
        fieldErrors[key] = issue.message;
      }
    }
    return { ok: false, message: 'Please fix the highlighted fields.', fieldErrors };
  }

  try {
    const topupBlock = await topupTrancheBlocker(accountId, parsed.data.disbursementData);
    if (topupBlock) {
      return topupBlock;
    }
    const response = await editLoanDisbursements(accountId, parsed.data);
    revalidatePath(clientAccountGeneralPath(clientId, 'loan', accountId));
    return actionSuccessFromFineractCommand(response, {});
  } catch (err) {
    return toFineractActionError(err, 'Request failed.');
  }
}
