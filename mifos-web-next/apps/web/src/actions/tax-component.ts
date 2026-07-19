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
  createTaxComponentSchema,
  toFineractActionError,
  updateTaxComponentSchema,
  type CreateTaxComponentInput,
  type UpdateTaxComponentInput,
  actionSuccessFromFineractCommand
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import type { TaxActionResult } from '@/lib/fineract/tax-action-result';
import {
  createTaxComponent,
  updateTaxComponent
} from '@/lib/fineract/tax-components';
import {
  taxComponentDetailPath,
  taxComponentEditPath,
  taxComponentsListPath
} from '@/lib/fineract/tax-paths';
import { getServerSession } from '@/lib/session/server';

function parseCreateInput(raw: unknown): TaxActionResult | CreateTaxComponentInput {
  const parsed = createTaxComponentSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === 'string') {
        fieldErrors[key] = issue.message;
      }
    }
    return { ok: false, message: 'Please fix the highlighted fields.', fieldErrors };
  }
  return parsed.data;
}

function parseUpdateInput(raw: unknown): TaxActionResult | UpdateTaxComponentInput {
  const parsed = updateTaxComponentSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === 'string') {
        fieldErrors[key] = issue.message;
      }
    }
    return { ok: false, message: 'Please fix the highlighted fields.', fieldErrors };
  }
  return parsed.data;
}

export async function createTaxComponentAction(raw: unknown): Promise<TaxActionResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, resolvePermission('products.tax.components.create'));
  } catch {
    return { ok: false, message: 'You do not have permission to create tax components.' };
  }

  const parsed = parseCreateInput(raw);
  if ('ok' in parsed) {
    return parsed;
  }

  try {
    const response = await createTaxComponent(parsed);
    const resourceId = response.resourceId;
    revalidatePath(taxComponentsListPath());
    if (resourceId) {
      revalidatePath(taxComponentDetailPath(resourceId));
    }
    return actionSuccessFromFineractCommand(response, { resourceId });
  } catch (err) {
    return toFineractActionError(err, 'Could not create tax component.');
  }
}

export async function updateTaxComponentAction(
  taxComponentId: string,
  raw: unknown
): Promise<TaxActionResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, resolvePermission('products.tax.components.update'));
  } catch {
    return { ok: false, message: 'You do not have permission to update tax components.' };
  }

  const parsed = parseUpdateInput(raw);
  if ('ok' in parsed) {
    return parsed;
  }

  try {
    const response = await updateTaxComponent(taxComponentId, parsed);
    revalidatePath(taxComponentsListPath());
    revalidatePath(taxComponentDetailPath(taxComponentId));
    revalidatePath(taxComponentEditPath(taxComponentId));
    return actionSuccessFromFineractCommand(response, {});
  } catch (err) {
    return toFineractActionError(err, 'Could not update tax component.');
  }
}
