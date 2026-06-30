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
  toFineractActionError,
  upsertCollateralProductSchema,
  type UpsertCollateralProductInput,
  actionSuccessFromFineractCommand
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import {
  createCollateralProduct,
  deleteCollateralProduct,
  updateCollateralProduct
} from '@/lib/fineract/collateral-products';
import type { CollateralProductActionResult } from '@/lib/fineract/collateral-product-action-result';
import { getServerSession } from '@/lib/session/server';

const LIST_PATH = '/products/collaterals';

function detailPath(collateralId: string | number) {
  return `${LIST_PATH}/${collateralId}`;
}

function editPath(collateralId: string | number) {
  return `${detailPath(collateralId)}/edit`;
}

function parseUpsertInput(raw: unknown): CollateralProductActionResult | UpsertCollateralProductInput {
  const parsed = upsertCollateralProductSchema.safeParse(raw);
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

export async function createCollateralProductAction(
  raw: unknown
): Promise<CollateralProductActionResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, resolvePermission('products.collaterals.create'));
  } catch {
    return { ok: false, message: 'You do not have permission to create collateral products.' };
  }

  const parsed = parseUpsertInput(raw);
  if ('ok' in parsed) {
    return parsed;
  }

  try {
    const response = await createCollateralProduct(parsed);
    const resourceId = response.resourceId;
    revalidatePath(LIST_PATH);
    if (resourceId) {
      revalidatePath(detailPath(resourceId));
    }
    return actionSuccessFromFineractCommand(response, { resourceId });
  } catch (err) {
    return toFineractActionError(err, 'Could not create collateral product.');
  }
}

export async function updateCollateralProductAction(
  collateralId: string,
  raw: unknown
): Promise<CollateralProductActionResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, resolvePermission('products.collaterals.update'));
  } catch {
    return { ok: false, message: 'You do not have permission to update collateral products.' };
  }

  const parsed = parseUpsertInput(raw);
  if ('ok' in parsed) {
    return parsed;
  }

  try {
    const response = await updateCollateralProduct(collateralId, parsed);
    revalidatePath(LIST_PATH);
    revalidatePath(detailPath(collateralId));
    revalidatePath(editPath(collateralId));
    return actionSuccessFromFineractCommand(response, {});
  } catch (err) {
    return toFineractActionError(err, 'Could not update collateral product.');
  }
}

export async function deleteCollateralProductAction(
  collateralId: string
): Promise<CollateralProductActionResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, resolvePermission('products.collaterals.delete'));
  } catch {
    return { ok: false, message: 'You do not have permission to delete collateral products.' };
  }

  try {
    const response = await deleteCollateralProduct(collateralId);
    revalidatePath(LIST_PATH);
    return actionSuccessFromFineractCommand(response, {});
  } catch (err) {
    return toFineractActionError(err, 'Could not delete collateral product.');
  }
}
