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
  validateToggleGlAccountDisabled,
  validateUpsertGlAccountForm,
  type ToggleGlAccountDisabledInput,
  type UpsertGlAccountFormInput,
  actionSuccessFromFineractCommand
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import {
  createGlAccount,
  deleteGlAccount,
  toggleGlAccountDisabled,
  updateGlAccount
} from '@/lib/fineract/gl-accounts';
import { getServerSession } from '@/lib/session/server';

const LIST_PATH = '/accounting/chart-of-accounts';

export type GlAccountsActionResult =
  | { ok: true; resourceId?: number; disabled?: boolean }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

function glAccountPath(glAccountId: number | string) {
  return `${LIST_PATH}/${glAccountId}`;
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

function revalidateGlAccountViews(glAccountId?: number) {
  revalidatePath(LIST_PATH);
  if (glAccountId != null) {
    revalidatePath(glAccountPath(glAccountId));
    revalidatePath(`${glAccountPath(glAccountId)}/edit`);
  }
}

export async function createGlAccountAction(
  input: UpsertGlAccountFormInput
): Promise<GlAccountsActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'CREATE_GLACCOUNT');
  } catch {
    return { ok: false, message: 'You do not have permission to create GL accounts.' };
  }

  const parsed = validateUpsertGlAccountForm(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await createGlAccount(parsed.data);
    revalidateGlAccountViews(response.resourceId);
    return actionSuccessFromFineractCommand(response, { resourceId: response.resourceId });
  } catch (error) {
    return toFineractActionError(error, 'Failed to create GL account.');
  }
}

export async function updateGlAccountAction(
  glAccountId: number,
  input: UpsertGlAccountFormInput
): Promise<GlAccountsActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'UPDATE_GLACCOUNT');
  } catch {
    return { ok: false, message: 'You do not have permission to update GL accounts.' };
  }

  if (!Number.isFinite(glAccountId)) {
    return { ok: false, message: 'Invalid GL account id.' };
  }

  const parsed = validateUpsertGlAccountForm(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await updateGlAccount(glAccountId, parsed.data);
    revalidateGlAccountViews(glAccountId);
    return actionSuccessFromFineractCommand(response, { resourceId: response.resourceId });
  } catch (error) {
    return toFineractActionError(error, 'Failed to update GL account.');
  }
}

export async function toggleGlAccountDisabledAction(
  glAccountId: number,
  input: ToggleGlAccountDisabledInput
): Promise<GlAccountsActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'UPDATE_GLACCOUNT');
  } catch {
    return { ok: false, message: 'You do not have permission to update GL accounts.' };
  }

  if (!Number.isFinite(glAccountId)) {
    return { ok: false, message: 'Invalid GL account id.' };
  }

  const parsed = validateToggleGlAccountDisabled(input);
  if (!parsed.success) {
    return { ok: false, message: 'Invalid request.' };
  }

  try {
    const response = await toggleGlAccountDisabled(glAccountId, parsed.data);
    revalidateGlAccountViews(glAccountId);
    return actionSuccessFromFineractCommand(response, { resourceId: glAccountId, disabled: response.changes.disabled });
  } catch (error) {
    return toFineractActionError(error, 'Failed to update GL account status.');
  }
}

export async function deleteGlAccountAction(glAccountId: number): Promise<GlAccountsActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'DELETE_GLACCOUNT');
  } catch {
    return { ok: false, message: 'You do not have permission to delete GL accounts.' };
  }

  if (!Number.isFinite(glAccountId)) {
    return { ok: false, message: 'Invalid GL account id.' };
  }

  try {
    const response = await deleteGlAccount(glAccountId);
    revalidateGlAccountViews();
    return actionSuccessFromFineractCommand(response, {});
  } catch (error) {
    return toFineractActionError(error, 'Failed to delete GL account.');
  }
}
