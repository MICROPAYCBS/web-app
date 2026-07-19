'use server';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan } from '@mifos/auth';
import {
  actionSuccessFromFineractCommand,
  buildFundPayload,
  toFineractActionError,
  validateCreateFund,
  validateUpdateFund,
  type CreateFundInput,
  type UpdateFundInput
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import {
  FUND_LIST_PATH,
  fundDetailPath,
  fundEditPath,
  fundLegacyEditPath
} from '@/lib/fineract/fund-paths';
import { createOrganizationFund, updateOrganizationFund } from '@/lib/fineract/funds';
import { getServerSession } from '@/lib/session/server';

export type FundActionResult =
  | { ok: true; fundId?: number }
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

function revalidateFundViews(fundId: string | number) {
  revalidatePath(FUND_LIST_PATH);
  revalidatePath(fundDetailPath(fundId));
  revalidatePath(fundEditPath(fundId));
  revalidatePath(fundLegacyEditPath(fundId));
}

export async function createFundAction(input: CreateFundInput): Promise<FundActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'CREATE_FUND');
  } catch {
    return { ok: false, message: 'You do not have permission to create funds.' };
  }

  const parsed = validateCreateFund(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await createOrganizationFund(buildFundPayload(parsed.data));
    revalidatePath(FUND_LIST_PATH);
    return actionSuccessFromFineractCommand(response, { fundId: response.resourceId });
  } catch (error) {
    return toFineractActionError(error, 'Failed to create fund.');
  }
}

export async function updateFundAction(
  fundId: string | number,
  input: UpdateFundInput
): Promise<FundActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'UPDATE_FUND');
  } catch {
    return { ok: false, message: 'You do not have permission to update funds.' };
  }

  const parsed = validateUpdateFund(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await updateOrganizationFund(fundId, buildFundPayload(parsed.data));
    revalidateFundViews(fundId);
    return actionSuccessFromFineractCommand(response, {
      fundId: response.resourceId ?? Number(fundId)
    });
  } catch (error) {
    return toFineractActionError(error, 'Failed to update fund.');
  }
}
