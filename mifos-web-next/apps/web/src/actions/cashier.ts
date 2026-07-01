'use server';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { OrganizationCashierSummary } from '@mifos/api-client';
import { assertCan } from '@mifos/auth';
import {
  toFineractActionError,
  validateAllocateCashierCash,
  validateAssignCashier,
  validateSettleCashierCash,
  validateUpdateCashier,
  actionSuccessFromFineractCommand
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import {
  allocateCashToCashier,
  createOrganizationCashier,
  deleteOrganizationCashier,
  getOrganizationCashierSummary,
  settleCashFromCashier,
  updateOrganizationCashier
} from '@/lib/fineract/cashiers';
import {
  tellerCashierDetailPath,
  tellerCashiersPath,
  tellerDetailPath
} from '@/lib/fineract/teller-paths';
import { getServerSession } from '@/lib/session/server';

export type CashierActionResult =
  | { ok: true; cashierId?: number }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

export type CashierSummaryActionResult =
  | { ok: true; summary: OrganizationCashierSummary }
  | { ok: false; message: string };

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

function revalidateCashierViews(tellerId: string | number, cashierId?: string | number) {
  revalidatePath(tellerDetailPath(tellerId));
  revalidatePath(tellerCashiersPath(tellerId));
  if (cashierId != null) {
    revalidatePath(tellerCashierDetailPath(tellerId, cashierId));
  }
}

export async function loadCashierSummaryAction(
  tellerId: string | number,
  cashierId: string | number,
  currencyCode: string
): Promise<CashierSummaryActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'READ_TELLER');
  } catch {
    return { ok: false, message: 'You do not have permission to view cashiers.' };
  }

  if (!currencyCode.trim()) {
    return { ok: false, message: 'Currency is required.' };
  }

  try {
    const summary = await getOrganizationCashierSummary(tellerId, cashierId, currencyCode);
    return { ok: true, summary };
  } catch (error) {
    return toFineractActionError(error, 'Failed to load cashier summary.');
  }
}

export async function assignCashierAction(
  tellerId: string | number,
  input: unknown
): Promise<CashierActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'ALLOCATECASHIER_TELLER');
  } catch {
    return { ok: false, message: 'You do not have permission to assign cashiers.' };
  }

  const parsed = validateAssignCashier(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await createOrganizationCashier(tellerId, parsed.data);
    revalidateCashierViews(tellerId, response.resourceId);
    return actionSuccessFromFineractCommand(response, { cashierId: response.resourceId });
  } catch (error) {
    return toFineractActionError(error, 'Failed to assign cashier.');
  }
}

export async function updateCashierAction(
  tellerId: string | number,
  cashierId: string | number,
  input: unknown
): Promise<CashierActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'UPDATECASHIERALLOCATION_TELLER');
  } catch {
    return { ok: false, message: 'You do not have permission to update cashier assignments.' };
  }

  const parsed = validateUpdateCashier(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await updateOrganizationCashier(tellerId, cashierId, parsed.data);
    revalidateCashierViews(tellerId, cashierId);
    return actionSuccessFromFineractCommand(response, { cashierId: response.resourceId ?? Number(cashierId) });
  } catch (error) {
    return toFineractActionError(error, 'Failed to update cashier assignment.');
  }
}

export async function deleteCashierAction(
  tellerId: string | number,
  cashierId: string | number
): Promise<CashierActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'DELETECASHIERALLOCATION_TELLER');
  } catch {
    return { ok: false, message: 'You do not have permission to remove cashier assignments.' };
  }

  try {
    const response = await deleteOrganizationCashier(tellerId, cashierId);
    revalidateCashierViews(tellerId);
    return actionSuccessFromFineractCommand(response, { cashierId: Number(cashierId) });
  } catch (error) {
    return toFineractActionError(error, 'Failed to remove cashier assignment.');
  }
}

export async function allocateCashierCashAction(
  tellerId: string | number,
  cashierId: string | number,
  input: unknown
): Promise<CashierActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'ALLOCATECASHTOCASHIER_TELLER');
  } catch {
    return { ok: false, message: 'You do not have permission to allocate cash.' };
  }

  const parsed = validateAllocateCashierCash(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await allocateCashToCashier(tellerId, cashierId, parsed.data);
    revalidateCashierViews(tellerId, cashierId);
    return actionSuccessFromFineractCommand(response, { cashierId: Number(cashierId) });
  } catch (error) {
    return toFineractActionError(error, 'Failed to allocate cash.');
  }
}

export async function settleCashierCashAction(
  tellerId: string | number,
  cashierId: string | number,
  input: unknown
): Promise<CashierActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'SETTLECASHFROMCASHIER_TELLER');
  } catch {
    return { ok: false, message: 'You do not have permission to settle cash.' };
  }

  const parsed = validateSettleCashierCash(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await settleCashFromCashier(tellerId, cashierId, parsed.data);
    revalidateCashierViews(tellerId, cashierId);
    return actionSuccessFromFineractCommand(response, { cashierId: Number(cashierId) });
  } catch (error) {
    return toFineractActionError(error, 'Failed to settle cash.');
  }
}
