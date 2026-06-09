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
  validateCreateAccountNumberPreference,
  validateUpdateAccountNumberPreference,
  type CreateAccountNumberPreferenceInput,
  type UpdateAccountNumberPreferenceInput
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import {
  createAccountNumberPreference,
  deleteAccountNumberPreference,
  updateAccountNumberPreference
} from '@/lib/fineract/account-number-preferences';
import { getServerSession } from '@/lib/session/server';

const LIST_PATH = '/system/account-number-preferences';

export type AccountNumberPreferencesActionResult =
  | { ok: true; resourceId?: number }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

function preferencePath(preferenceId: number | string) {
  return `${LIST_PATH}/${preferenceId}`;
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

function revalidatePreferenceViews(preferenceId?: number) {
  revalidatePath(LIST_PATH);
  if (preferenceId != null) {
    revalidatePath(preferencePath(preferenceId));
  }
}

export async function createAccountNumberPreferenceAction(
  input: CreateAccountNumberPreferenceInput
): Promise<AccountNumberPreferencesActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'CREATE_ACCOUNTNUMBERFORMAT');
  } catch {
    return { ok: false, message: 'You do not have permission to create account number preferences.' };
  }

  const parsed = validateCreateAccountNumberPreference(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await createAccountNumberPreference(parsed.data);
    revalidatePreferenceViews(response.resourceId);
    return { ok: true, resourceId: response.resourceId };
  } catch (error) {
    return toFineractActionError(error, 'Failed to create account number preference.');
  }
}

export async function updateAccountNumberPreferenceAction(
  preferenceId: number,
  input: UpdateAccountNumberPreferenceInput
): Promise<AccountNumberPreferencesActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'UPDATE_ACCOUNTNUMBERFORMAT');
  } catch {
    return { ok: false, message: 'You do not have permission to update account number preferences.' };
  }

  if (!Number.isFinite(preferenceId)) {
    return { ok: false, message: 'Invalid preference id.' };
  }

  const parsed = validateUpdateAccountNumberPreference(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    await updateAccountNumberPreference(preferenceId, parsed.data);
    revalidatePreferenceViews(preferenceId);
    return { ok: true, resourceId: preferenceId };
  } catch (error) {
    return toFineractActionError(error, 'Failed to update account number preference.');
  }
}

export async function deleteAccountNumberPreferenceAction(
  preferenceId: number
): Promise<AccountNumberPreferencesActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'DELETE_ACCOUNTNUMBERFORMAT');
  } catch {
    return { ok: false, message: 'You do not have permission to delete account number preferences.' };
  }

  if (!Number.isFinite(preferenceId)) {
    return { ok: false, message: 'Invalid preference id.' };
  }

  try {
    await deleteAccountNumberPreference(preferenceId);
    revalidatePreferenceViews();
    return { ok: true };
  } catch (error) {
    return toFineractActionError(error, 'Failed to delete account number preference.');
  }
}
