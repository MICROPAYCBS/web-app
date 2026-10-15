'use server';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan, resolvePermission } from '@mifos/auth';
import { translateFineractCode } from '@mifos/i18n';
import { loanAccountMarkAsNpaCommandSchema, toFineractActionError } from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import { clientAccountGeneralPath } from '@/lib/fineract/client-account-links';
import type { LoanAccountActionResult } from '@/lib/fineract/loan-account-action-result';
import {
  executeLoanAccountNpaCommand,
  listLoanNpaReasons
} from '@/lib/fineract/loan-account-commands';
import { getLoanAccount } from '@/lib/fineract/loan-accounts';
import { loanNpaCommandSuccess, type LoanNpaReasonOption } from '@/lib/fineract/loan-npa';
import { getServerSession } from '@/lib/session/server';

const ACTIVE_LOAN_STATUS_ID = 300;

function fieldErrorsFromZod(
  issues: { path: (string | number)[]; message: string }[]
): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (typeof key === 'string' && !fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }
  return fieldErrors;
}

async function requireLoanCommand(
  permission: 'loans.markAsNpa' | 'loans.undoMarkAsNpa',
  deniedMessage: string
): Promise<{ ok: false; message: string } | null> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, resolvePermission(permission));
  } catch {
    return { ok: false, message: deniedMessage };
  }
  return null;
}

function revalidateLoan(clientId: string, accountId: string) {
  revalidatePath(clientAccountGeneralPath(clientId, 'loan', accountId));
  revalidatePath(`/clients/${clientId}/loans`);
}

export async function loadLoanNpaReasonsAction(): Promise<
  { ok: true; reasons: LoanNpaReasonOption[] } | { ok: false; message: string }
> {
  const denied = await requireLoanCommand(
    'loans.markAsNpa',
    'You do not have permission to mark this loan as non-performing.'
  );
  if (denied) {
    return denied;
  }

  const session = await getServerSession();
  try {
    assertCan(session, 'READ_CODEVALUE');
  } catch {
    return { ok: false, message: 'You do not have permission to load NPA reasons.' };
  }

  try {
    const reasons = await listLoanNpaReasons();
    return { ok: true, reasons };
  } catch (error) {
    return toFineractActionError(error, 'Could not load NPA reasons.');
  }
}

export async function markLoanAsNpaAction(
  clientId: string,
  accountId: string,
  raw: unknown
): Promise<LoanAccountActionResult> {
  const denied = await requireLoanCommand(
    'loans.markAsNpa',
    'You do not have permission to mark this loan as non-performing.'
  );
  if (denied) {
    return denied;
  }

  const parsed = loanAccountMarkAsNpaCommandSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: fieldErrorsFromZod(parsed.error.issues)
    };
  }

  try {
    const account = await getLoanAccount(accountId);
    if (!account) {
      return { ok: false, message: 'This loan could not be found.' };
    }
    if (account.status.id !== ACTIVE_LOAN_STATUS_ID) {
      return { ok: false, message: translateFineractCode('error.msg.loan.is.not.active') };
    }
    if (account.deliberateNpa === true) {
      return {
        ok: false,
        message: translateFineractCode('error.msg.loan.npa.already.deliberate')
      };
    }

    const body: Record<string, unknown> = { npaReasonId: parsed.data.npaReasonId };
    if (parsed.data.note) {
      body.note = parsed.data.note;
    }
    const response = await executeLoanAccountNpaCommand(accountId, 'markAsNpa', body);
    const result = loanNpaCommandSuccess(response);
    if (!result.pendingChecker) {
      revalidateLoan(clientId, accountId);
    }
    return result;
  } catch (error) {
    return toFineractActionError(error, 'Could not mark this loan as non-performing.');
  }
}

export async function undoMarkLoanAsNpaAction(
  clientId: string,
  accountId: string
): Promise<LoanAccountActionResult> {
  const denied = await requireLoanCommand(
    'loans.undoMarkAsNpa',
    'You do not have permission to undo the deliberate classification.'
  );
  if (denied) {
    return denied;
  }

  try {
    const account = await getLoanAccount(accountId);
    if (!account) {
      return { ok: false, message: 'This loan could not be found.' };
    }
    if (account.status.id !== ACTIVE_LOAN_STATUS_ID) {
      return { ok: false, message: translateFineractCode('error.msg.loan.is.not.active') };
    }
    if (account.deliberateNpa !== true) {
      return { ok: false, message: translateFineractCode('error.msg.loan.npa.not.deliberate') };
    }

    const response = await executeLoanAccountNpaCommand(accountId, 'undoMarkAsNpa', {});
    const result = loanNpaCommandSuccess(response);
    if (!result.pendingChecker) {
      revalidateLoan(clientId, accountId);
    }
    return result;
  } catch (error) {
    return toFineractActionError(error, 'Could not undo the deliberate classification.');
  }
}
