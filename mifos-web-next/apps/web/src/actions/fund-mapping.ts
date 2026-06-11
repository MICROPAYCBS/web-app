'use server';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan, resolvePermission } from '@mifos/auth';
import type { FundMappingSearchResultItem } from '@mifos/api-client';
import {
  toFineractActionError,
  validateFundMappingSearch,
  type FundMappingSearchInput
} from '@mifos/validation';
import { searchFundMappingLoans } from '@/lib/fineract/fund-mapping';
import { getServerSession } from '@/lib/session/server';

export type FundMappingActionResult =
  | { ok: true; items: FundMappingSearchResultItem[] }
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

export async function searchFundMappingAction(
  input: FundMappingSearchInput
): Promise<FundMappingActionResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }

  try {
    assertCan(session, resolvePermission('organization.fundMapping'));
  } catch {
    return { ok: false, message: 'You do not have permission to run fund mapping searches.' };
  }

  const parsed = validateFundMappingSearch(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const items = await searchFundMappingLoans(parsed.data);
    return { ok: true, items };
  } catch (error) {
    return toFineractActionError(error, 'Could not load fund mapping summary.');
  }
}
