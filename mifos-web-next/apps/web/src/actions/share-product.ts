'use server';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan, resolvePermission } from '@mifos/auth';
import { toFineractActionError, upsertShareProductSchema } from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import { buildShareProductPayload } from '@/lib/fineract/share-product-payload';
import type { ShareProductActionResult } from '@/lib/fineract/share-product-action-result';
import {
  shareProductDetailPath,
  SHARE_PRODUCTS_LIST_PATH
} from '@/lib/fineract/share-product-paths';
import {
  createShareProductRecord,
  getShareProductChargeOptions,
  updateShareProductRecord
} from '@/lib/fineract/share-products';
import { getServerSession } from '@/lib/session/server';

function parseInput(
  raw: unknown
): ShareProductActionResult | ReturnType<typeof upsertShareProductSchema.parse> {
  const parsed = upsertShareProductSchema.safeParse(raw);
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

export async function fetchShareProductChargeOptionsAction(currencyCode: string) {
  const session = await getServerSession();
  if (!session) {
    return { ok: false as const, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, resolvePermission('products.share'));
  } catch {
    return { ok: false as const, message: 'You do not have permission to view charge options.' };
  }

  const code = currencyCode.trim();
  if (!code) {
    return { ok: false as const, message: 'Select a currency first.' };
  }

  try {
    const options = await getShareProductChargeOptions(code);
    return { ok: true as const, ...options };
  } catch (err) {
    return toFineractActionError(err, 'Could not load charge options.');
  }
}

export async function createShareProductAction(
  raw: unknown
): Promise<ShareProductActionResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, resolvePermission('products.share.create'));
  } catch {
    return { ok: false, message: 'You do not have permission to create share products.' };
  }

  const parsed = parseInput(raw);
  if ('ok' in parsed) {
    return parsed;
  }

  try {
    const payload = buildShareProductPayload(parsed);
    const response = await createShareProductRecord(payload);
    revalidatePath(SHARE_PRODUCTS_LIST_PATH);
    if (response.resourceId) {
      revalidatePath(shareProductDetailPath(response.resourceId));
    }
    return { ok: true, resourceId: response.resourceId };
  } catch (err) {
    return toFineractActionError(err, 'Could not create share product.');
  }
}

export async function updateShareProductAction(
  productId: string,
  raw: unknown
): Promise<ShareProductActionResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, resolvePermission('products.share.update'));
  } catch {
    return { ok: false, message: 'You do not have permission to update share products.' };
  }

  const parsed = parseInput(raw);
  if ('ok' in parsed) {
    return parsed;
  }

  try {
    const payload = buildShareProductPayload(parsed);
    await updateShareProductRecord(productId, payload);
    revalidatePath(SHARE_PRODUCTS_LIST_PATH);
    revalidatePath(shareProductDetailPath(productId));
    revalidatePath(`${shareProductDetailPath(productId)}/edit`);
    return { ok: true, resourceId: Number(productId) };
  } catch (err) {
    return toFineractActionError(err, 'Could not update share product.');
  }
}
