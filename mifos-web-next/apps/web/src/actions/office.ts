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
  toFineractActionError,
  validateCreateOffice,
  validateUpdateOffice,
  type CreateOfficeInput,
  type UpdateOfficeInput,
  actionSuccessFromFineractCommand
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import { getStructuredAccountNumberFormatsEnabled } from '@/lib/fineract/account-number-format-policy';
import { createOffice, getOffice, updateOffice } from '@/lib/fineract/offices';
import { getServerSession } from '@/lib/session/server';

export type OfficeActionResult =
  | { ok: true; officeId?: number }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

const LIST_PATH = '/organization/offices';

function officePath(officeId: string | number) {
  return `${LIST_PATH}/${officeId}`;
}

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

function revalidateOfficeViews(officeId: string | number) {
  revalidatePath(LIST_PATH);
  revalidatePath(officePath(officeId));
}

function validateBranchCodeWhenStructured(
  branchProfile: CreateOfficeInput['branchProfile'] | UpdateOfficeInput['branchProfile'],
  structuredEnabled: boolean
): Record<string, string> | null {
  if (!structuredEnabled) {
    return null;
  }
  const officeCode = branchProfile?.officeCode?.trim();
  if (!officeCode) {
    return {
      'branchProfile.officeCode':
        'Branch code is required when structured account numbers are enabled.'
    };
  }
  return null;
}

function preserveEstablishedBranchCode<T extends { branchProfile?: CreateOfficeInput['branchProfile'] }>(
  payload: T,
  existingOfficeCode?: string
): T {
  const establishedCode = existingOfficeCode?.trim();
  if (!establishedCode || !payload.branchProfile) {
    return payload;
  }
  return {
    ...payload,
    branchProfile: {
      ...payload.branchProfile,
      officeCode: establishedCode
    }
  };
}

export async function createOfficeAction(input: CreateOfficeInput): Promise<OfficeActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'CREATE_OFFICE');
  } catch {
    return { ok: false, message: 'You do not have permission to create branches.' };
  }

  const parsed = validateCreateOffice(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  const structuredEnabled = await getStructuredAccountNumberFormatsEnabled();
  const branchCodeError = validateBranchCodeWhenStructured(parsed.data.branchProfile, structuredEnabled);
  if (branchCodeError) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: branchCodeError
    };
  }

  try {
    const response = await createOffice(parsed.data);
    revalidatePath(LIST_PATH);
    return actionSuccessFromFineractCommand(response, { officeId: response.resourceId ?? response.officeId });
  } catch (error) {
    return toFineractActionError(error, 'Failed to create branch.');
  }
}

export async function updateOfficeAction(
  officeId: string | number,
  input: UpdateOfficeInput
): Promise<OfficeActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'UPDATE_OFFICE');
  } catch {
    return { ok: false, message: 'You do not have permission to update branches.' };
  }

  const parsed = validateUpdateOffice(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  const structuredEnabled = await getStructuredAccountNumberFormatsEnabled();
  const branchCodeError = validateBranchCodeWhenStructured(parsed.data.branchProfile, structuredEnabled);
  if (branchCodeError) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: branchCodeError
    };
  }

  try {
    const existingOffice = await getOffice(officeId);
    const updatePayload = preserveEstablishedBranchCode(
      parsed.data,
      existingOffice.branchProfile?.officeCode
    );
    const response = await updateOffice(officeId, updatePayload);
    revalidateOfficeViews(officeId);
    return actionSuccessFromFineractCommand(response, { officeId: response.resourceId ?? response.officeId ?? Number(officeId) });
  } catch (error) {
    return toFineractActionError(error, 'Failed to update branch.');
  }
}
