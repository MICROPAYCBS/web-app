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
  actionSuccessFromFineractCommand,
  toFineractActionError,
  validateUpdateTwoFactorConfiguration,
  type UpdateTwoFactorConfigurationInput
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import { updateTwoFactorConfiguration } from '@/lib/fineract/twofactor-configuration';
import { getServerSession } from '@/lib/session/server';

const PAGE_PATH = '/system/two-factor';

export type TwoFactorConfigurationActionResult =
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

export async function updateTwoFactorConfigurationAction(
  input: UpdateTwoFactorConfigurationInput
): Promise<TwoFactorConfigurationActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, resolvePermission('system.twoFactor.update'));
  } catch {
    return { ok: false, message: 'You do not have permission to update two-factor settings.' };
  }

  const parsed = validateUpdateTwoFactorConfiguration(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await updateTwoFactorConfiguration(parsed.data);
    revalidatePath(PAGE_PATH);
    return actionSuccessFromFineractCommand(response, {});
  } catch (error) {
    return toFineractActionError(error, 'Failed to update two-factor settings.');
  }
}
