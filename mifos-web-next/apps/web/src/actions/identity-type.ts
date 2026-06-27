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
  validateCreateIdentityType,
  validateUpdateIdentityType,
  type IdentityTypeUpdateClearFields,
  type UpdateIdentityTypeInput,
  type UpsertIdentityTypeInput
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import {
  IDENTITY_TYPE_LIST_PATH,
  identityTypeEditPath
} from '@/lib/fineract/identity-type-paths';
import {
  createIdentityType,
  deleteIdentityType,
  updateIdentityType
} from '@/lib/fineract/identity-types';
import { getServerSession } from '@/lib/session/server';

export type IdentityTypeActionResult =
  | { ok: true; resourceId?: number }
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

function revalidateIdentityTypeViews(identityTypeId?: number) {
  revalidatePath(IDENTITY_TYPE_LIST_PATH);
  revalidatePath('/clients');
  if (identityTypeId != null) {
    revalidatePath(identityTypeEditPath(identityTypeId));
  }
}

export async function createIdentityTypeAction(
  input: UpsertIdentityTypeInput
): Promise<IdentityTypeActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'CREATE_IDENTITYTYPE');
  } catch {
    return { ok: false, message: 'You do not have permission to create ID types.' };
  }

  const parsed = validateCreateIdentityType(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await createIdentityType(parsed.data);
    revalidateIdentityTypeViews(response.resourceId);
    return { ok: true, resourceId: response.resourceId };
  } catch (error) {
    return toFineractActionError(error, 'Failed to create ID type.');
  }
}

export async function updateIdentityTypeAction(
  identityTypeId: number,
  input: UpdateIdentityTypeInput,
  clear: IdentityTypeUpdateClearFields
): Promise<IdentityTypeActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'UPDATE_IDENTITYTYPE');
  } catch {
    return { ok: false, message: 'You do not have permission to update ID types.' };
  }

  const parsed = validateUpdateIdentityType(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await updateIdentityType(identityTypeId, parsed.data, clear);
    revalidateIdentityTypeViews(response.resourceId);
    return { ok: true, resourceId: response.resourceId };
  } catch (error) {
    return toFineractActionError(error, 'Failed to update ID type.');
  }
}

export async function deleteIdentityTypeAction(
  identityTypeId: number
): Promise<IdentityTypeActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'DELETE_IDENTITYTYPE');
  } catch {
    return { ok: false, message: 'You do not have permission to delete ID types.' };
  }

  try {
    await deleteIdentityType(identityTypeId);
    revalidateIdentityTypeViews();
    return { ok: true };
  } catch (error) {
    return toFineractActionError(error, 'Failed to delete ID type.');
  }
}
