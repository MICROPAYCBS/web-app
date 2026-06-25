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
  validateCreateContactType,
  validateUpdateContactType,
  type ContactTypeUpdateClearFields,
  type UpdateContactTypeInput,
  type UpsertContactTypeInput
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import {
  CONTACT_TYPE_LIST_PATH,
  contactTypeEditPath
} from '@/lib/fineract/contact-type-paths';
import {
  createContactType,
  deleteContactType,
  updateContactType
} from '@/lib/fineract/contact-types';
import { getServerSession } from '@/lib/session/server';

export type ContactTypeActionResult =
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

function revalidateContactTypeViews(contactTypeId?: number) {
  revalidatePath(CONTACT_TYPE_LIST_PATH);
  revalidatePath('/clients');
  if (contactTypeId != null) {
    revalidatePath(contactTypeEditPath(contactTypeId));
  }
}

export async function createContactTypeAction(
  input: UpsertContactTypeInput
): Promise<ContactTypeActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'CREATE_CONTACTTYPE');
  } catch {
    return { ok: false, message: 'You do not have permission to create contact types.' };
  }

  const parsed = validateCreateContactType(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await createContactType(parsed.data);
    revalidateContactTypeViews(response.resourceId);
    return { ok: true, resourceId: response.resourceId };
  } catch (error) {
    return toFineractActionError(error, 'Failed to create contact type.');
  }
}

export async function updateContactTypeAction(
  contactTypeId: number,
  input: UpdateContactTypeInput,
  clear: ContactTypeUpdateClearFields
): Promise<ContactTypeActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'UPDATE_CONTACTTYPE');
  } catch {
    return { ok: false, message: 'You do not have permission to update contact types.' };
  }

  const parsed = validateUpdateContactType(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await updateContactType(contactTypeId, parsed.data, clear);
    revalidateContactTypeViews(response.resourceId);
    return { ok: true, resourceId: response.resourceId };
  } catch (error) {
    return toFineractActionError(error, 'Failed to update contact type.');
  }
}

export async function deleteContactTypeAction(
  contactTypeId: number
): Promise<ContactTypeActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'DELETE_CONTACTTYPE');
  } catch {
    return { ok: false, message: 'You do not have permission to delete contact types.' };
  }

  try {
    await deleteContactType(contactTypeId);
    revalidateContactTypeViews();
    return { ok: true };
  } catch (error) {
    return toFineractActionError(error, 'Failed to delete contact type.');
  }
}
