'use server';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan, resolvePermission } from '@mifos/auth';
import {
  toFineractActionError,
  validateUpdatePasswordPreferences,
  type UpdatePasswordPreferencesInput
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import { updatePasswordPreferences } from '@/lib/fineract/password-preferences';
import { getServerSession } from '@/lib/session/server';

const PASSWORD_PREFERENCES_PATH = '/organization/password-preferences';

export type PasswordPreferencesActionResult =
  | { ok: true }
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

export async function updatePasswordPreferencesAction(
  input: UpdatePasswordPreferencesInput
): Promise<PasswordPreferencesActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, resolvePermission('organization.passwordPreferences.update'));
  } catch {
    return { ok: false, message: 'You do not have permission to update password preferences.' };
  }

  const parsed = validateUpdatePasswordPreferences(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    await updatePasswordPreferences(parsed.data);
    revalidatePath(PASSWORD_PREFERENCES_PATH);
    return { ok: true };
  } catch (error) {
    return toFineractActionError(error, 'Failed to update password preferences.');
  }
}
