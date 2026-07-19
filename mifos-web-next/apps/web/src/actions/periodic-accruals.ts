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
  validateExecutePeriodicAccruals,
  type ExecutePeriodicAccrualsInput,
  actionSuccessFromFineractCommand
} from '@mifos/validation';
import { executePeriodicAccruals } from '@/lib/fineract/periodic-accruals';
import { getServerSession } from '@/lib/session/server';

export type PeriodicAccrualsActionResult =
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

export async function executePeriodicAccrualsAction(
  input: ExecutePeriodicAccrualsInput
): Promise<PeriodicAccrualsActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'EXECUTE_PERIODICACCRUALACCOUNTING');
  } catch {
    return { ok: false, message: 'You do not have permission to run periodic accruals.' };
  }

  const parsed = validateExecutePeriodicAccruals(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await executePeriodicAccruals(parsed.data);
    return actionSuccessFromFineractCommand(response, {});
  } catch (error) {
    return toFineractActionError(error, 'Failed to run periodic accruals.');
  }
}
