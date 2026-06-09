'use server';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan, resolvePermission } from '@mifos/auth';
import type { LoanProductKind } from '@mifos/api-client';
import { toFineractActionError, upsertLoanProductSchema } from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import { buildLoanProductPayload } from '@/lib/fineract/loan-product-payload';
import type { LoanProductActionResult } from '@/lib/fineract/loan-product-action-result';
import {
  createLoanProductRecord,
  getLoanProductChargeOptions,
  updateLoanProductRecord
} from '@/lib/fineract/loan-products';
import { loanProductDetailPath, loanProductListPath } from '@/lib/fineract/loan-product-paths';
import { getServerSession } from '@/lib/session/server';

function parseInput(raw: unknown): LoanProductActionResult | ReturnType<typeof upsertLoanProductSchema.parse> {
  const parsed = upsertLoanProductSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.');
      if (key) {
        fieldErrors[key] = issue.message;
      }
    }
    return {
      ok: false,
      message: 'Please fix the highlighted fields.',
      fieldErrors
    };
  }
  return parsed.data;
}

export async function fetchLoanProductChargeOptionsAction(
  kind: LoanProductKind,
  currencyCode: string
) {
  const session = await getServerSession();
  if (!session) {
    return { ok: false as const, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, resolvePermission('products.loan'));
  } catch {
    return { ok: false as const, message: 'You do not have permission to view charge options.' };
  }

  const code = currencyCode.trim();
  if (!code) {
    return { ok: false as const, message: 'Select a currency first.' };
  }

  try {
    const options = await getLoanProductChargeOptions(kind, code);
    return { ok: true as const, ...options };
  } catch (err) {
    return toFineractActionError(err, 'Could not load charge options.');
  }
}

export async function createLoanProductAction(
  kind: LoanProductKind,
  raw: unknown
): Promise<LoanProductActionResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, resolvePermission('products.loan.create'));
  } catch {
    return { ok: false, message: 'You do not have permission to create loan products.' };
  }

  const parsed = parseInput(raw);
  if ('ok' in parsed) {
    return parsed;
  }

  try {
    const payload = buildLoanProductPayload(parsed);
    const response = await createLoanProductRecord(kind, payload);
    revalidatePath(loanProductListPath(kind));
    if (response.resourceId) {
      revalidatePath(loanProductDetailPath(response.resourceId, kind));
    }
    return { ok: true, resourceId: response.resourceId };
  } catch (err) {
    return toFineractActionError(err, 'Could not create loan product.');
  }
}

export async function updateLoanProductAction(
  productId: string,
  kind: LoanProductKind,
  raw: unknown
): Promise<LoanProductActionResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, resolvePermission('products.loan.update'));
  } catch {
    return { ok: false, message: 'You do not have permission to update loan products.' };
  }

  const parsed = parseInput(raw);
  if ('ok' in parsed) {
    return parsed;
  }

  try {
    const payload = buildLoanProductPayload(parsed);
    await updateLoanProductRecord(productId, kind, payload);
    revalidatePath(loanProductListPath(kind));
    revalidatePath(loanProductDetailPath(productId, kind));
    revalidatePath(`${loanProductDetailPath(productId, kind)}/edit`);
    return { ok: true, resourceId: Number(productId) };
  } catch (err) {
    return toFineractActionError(err, 'Could not update loan product.');
  }
}
