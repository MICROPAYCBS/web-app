'use server';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan, resolvePermission } from '@mifos/auth';
import type { InvestorTransferSearchPage } from '@mifos/api-client';
import {
  toFineractActionError,
  validateCancelInvestorTransfer,
  validateInvestorSearch,
  type CancelInvestorTransferInput,
  type InvestorSearchInput
} from '@mifos/validation';
import {
  cancelInvestorTransfer,
  searchInvestorTransfers
} from '@/lib/fineract/investors';
import { getServerSession } from '@/lib/session/server';

export type InvestorActionResult =
  | { ok: true; data: InvestorTransferSearchPage }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

export type InvestorCancelResult = { ok: true } | { ok: false; message: string };

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

function assertCanViewInvestors(session: Awaited<ReturnType<typeof getServerSession>>) {
  assertCan(session, resolvePermission('organization.investors'));
}

export async function searchInvestorsAction(
  input: InvestorSearchInput
): Promise<InvestorActionResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }

  try {
    assertCanViewInvestors(session);
  } catch {
    return { ok: false, message: 'You do not have permission to view investors.' };
  }

  const parsed = validateInvestorSearch(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const data = await searchInvestorTransfers(parsed.data);
    return { ok: true, data };
  } catch (error) {
    return toFineractActionError(error, 'Could not load investor transfers.');
  }
}

export async function cancelInvestorTransferAction(
  input: CancelInvestorTransferInput
): Promise<InvestorCancelResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }

  try {
    assertCanViewInvestors(session);
  } catch {
    return { ok: false, message: 'You do not have permission to cancel investor transfers.' };
  }

  const parsed = validateCancelInvestorTransfer(input);
  if (!parsed.success) {
    return { ok: false, message: 'Invalid transfer details.' };
  }

  try {
    await cancelInvestorTransfer(parsed.data);
    return { ok: true };
  } catch (error) {
    return toFineractActionError(error, 'Could not cancel the pending sale.');
  }
}
