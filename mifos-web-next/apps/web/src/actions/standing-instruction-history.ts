'use server';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan } from '@mifos/auth';
import type { StandingInstructionRunHistoryPage } from '@mifos/api-client';
import {
  toFineractActionError,
  validateStandingInstructionHistorySearch,
  type StandingInstructionHistorySearchInput
} from '@mifos/validation';
import { searchStandingInstructionRunHistory } from '@/lib/fineract/standing-instruction-run-history';
import { getServerSession } from '@/lib/session/server';

export type StandingInstructionHistoryActionResult =
  | { ok: true; data: StandingInstructionRunHistoryPage }
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

export async function searchStandingInstructionHistoryAction(
  input: StandingInstructionHistorySearchInput
): Promise<StandingInstructionHistoryActionResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }

  try {
    assertCan(session, 'READ_STANDINGINSTRUCTION');
  } catch {
    return { ok: false, message: 'You do not have permission to view standing instruction history.' };
  }

  const parsed = validateStandingInstructionHistorySearch(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const data = await searchStandingInstructionRunHistory(parsed.data);
    return { ok: true, data };
  } catch (error) {
    return toFineractActionError(error, 'Could not search standing instruction history.');
  }
}
