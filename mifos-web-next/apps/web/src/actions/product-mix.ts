'use server';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan, resolvePermission } from '@mifos/auth';
import {
  createProductMixSchema,
  toFineractActionError,
  updateProductMixSchema,
  type CreateProductMixInput,
  type UpdateProductMixInput,
  actionSuccessFromFineractCommand
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import type {
  ProductMixActionResult,
  ProductMixFormOptionsResult
} from '@/lib/fineract/product-mix-action-result';
import {
  createProductMix,
  deleteProductMix,
  getProductMixFormOptions,
  updateProductMix
} from '@/lib/fineract/product-mix';
import {
  productMixDetailPath,
  productMixEditPath,
  productMixListPath
} from '@/lib/fineract/product-mix-paths';
import { getServerSession } from '@/lib/session/server';

function parseCreateInput(raw: unknown): ProductMixActionResult | CreateProductMixInput {
  const parsed = createProductMixSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === 'string') {
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

function parseUpdateInput(raw: unknown): ProductMixActionResult | UpdateProductMixInput {
  const parsed = updateProductMixSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === 'string') {
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

export async function fetchProductMixFormOptionsAction(
  productId: string
): Promise<ProductMixFormOptionsResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, resolvePermission('products.mix.create'));
  } catch {
    return { ok: false, message: 'You do not have permission to create product mixes.' };
  }

  try {
    const options = await getProductMixFormOptions(productId);
    return {
      ok: true,
      restrictedProducts: options.restrictedProducts,
      allowedProducts: options.allowedProducts
    };
  } catch (err) {
    return toFineractActionError(err, 'Could not load product options.');
  }
}

export async function createProductMixAction(raw: unknown): Promise<ProductMixActionResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, resolvePermission('products.mix.create'));
  } catch {
    return { ok: false, message: 'You do not have permission to create product mixes.' };
  }

  const parsed = parseCreateInput(raw);
  if ('ok' in parsed) {
    return parsed;
  }

  try {
    const response = await createProductMix(parsed);
    const productId = response.productId ?? parsed.productId;
    revalidatePath(productMixListPath());
    revalidatePath(productMixDetailPath(productId));
    return actionSuccessFromFineractCommand(response, { productId });
  } catch (err) {
    return toFineractActionError(err, 'Could not create product mix.');
  }
}

export async function updateProductMixAction(
  productId: string,
  raw: unknown
): Promise<ProductMixActionResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, resolvePermission('products.mix.update'));
  } catch {
    return { ok: false, message: 'You do not have permission to update product mixes.' };
  }

  const parsed = parseUpdateInput(raw);
  if ('ok' in parsed) {
    return parsed;
  }

  try {
    const response = await updateProductMix(productId, parsed);
    revalidatePath(productMixListPath());
    revalidatePath(productMixDetailPath(productId));
    revalidatePath(productMixEditPath(productId));
    return actionSuccessFromFineractCommand(response, {});
  } catch (err) {
    return toFineractActionError(err, 'Could not update product mix.');
  }
}

export async function deleteProductMixAction(productId: string): Promise<ProductMixActionResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, resolvePermission('products.mix.delete'));
  } catch {
    return { ok: false, message: 'You do not have permission to delete product mixes.' };
  }

  try {
    const response = await deleteProductMix(productId);
    revalidatePath(productMixListPath());
    return actionSuccessFromFineractCommand(response, {});
  } catch (err) {
    return toFineractActionError(err, 'Could not delete product mix.');
  }
}
