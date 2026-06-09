'use server';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan, resolvePermission } from '@mifos/auth';
import type { ClientCollateralListItem, CollateralProductDetail } from '@mifos/api-client';
import {
  createClientCollateralSchema,
  toFineractActionError,
  type CreateClientCollateralInput
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import {
  createClientCollateral,
  deleteClientCollateral,
  getCollateralProduct,
  getClientCollateralTemplate,
  listClientCollaterals
} from '@/lib/fineract/client-collaterals';
import { clientCollateralListPath } from '@/lib/fineract/client-secondary-list-paths';
import type { ClientCollateralActionResult } from '@/lib/fineract/client-collateral-action-result';
import { getServerSession } from '@/lib/session/server';

function parseCreateInput(
  raw: unknown
): ClientCollateralActionResult | CreateClientCollateralInput {
  const parsed = createClientCollateralSchema.safeParse(raw);
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

export async function fetchCollateralProductAction(
  collateralId: string | number
): Promise<CollateralProductDetail | ClientCollateralActionResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, resolvePermission('clients.collateral.create'));
    return await getCollateralProduct(collateralId);
  } catch (err) {
    return toFineractActionError(err, 'Could not load collateral details.');
  }
}

export async function fetchClientCollateralsAction(
  clientId: string
): Promise<ClientCollateralListItem[] | ClientCollateralActionResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, resolvePermission('clients.collateral'));
    return await listClientCollaterals(clientId);
  } catch (err) {
    return toFineractActionError(err, 'Could not load collateral.');
  }
}

export async function fetchClientCollateralTemplateAction(
  clientId: string | number
): Promise<
  Awaited<ReturnType<typeof getClientCollateralTemplate>> | ClientCollateralActionResult
> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, resolvePermission('clients.collateral.create'));
    return await getClientCollateralTemplate(clientId);
  } catch (err) {
    return toFineractActionError(err, 'Could not load collateral options.');
  }
}

export async function createClientCollateralAction(
  clientId: string,
  raw: unknown
): Promise<ClientCollateralActionResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, resolvePermission('clients.collateral.create'));
  } catch {
    return { ok: false, message: 'You do not have permission to add collateral.' };
  }

  const parsed = parseCreateInput(raw);
  if ('ok' in parsed) {
    return parsed;
  }

  try {
    const response = await createClientCollateral(clientId, parsed);
    revalidatePath(clientCollateralListPath(clientId));
    revalidatePath(`/clients/${clientId}`, 'layout');
    return { ok: true, resourceId: response.resourceId };
  } catch (err) {
    return toFineractActionError(err, 'Could not add collateral.');
  }
}

export async function deleteClientCollateralAction(
  clientId: string,
  clientCollateralId: string | number
): Promise<ClientCollateralActionResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, resolvePermission('clients.collateral.delete'));
  } catch {
    return { ok: false, message: 'You do not have permission to delete collateral.' };
  }

  try {
    await deleteClientCollateral(clientId, clientCollateralId);
    revalidatePath(clientCollateralListPath(clientId));
    return { ok: true };
  } catch (err) {
    return toFineractActionError(err, 'Could not delete collateral.');
  }
}
