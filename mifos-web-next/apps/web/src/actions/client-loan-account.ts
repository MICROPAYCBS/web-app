'use server';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan, resolvePermission } from '@mifos/auth';
import { FineractHttpError } from '@mifos/api-client';
import type { LoanScheduleData } from '@mifos/api-client';
import {
  createLoanAccountSchema,
  mapFineractErrors,
  mapLoanApplicationFineractErrors,
  toFineractActionError,
  validateLoanApplicationProductRules,
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
  calculateClientLoanSchedule,
  createClientLoanAccountRecord,
  getClientLoanAccountTemplate
} from '@/lib/fineract/client-loan-accounts';
import { getServerSession } from '@/lib/session/server';

function mapActionFineractFieldErrors(
  err: unknown,
  schedulePreview = false
): Record<string, string> | undefined {
  if (!(err instanceof FineractHttpError)) {
    return undefined;
  }
  const mapped = mapFineractErrors(err.body);
  if (!mapped.fieldErrors.length) {
    return undefined;
  }
  return mapLoanApplicationFineractErrors(mapped.fieldErrors, { schedulePreview });
}

function parseCreateInput(
  raw: unknown,
  productContext?: Parameters<typeof validateLoanApplicationProductRules>[1],
  options?: Parameters<typeof validateLoanApplicationProductRules>[2]
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

  const productErrors = validateLoanApplicationProductRules(
    parsed.data,
    productContext,
    options
  );
  if (Object.keys(productErrors).length > 0) {
    return {
      ok: false,
      message: 'Please fix the highlighted fields.',
      fieldErrors: productErrors
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

export async function calculateClientLoanScheduleAction(
  clientId: string,
  raw: unknown,
  productContext?: Parameters<typeof validateLoanApplicationProductRules>[1]
): Promise<
  | { ok: true; schedule: LoanScheduleData }
  | Extract<ClientLoanAccountActionResult, { ok: false }>
> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }

  const parsed = parseCreateInput(raw, productContext, { schedulePreview: true });
  if (isClientLoanAccountActionError(parsed)) {
    return parsed;
  }

  try {
    assertCan(session, resolvePermission('loans.create'));
    const schedule = await calculateClientLoanSchedule(clientId, parsed, {
      linkedToFloatingInterestRates: productContext?.linkedToFloatingInterestRates
    });
    return { ok: true, schedule };
  } catch (err) {
    const mapped = toFineractActionError(err, 'Could not calculate repayment schedule.');
    return {
      ok: false,
      message: mapped.message,
      fieldErrors: mapActionFineractFieldErrors(err, true) ?? mapped.fieldErrors
    };
  }
}

export async function createClientLoanAccountAction(
  clientId: string,
  raw: unknown,
  productContext?: Parameters<typeof validateLoanApplicationProductRules>[1]
): Promise<ClientLoanAccountActionResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }

  const parsed = parseCreateInput(raw, productContext);
  if (isClientLoanAccountActionError(parsed)) {
    return parsed;
  }

  try {
    assertCan(session, resolvePermission('loans.create'));
    const response = await createClientLoanAccountRecord(clientId, parsed, {
      linkedToFloatingInterestRates: productContext?.linkedToFloatingInterestRates
    });
    const resourceId = response.resourceId ?? response.loanId;
    revalidatePath(clientAccountListPath(clientId, 'loan'));
    revalidatePath(`/clients/${clientId}/loans-accounts/create`);
    revalidatePath(`/clients/${clientId}`);
    return actionSuccessFromFineractCommand(response, { resourceId });
  } catch (err) {
    const mapped = toFineractActionError(err, 'Could not submit the loan application.');
    return {
      ok: false,
      message: mapped.message,
      fieldErrors: mapActionFineractFieldErrors(err) ?? mapped.fieldErrors
    };
  }
}
