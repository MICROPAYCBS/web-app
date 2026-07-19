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
  validateUpsertHookForm,
  type UpsertHookFormInput,
  actionSuccessFromFineractCommand
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import { createHook, deleteHook, updateHook } from '@/lib/fineract/hooks';
import { getServerSession } from '@/lib/session/server';

const LIST_PATH = '/system/hooks';

export type HooksActionResult =
  | { ok: true; resourceId?: number }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

function hookPath(hookId: number | string) {
  return `${LIST_PATH}/${hookId}`;
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

function revalidateHookViews(hookId?: number) {
  revalidatePath(LIST_PATH);
  if (hookId != null) {
    revalidatePath(hookPath(hookId));
    revalidatePath(`${hookPath(hookId)}/edit`);
  }
}

export async function createHookAction(input: UpsertHookFormInput): Promise<HooksActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'CREATE_HOOK');
  } catch {
    return { ok: false, message: 'You do not have permission to create hooks.' };
  }

  const parsed = validateUpsertHookForm(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await createHook(parsed.data);
    revalidateHookViews(response.resourceId);
    return actionSuccessFromFineractCommand(response, { resourceId: response.resourceId });
  } catch (error) {
    return toFineractActionError(error, 'Failed to create hook.');
  }
}

export async function updateHookAction(
  hookId: number,
  input: UpsertHookFormInput
): Promise<HooksActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'UPDATE_HOOK');
  } catch {
    return { ok: false, message: 'You do not have permission to update hooks.' };
  }

  if (!Number.isFinite(hookId)) {
    return { ok: false, message: 'Invalid hook id.' };
  }

  const parsed = validateUpsertHookForm(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await updateHook(hookId, parsed.data);
    revalidateHookViews(hookId);
    return actionSuccessFromFineractCommand(response, { resourceId: hookId });
  } catch (error) {
    return toFineractActionError(error, 'Failed to update hook.');
  }
}

export async function deleteHookAction(hookId: number): Promise<HooksActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'DELETE_HOOK');
  } catch {
    return { ok: false, message: 'You do not have permission to delete hooks.' };
  }

  if (!Number.isFinite(hookId)) {
    return { ok: false, message: 'Invalid hook id.' };
  }

  try {
    const response = await deleteHook(hookId);
    revalidateHookViews();
    return actionSuccessFromFineractCommand(response, {});
  } catch (error) {
    return toFineractActionError(error, 'Failed to delete hook.');
  }
}
