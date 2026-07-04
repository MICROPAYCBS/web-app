'use server';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CurrencyLegalTender, OrganizationCashierSummary } from '@mifos/api-client';
import { assertCan } from '@mifos/auth';
import type { ZodError } from 'zod';
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
  listOrganizationCashiers,
  settleCashFromCashier,
  updateOrganizationCashier
} from '@/lib/fineract/cashiers';
import {
  assertCanViewCashier,
  CashierAccessError
} from '@/lib/fineract/cashier-access';
import {
  TELLER_LIST_PATH,
  tellerCashierDetailPath,
  tellerCashiersPath,
  tellerDetailPath
} from '@/lib/fineract/teller-paths';
import { validateSettleAmountAgainstNetCash } from '@/lib/fineract/cashier-cash-transaction-guard';
import { legalTenderLoadFailureFromError } from '@/lib/fineract/legal-tender-load';
import { listActiveCurrencyLegalTenders } from '@/lib/fineract/legal-tenders';
import { getOrganizationSelectedCurrencies } from '@/lib/fineract/organization-currencies';
import { getServerSession } from '@/lib/session/server';

async function loadCashierForAccessCheck(
  tellerId: string | number,
  cashierId: string | number
) {
  const cashiers = await listOrganizationCashiers(tellerId);
  return cashiers.find((row) => String(row.id) === String(cashierId)) ?? null;
}

export type CashierActionResult =
  | { ok: true; cashierId?: number }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

export type CashierSummaryActionResult =
  | { ok: true; summary: OrganizationCashierSummary }
  | { ok: false; message: string };

function zodFieldErrors(error: ZodError) {
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
  const cashiersPath = tellerCashiersPath(tellerId);
  revalidatePath(TELLER_LIST_PATH, 'layout');
  revalidatePath(tellerDetailPath(tellerId));
  revalidatePath(cashiersPath, 'page');
  revalidatePath(cashiersPath, 'layout');
  if (cashierId != null) {
    revalidatePath(tellerCashierDetailPath(tellerId, cashierId));
  }
}

async function resolveCurrencyDecimalPlaces(currencyCode: string): Promise<number> {
  const currencies = await getOrganizationSelectedCurrencies();
  return currencies.find((row) => row.code === currencyCode)?.decimalPlaces ?? 2;
}

async function loadCashierCashValidationContext(currencyCode: string): Promise<{
  tenders: CurrencyLegalTender[];
  decimalPlaces: number;
}> {
  const [tenders, decimalPlaces] = await Promise.all([
    listActiveCurrencyLegalTenders(currencyCode),
    resolveCurrencyDecimalPlaces(currencyCode)
  ]);
  return { tenders, decimalPlaces };
}

export async function loadCashierCashActionSheetDataAction(currencyCode: string): Promise<
  | {
      ok: true;
      tenders: CurrencyLegalTender[];
      decimalPlaces: number;
    }
  | { ok: false; message: string }
> {
  const trimmed = currencyCode.trim();
  if (!trimmed) {
    return { ok: false, message: 'Currency is required.' };
  }

  try {
    const context = await loadCashierCashValidationContext(trimmed);
    return { ok: true, ...context };
  } catch (error) {
    const failure = legalTenderLoadFailureFromError(
      error,
      'Could not load legal tender denominations.'
    );
    return { ok: false, message: failure.message };
  }
}

export async function loadCashierSummaryAction(
  tellerId: string | number,
  cashierId: string | number,
  currencyCode: string
): Promise<CashierSummaryActionResult> {
  const session = await getServerSession();
  try {
    const cashier = await loadCashierForAccessCheck(tellerId, cashierId);
    if (!cashier) {
      return { ok: false, message: 'Cashier not found.' };
    }
    await assertCanViewCashier(session, cashier);
  } catch (error) {
    if (error instanceof CashierAccessError) {
      return { ok: false, message: error.message };
    }
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
    const cashier = await loadCashierForAccessCheck(tellerId, cashierId);
    if (!cashier) {
      return { ok: false, message: 'Cashier not found.' };
    }
    await assertCanViewCashier(session, cashier);
  } catch (error) {
    if (error instanceof CashierAccessError) {
      return { ok: false, message: error.message };
    }
    return { ok: false, message: 'You do not have permission to allocate cash.' };
  }

  const currencyCode =
    typeof input === 'object' && input !== null && 'currencyCode' in input
      ? String((input as { currencyCode: unknown }).currencyCode ?? '').trim()
      : '';
  if (!currencyCode) {
    return { ok: false, message: 'Currency is required.' };
  }

  let validationContext;
  try {
    validationContext = await loadCashierCashValidationContext(currencyCode);
  } catch (error) {
    return toFineractActionError(error, 'Could not load legal tender denominations.');
  }

  const parsed = validateAllocateCashierCash(
    input,
    validationContext.tenders,
    validationContext.decimalPlaces
  );
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error as ZodError)
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
    const cashier = await loadCashierForAccessCheck(tellerId, cashierId);
    if (!cashier) {
      return { ok: false, message: 'Cashier not found.' };
    }
    await assertCanViewCashier(session, cashier);
  } catch (error) {
    if (error instanceof CashierAccessError) {
      return { ok: false, message: error.message };
    }
    return { ok: false, message: 'You do not have permission to settle cash.' };
  }

  const currencyCode =
    typeof input === 'object' && input !== null && 'currencyCode' in input
      ? String((input as { currencyCode: unknown }).currencyCode ?? '').trim()
      : '';
  if (!currencyCode) {
    return { ok: false, message: 'Currency is required.' };
  }

  let validationContext;
  try {
    validationContext = await loadCashierCashValidationContext(currencyCode);
  } catch (error) {
    return toFineractActionError(error, 'Could not load legal tender denominations.');
  }

  const parsed = validateSettleCashierCash(
    input,
    validationContext.tenders,
    validationContext.decimalPlaces
  );
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error as ZodError)
    };
  }

  const overdrawCheck = await validateSettleAmountAgainstNetCash({
    tellerId,
    cashierId,
    currencyCode: parsed.data.currencyCode,
    txnAmount: parsed.data.txnAmount
  });
  if (!overdrawCheck.ok) {
    return {
      ok: false,
      message: overdrawCheck.message,
      fieldErrors: overdrawCheck.fieldErrors
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
