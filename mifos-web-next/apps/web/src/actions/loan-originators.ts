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
  toFineractActionError,
  validateCreateLoanOriginator,
  validateUpdateLoanOriginator,
  type CreateLoanOriginatorInput,
  type UpdateLoanOriginatorInput
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import {
  LOAN_ORIGINATOR_LIST_PATH,
  loanOriginatorDetailPath,
  loanOriginatorEditPath
} from '@/lib/fineract/loan-originator-paths';
import {
  createLoanOriginator,
  deleteLoanOriginator,
  updateLoanOriginator
} from '@/lib/fineract/loan-originators';
import { getServerSession } from '@/lib/session/server';

export type LoanOriginatorActionResult =
  | { ok: true; loanOriginatorId?: number }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

function zodFieldErrors(error: { flatten: () => { fieldErrors: Record<string, string[]> } }) {
  const flattened = error.flatten().fieldErrors;
  const fieldErrors: Record<string, string> = {};
  for (const [key, messages] of Object.entries(flattened)) {
    if (messages?.[0]) {
      fieldErrors[key] = messages[0];
    }
  }
  return fieldErrors;
}

function revalidateLoanOriginatorViews(loanOriginatorId: string | number) {
  revalidatePath(LOAN_ORIGINATOR_LIST_PATH);
  revalidatePath(loanOriginatorDetailPath(loanOriginatorId));
  revalidatePath(loanOriginatorEditPath(loanOriginatorId));
}

export async function createLoanOriginatorAction(
  input: CreateLoanOriginatorInput
): Promise<LoanOriginatorActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, resolvePermission('organization.loanOriginators.create'));
  } catch {
    return { ok: false, message: 'You do not have permission to create loan originators.' };
  }

  const parsed = validateCreateLoanOriginator(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await createLoanOriginator(parsed.data);
    revalidatePath(LOAN_ORIGINATOR_LIST_PATH);
    return { ok: true, loanOriginatorId: response.resourceId };
  } catch (error) {
    return toFineractActionError(error, 'Failed to create loan originator.');
  }
}

export async function updateLoanOriginatorAction(
  loanOriginatorId: string | number,
  input: UpdateLoanOriginatorInput
): Promise<LoanOriginatorActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, resolvePermission('organization.loanOriginators.update'));
  } catch {
    return { ok: false, message: 'You do not have permission to update loan originators.' };
  }

  const parsed = validateUpdateLoanOriginator(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await updateLoanOriginator(loanOriginatorId, parsed.data);
    revalidateLoanOriginatorViews(loanOriginatorId);
    return { ok: true, loanOriginatorId: response.resourceId ?? Number(loanOriginatorId) };
  } catch (error) {
    return toFineractActionError(error, 'Failed to update loan originator.');
  }
}

export async function deleteLoanOriginatorAction(
  loanOriginatorId: string | number
): Promise<LoanOriginatorActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, resolvePermission('organization.loanOriginators.delete'));
  } catch {
    return { ok: false, message: 'You do not have permission to delete loan originators.' };
  }

  try {
    await deleteLoanOriginator(loanOriginatorId);
    revalidatePath(LOAN_ORIGINATOR_LIST_PATH);
    return { ok: true, loanOriginatorId: Number(loanOriginatorId) };
  } catch (error) {
    return toFineractActionError(error, 'Failed to delete loan originator.');
  }
}
