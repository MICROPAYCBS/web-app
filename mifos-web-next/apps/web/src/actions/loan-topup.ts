'use server';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can } from '@mifos/auth';
import { toFineractActionError } from '@mifos/validation';
import {
  listPendingTopupClosures,
  loadLoanTopupContext
} from '@/lib/fineract/loan-topup-load';
import type { LoanTopupContext, PendingTopupClosure } from '@/lib/fineract/loan-topup';
import { getServerSession } from '@/lib/session/server';

const LOAN_TOPUP_READ_PERMISSIONS = [
  'READ_LOAN',
  'CREATE_LOAN',
  'UPDATE_LOAN',
  'APPROVE_LOAN',
  'DISBURSE_LOAN',
  'DISBURSETOSAVINGS_LOAN'
] as const;

async function denyWithoutLoanRead(): Promise<{ ok: false; message: string } | null> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  if (!LOAN_TOPUP_READ_PERMISSIONS.some((permission) => can(session, permission))) {
    return { ok: false, message: 'You do not have permission to view this loan.' };
  }
  return null;
}

export async function loadLoanTopupContextAction(
  loanId: number,
  transactionDate: string
): Promise<{ ok: true; context: LoanTopupContext } | { ok: false; message: string }> {
  const denied = await denyWithoutLoanRead();
  if (denied) {
    return denied;
  }
  if (!Number.isFinite(loanId) || loanId <= 0) {
    return { ok: false, message: 'Choose an active loan of this client' };
  }
  try {
    return await loadLoanTopupContext(loanId, transactionDate);
  } catch (error) {
    return toFineractActionError(error, 'Could not load the payoff.');
  }
}

export async function loadPendingTopupClosuresAction(
  clientId: string,
  excludeLoanId?: number
): Promise<{ ok: true; pending: PendingTopupClosure[] } | { ok: false; message: string }> {
  const denied = await denyWithoutLoanRead();
  if (denied) {
    return denied;
  }
  try {
    const pending = await listPendingTopupClosures(clientId, excludeLoanId);
    return { ok: true, pending };
  } catch (error) {
    return toFineractActionError(error, 'Could not check pending top-ups.');
  }
}
