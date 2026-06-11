'use server';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractOpeningBalanceTemplate } from '@mifos/api-client';
import { assertCan, resolvePermission } from '@mifos/auth';
import {
  toFineractActionError,
  validateDefineOpeningBalance,
  type DefineOpeningBalanceInput
} from '@mifos/validation';
import {
  defineOpeningBalance,
  getOpeningBalanceTemplate
} from '@/lib/fineract/opening-balances';
import { getServerSession } from '@/lib/session/server';

export type OpeningBalanceFetchResult =
  | FineractOpeningBalanceTemplate
  | { ok: false; message: string };

export type OpeningBalanceActionResult =
  | { ok: true; transactionId?: string }
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

export async function fetchOpeningBalanceTemplateAction(
  officeId: number
): Promise<OpeningBalanceFetchResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }

  if (!Number.isFinite(officeId) || officeId <= 0) {
    return { ok: false, message: 'Select an office before retrieving opening balances.' };
  }

  try {
    assertCan(session, resolvePermission('accounting.migrateBalances'));
    return await getOpeningBalanceTemplate(officeId);
  } catch (error) {
    return toFineractActionError(error, 'Could not retrieve opening balances.');
  }
}

export async function defineOpeningBalanceAction(
  input: DefineOpeningBalanceInput
): Promise<OpeningBalanceActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'DEFINEOPENINGBALANCE_JOURNALENTRY');
  } catch {
    return { ok: false, message: 'You do not have permission to define opening balances.' };
  }

  const parsed = validateDefineOpeningBalance(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await defineOpeningBalance(parsed.data);
    return { ok: true, transactionId: response.transactionId };
  } catch (error) {
    return toFineractActionError(error, 'Failed to define opening balances.');
  }
}
