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
import { createOffice, updateOffice } from '@/lib/fineract/offices';
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

  try {
    const response = await updateOffice(officeId, parsed.data);
    revalidateOfficeViews(officeId);
    return actionSuccessFromFineractCommand(response, { officeId: response.resourceId ?? response.officeId ?? Number(officeId) });
  } catch (error) {
    return toFineractActionError(error, 'Failed to update branch.');
  }
}
