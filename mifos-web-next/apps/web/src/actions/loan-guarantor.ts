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
  loanGuarantorItemSchema,
  toFineractActionError,
  actionSuccessFromFineractCommand
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import { clientAccountGeneralPath } from '@/lib/fineract/client-account-links';
import type { LoanAccountActionResult } from '@/lib/fineract/loan-account-action-result';
import {
  createLoanGuarantor,
  deleteLoanGuarantor,
  getLoanGuarantorTemplate,
  updateLoanGuarantor
} from '@/lib/fineract/loan-guarantors';
import { getServerSession } from '@/lib/session/server';

function parseGuarantor(raw: unknown): LoanAccountActionResult | ReturnType<
  typeof loanGuarantorItemSchema.parse
> {
  const parsed = loanGuarantorItemSchema.safeParse(raw);
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

async function requireKey(
  key: 'loans.guarantors.create' | 'loans.guarantors.update' | 'loans.guarantors.delete',
  message: string
): Promise<LoanAccountActionResult | null> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, resolvePermission(key));
  } catch {
    return { ok: false, message };
  }
  return null;
}

export async function loadLoanGuarantorTemplateAction(accountId: number) {
  const session = await getServerSession();
  if (!session) {
    return { ok: false as const, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, resolvePermission('loans.guarantors'));
    const template = await getLoanGuarantorTemplate(accountId);
    return { ok: true as const, ...template };
  } catch (err) {
    return toFineractActionError(err, 'Could not load guarantor types.');
  }
}

export async function createLoanGuarantorAction(
  clientId: string,
  accountId: number,
  raw: unknown
): Promise<LoanAccountActionResult> {
  const denied = await requireKey(
    'loans.guarantors.create',
    'You do not have permission to add guarantors.'
  );
  if (denied) {
    return denied;
  }
  const parsed = parseGuarantor(raw);
  if ('ok' in parsed) {
    return parsed;
  }
  try {
    const response = await createLoanGuarantor(accountId, parsed);
    revalidatePath(clientAccountGeneralPath(clientId, 'loan', accountId));
    return actionSuccessFromFineractCommand(response, {});
  } catch (err) {
    return toFineractActionError(err, 'Request failed.');
  }
}

export async function updateLoanGuarantorAction(
  clientId: string,
  accountId: number,
  guarantorId: number,
  raw: unknown
): Promise<LoanAccountActionResult> {
  const denied = await requireKey(
    'loans.guarantors.update',
    'You do not have permission to update guarantors.'
  );
  if (denied) {
    return denied;
  }
  const parsed = parseGuarantor(raw);
  if ('ok' in parsed) {
    return parsed;
  }
  try {
    const response = await updateLoanGuarantor(accountId, guarantorId, parsed);
    revalidatePath(clientAccountGeneralPath(clientId, 'loan', accountId));
    return actionSuccessFromFineractCommand(response, {});
  } catch (err) {
    return toFineractActionError(err, 'Request failed.');
  }
}

export async function deleteLoanGuarantorAction(
  clientId: string,
  accountId: number,
  guarantorId: number
): Promise<LoanAccountActionResult> {
  const denied = await requireKey(
    'loans.guarantors.delete',
    'You do not have permission to remove guarantors.'
  );
  if (denied) {
    return denied;
  }
  try {
    const response = await deleteLoanGuarantor(accountId, guarantorId);
    revalidatePath(clientAccountGeneralPath(clientId, 'loan', accountId));
    return actionSuccessFromFineractCommand(response, {});
  } catch (err) {
    return toFineractActionError(err, 'Request failed.');
  }
}
