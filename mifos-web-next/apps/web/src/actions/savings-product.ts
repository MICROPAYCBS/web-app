'use server';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan, resolvePermission } from '@mifos/auth';
import { toFineractActionError, upsertSavingsProductSchema } from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import { buildSavingsProductPayload } from '@/lib/fineract/savings-product-payload';
import type { SavingsProductActionResult } from '@/lib/fineract/savings-product-action-result';
import {
  savingsProductDetailPath,
  SAVINGS_PRODUCTS_LIST_PATH
} from '@/lib/fineract/savings-product-paths';
import {
  createSavingsProductRecord,
  getSavingsProductChargeOptions,
  updateSavingsProductRecord
} from '@/lib/fineract/savings-products';
import { getServerSession } from '@/lib/session/server';

function parseInput(
  raw: unknown
): SavingsProductActionResult | ReturnType<typeof upsertSavingsProductSchema.parse> {
  const parsed = upsertSavingsProductSchema.safeParse(raw);
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

export async function fetchSavingsProductChargeOptionsAction(currencyCode: string) {
  const session = await getServerSession();
  if (!session) {
    return { ok: false as const, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, resolvePermission('products.savings'));
  } catch {
    return { ok: false as const, message: 'You do not have permission to view charge options.' };
  }

  const code = currencyCode.trim();
  if (!code) {
    return { ok: false as const, message: 'Select a currency first.' };
  }

  try {
    const options = await getSavingsProductChargeOptions(code);
    return { ok: true as const, ...options };
  } catch (err) {
    return toFineractActionError(err, 'Could not load charge options.');
  }
}

export async function createSavingsProductAction(
  raw: unknown
): Promise<SavingsProductActionResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, resolvePermission('products.savings.create'));
  } catch {
    return { ok: false, message: 'You do not have permission to create savings products.' };
  }

  const parsed = parseInput(raw);
  if ('ok' in parsed) {
    return parsed;
  }

  try {
    const payload = buildSavingsProductPayload(parsed);
    const response = await createSavingsProductRecord(payload);
    revalidatePath(SAVINGS_PRODUCTS_LIST_PATH);
    if (response.resourceId) {
      revalidatePath(savingsProductDetailPath(response.resourceId));
    }
    return { ok: true, resourceId: response.resourceId };
  } catch (err) {
    return toFineractActionError(err, 'Could not create savings product.');
  }
}

export async function updateSavingsProductAction(
  productId: string,
  raw: unknown
): Promise<SavingsProductActionResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, resolvePermission('products.savings.update'));
  } catch {
    return { ok: false, message: 'You do not have permission to update savings products.' };
  }

  const parsed = parseInput(raw);
  if ('ok' in parsed) {
    return parsed;
  }

  try {
    const payload = buildSavingsProductPayload(parsed);
    await updateSavingsProductRecord(productId, payload);
    revalidatePath(SAVINGS_PRODUCTS_LIST_PATH);
    revalidatePath(savingsProductDetailPath(productId));
    revalidatePath(`${savingsProductDetailPath(productId)}/edit`);
    return { ok: true, resourceId: Number(productId) };
  } catch (err) {
    return toFineractActionError(err, 'Could not update savings product.');
  }
}
