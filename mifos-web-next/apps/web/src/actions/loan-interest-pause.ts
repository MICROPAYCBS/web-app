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
  loanInterestPauseSchema,
  toFineractActionError,
  actionSuccessFromFineractCommand
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import { clientAccountGeneralPath } from '@/lib/fineract/client-account-links';
import type { LoanAccountActionResult } from '@/lib/fineract/loan-account-action-result';
import {
  createLoanInterestPause,
  deleteLoanInterestPause,
  updateLoanInterestPause
} from '@/lib/fineract/loan-interest-pauses';
import { getServerSession } from '@/lib/session/server';

async function requireCreate(): Promise<LoanAccountActionResult | null> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, resolvePermission('loans.interest-pause.create'));
  } catch {
    return { ok: false, message: 'You do not have permission to manage interest pauses.' };
  }
  return null;
}

function parsePause(raw: unknown): LoanAccountActionResult | { startDate: string; endDate: string } {
  const parsed = loanInterestPauseSchema.safeParse(raw);
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
  return parsed.data;
}

export async function createLoanInterestPauseAction(
  clientId: string,
  accountId: number,
  raw: unknown
): Promise<LoanAccountActionResult> {
  const denied = await requireCreate();
  if (denied) {
    return denied;
  }
  const parsed = parsePause(raw);
  if ('ok' in parsed) {
    return parsed;
  }
  try {
    const response = await createLoanInterestPause(accountId, parsed);
    revalidatePath(clientAccountGeneralPath(clientId, 'loan', accountId));
    return actionSuccessFromFineractCommand(response, {});
  } catch (err) {
    return toFineractActionError(err, 'Request failed.');
  }
}

export async function updateLoanInterestPauseAction(
  clientId: string,
  accountId: number,
  variationId: number,
  raw: unknown
): Promise<LoanAccountActionResult> {
  const denied = await requireCreate();
  if (denied) {
    return denied;
  }
  const parsed = parsePause(raw);
  if ('ok' in parsed) {
    return parsed;
  }
  try {
    const response = await updateLoanInterestPause(accountId, variationId, parsed);
    revalidatePath(clientAccountGeneralPath(clientId, 'loan', accountId));
    return actionSuccessFromFineractCommand(response, {});
  } catch (err) {
    return toFineractActionError(err, 'Request failed.');
  }
}

export async function deleteLoanInterestPauseAction(
  clientId: string,
  accountId: number,
  variationId: number
): Promise<LoanAccountActionResult> {
  const denied = await requireCreate();
  if (denied) {
    return denied;
  }
  try {
    const response = await deleteLoanInterestPause(accountId, variationId);
    revalidatePath(clientAccountGeneralPath(clientId, 'loan', accountId));
    return actionSuccessFromFineractCommand(response, {});
  } catch (err) {
    return toFineractActionError(err, 'Request failed.');
  }
}
