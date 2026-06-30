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
  createLoanAccountSchema,
  toFineractActionError,
  type CreateLoanAccountInput,
  actionSuccessFromFineractCommand
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import {
  type ClientLoanAccountActionResult,
  isClientLoanAccountActionError
} from '@/lib/fineract/client-account-action-result';
import { clientAccountListPath } from '@/lib/fineract/client-account-links';
import {
  createClientLoanAccountRecord,
  getClientLoanAccountTemplate
} from '@/lib/fineract/client-loan-accounts';
import { getServerSession } from '@/lib/session/server';

function parseCreateInput(
  raw: unknown
): Extract<ClientLoanAccountActionResult, { ok: false }> | CreateLoanAccountInput {
  const parsed = createLoanAccountSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.') || issue.path[0];
      if (typeof key === 'string') {
        fieldErrors[key] = issue.message;
      }
    }
    return {
      ok: false,
      message: 'Please fix the highlighted fields.',
      fieldErrors
    };
  }
  return parsed.data;
}

export async function fetchClientLoanAccountTemplateAction(
  clientId: string,
  productId?: string
) {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' } satisfies ClientLoanAccountActionResult;
  }
  try {
    assertCan(session, resolvePermission('loans.create'));
    return await getClientLoanAccountTemplate(clientId, productId);
  } catch (err) {
    return toFineractActionError(err, 'Could not load loan application template.');
  }
}

export async function createClientLoanAccountAction(
  clientId: string,
  raw: unknown
): Promise<ClientLoanAccountActionResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }

  const parsed = parseCreateInput(raw);
  if (isClientLoanAccountActionError(parsed)) {
    return parsed;
  }

  try {
    assertCan(session, resolvePermission('loans.create'));
    const response = await createClientLoanAccountRecord(clientId, parsed);
    const resourceId = response.resourceId ?? response.loanId;
    revalidatePath(clientAccountListPath(clientId, 'loan'));
    revalidatePath(`/clients/${clientId}/loans-accounts/create`);
    revalidatePath(`/clients/${clientId}`);
    return actionSuccessFromFineractCommand(response, { resourceId });
  } catch (err) {
    return toFineractActionError(err, 'Could not submit the loan application.');
  }
}
