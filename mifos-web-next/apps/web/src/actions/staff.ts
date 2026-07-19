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
  validateCreateStaff,
  validateUpdateStaff,
  type CreateStaffInput,
  type UpdateStaffInput,
  actionSuccessFromFineractCommand
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import { createStaff, updateStaff } from '@/lib/fineract/staff';
import { getServerSession } from '@/lib/session/server';

export type StaffActionResult =
  | { ok: true; staffId?: number }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

const LIST_PATH = '/organization/employees';

function staffPath(staffId: string | number) {
  return `${LIST_PATH}/${staffId}`;
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

function revalidateStaffViews(staffId: string | number) {
  revalidatePath(LIST_PATH);
  revalidatePath(staffPath(staffId));
  revalidatePath(`${staffPath(staffId)}/edit`);
}

export async function createStaffAction(input: CreateStaffInput): Promise<StaffActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'CREATE_STAFF');
  } catch {
    return { ok: false, message: 'You do not have permission to create employees.' };
  }

  const parsed = validateCreateStaff(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await createStaff(parsed.data);
    revalidatePath(LIST_PATH);
    return actionSuccessFromFineractCommand(response, { staffId: response.resourceId });
  } catch (error) {
    return toFineractActionError(error, 'Failed to create employee.');
  }
}

export async function updateStaffAction(
  staffId: string | number,
  input: UpdateStaffInput
): Promise<StaffActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'UPDATE_STAFF');
  } catch {
    return { ok: false, message: 'You do not have permission to update employees.' };
  }

  const parsed = validateUpdateStaff(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await updateStaff(staffId, parsed.data);
    revalidateStaffViews(staffId);
    return actionSuccessFromFineractCommand(response, { staffId: response.resourceId ?? Number(staffId) });
  } catch (error) {
    return toFineractActionError(error, 'Failed to update employee.');
  }
}
