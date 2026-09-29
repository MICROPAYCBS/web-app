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
  loanCollateralItemSchema,
  toFineractActionError,
  actionSuccessFromFineractCommand
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import { clientAccountGeneralPath } from '@/lib/fineract/client-account-links';
import type { LoanAccountActionResult } from '@/lib/fineract/loan-account-action-result';
import {
  listLoanPledgeOptions,
  pledgeClientCollateralOnLoan
} from '@/lib/fineract/loan-collaterals';
import { getServerSession } from '@/lib/session/server';

export async function loadLoanCollateralTemplateAction(clientId: string) {
  const session = await getServerSession();
  if (!session) {
    return { ok: false as const, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, resolvePermission('clients.collateral'));
    const options = await listLoanPledgeOptions(clientId);
    return { ok: true as const, options };
  } catch (err) {
    return toFineractActionError(err, 'Could not load this customer’s collateral.');
  }
}

export async function createLoanCollateralAction(
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
    return { ok: false, message: 'You do not have permission to update this loan.' };
  }

  const parsed = loanCollateralItemSchema.safeParse(raw);
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
    const response = await pledgeClientCollateralOnLoan(clientId, accountId, parsed.data);
    revalidatePath(clientAccountGeneralPath(clientId, 'loan', accountId));
    return actionSuccessFromFineractCommand(response, {});
  } catch (err) {
    return toFineractActionError(err, 'Request failed.');
  }
}
