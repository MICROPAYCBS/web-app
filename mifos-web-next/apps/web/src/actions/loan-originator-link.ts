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
  loanOriginatorAttachSchema,
  toFineractActionError,
  actionSuccessFromFineractCommand
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import { clientAccountGeneralPath } from '@/lib/fineract/client-account-links';
import type { LoanAccountActionResult } from '@/lib/fineract/loan-account-action-result';
import {
  attachLoanOriginator,
  detachLoanOriginator,
  getLoanAccountOriginators
} from '@/lib/fineract/loan-account-originators';
import { listLoanOriginators } from '@/lib/fineract/loan-originators';
import { getServerSession } from '@/lib/session/server';

export async function loadLoanOriginatorsForAttachAction(accountId: number) {
  const session = await getServerSession();
  if (!session) {
    return { ok: false as const, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, resolvePermission('loans.originators.attach'));
    const [originators, attached] = await Promise.all([
      listLoanOriginators(),
      getLoanAccountOriginators(accountId)
    ]);
    const attachedIds = new Set(attached.map((row) => row.id));
    return {
      ok: true as const,
      originators: originators.filter((row) => row.status === 'ACTIVE' && !attachedIds.has(row.id))
    };
  } catch (err) {
    return toFineractActionError(err, 'Could not load originators.');
  }
}

export async function attachLoanOriginatorAction(
  clientId: string,
  accountId: number,
  raw: unknown
): Promise<LoanAccountActionResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, resolvePermission('loans.originators.attach'));
  } catch {
    return { ok: false, message: 'You do not have permission to attach an originator.' };
  }

  const parsed = loanOriginatorAttachSchema.safeParse(raw);
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
    const response = await attachLoanOriginator(accountId, parsed.data.originatorId);
    revalidatePath(clientAccountGeneralPath(clientId, 'loan', accountId));
    return actionSuccessFromFineractCommand(response, {});
  } catch (err) {
    return toFineractActionError(err, 'Request failed.');
  }
}

export async function detachLoanOriginatorAction(
  clientId: string,
  accountId: number,
  originatorId: number
): Promise<LoanAccountActionResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, resolvePermission('loans.originators.detach'));
  } catch {
    return { ok: false, message: 'You do not have permission to remove an originator.' };
  }

  try {
    const response = await detachLoanOriginator(accountId, originatorId);
    revalidatePath(clientAccountGeneralPath(clientId, 'loan', accountId));
    return actionSuccessFromFineractCommand(response, {});
  } catch (err) {
    return toFineractActionError(err, 'Request failed.');
  }
}
