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
  validateCreateGlClosure,
  validateUpdateGlClosure,
  type CreateGlClosureInput,
  type UpdateGlClosureInput
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import {
  createGlClosure,
  deleteGlClosure,
  updateGlClosure
} from '@/lib/fineract/gl-closures';
import { getServerSession } from '@/lib/session/server';

const LIST_PATH = '/accounting/closing-entries';

export type GlClosuresActionResult =
  | { ok: true; resourceId?: number }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

function closurePath(closureId: number | string) {
  return `${LIST_PATH}/${closureId}`;
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

function revalidateClosureViews(closureId?: number) {
  revalidatePath(LIST_PATH);
  if (closureId != null) {
    revalidatePath(closurePath(closureId));
  }
}

export async function createGlClosureAction(
  input: CreateGlClosureInput
): Promise<GlClosuresActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'CREATE_GLCLOSURE');
  } catch {
    return { ok: false, message: 'You do not have permission to create accounting closures.' };
  }

  const parsed = validateCreateGlClosure(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await createGlClosure(parsed.data);
    revalidateClosureViews(response.resourceId);
    return { ok: true, resourceId: response.resourceId };
  } catch (error) {
    return toFineractActionError(error, 'Failed to create accounting closure.');
  }
}

export async function updateGlClosureAction(
  closureId: number,
  input: UpdateGlClosureInput
): Promise<GlClosuresActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'UPDATE_GLCLOSURE');
  } catch {
    return { ok: false, message: 'You do not have permission to update accounting closures.' };
  }

  if (!Number.isFinite(closureId)) {
    return { ok: false, message: 'Invalid closure id.' };
  }

  const parsed = validateUpdateGlClosure(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    await updateGlClosure(closureId, parsed.data);
    revalidateClosureViews(closureId);
    return { ok: true, resourceId: closureId };
  } catch (error) {
    return toFineractActionError(error, 'Failed to update accounting closure.');
  }
}

export async function deleteGlClosureAction(closureId: number): Promise<GlClosuresActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'DELETE_GLCLOSURE');
  } catch {
    return { ok: false, message: 'You do not have permission to delete accounting closures.' };
  }

  if (!Number.isFinite(closureId)) {
    return { ok: false, message: 'Invalid closure id.' };
  }

  try {
    await deleteGlClosure(closureId);
    revalidateClosureViews();
    return { ok: true };
  } catch (error) {
    return toFineractActionError(error, 'Failed to delete accounting closure.');
  }
}
