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
  upsertTaxGroupSchema,
  type UpsertTaxGroupInput
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import type { TaxActionResult } from '@/lib/fineract/tax-action-result';
import { createTaxGroup, updateTaxGroup } from '@/lib/fineract/tax-groups';
import {
  taxGroupDetailPath,
  taxGroupEditPath,
  taxGroupsListPath
} from '@/lib/fineract/tax-paths';
import { getServerSession } from '@/lib/session/server';

function parseUpsertInput(raw: unknown): TaxActionResult | UpsertTaxGroupInput {
  const parsed = upsertTaxGroupSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.') || 'form';
      fieldErrors[key] = issue.message;
    }
    return { ok: false, message: 'Please fix the highlighted fields.', fieldErrors };
  }
  return parsed.data;
}

export async function createTaxGroupAction(raw: unknown): Promise<TaxActionResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, resolvePermission('products.tax.groups.create'));
  } catch {
    return { ok: false, message: 'You do not have permission to create tax groups.' };
  }

  const parsed = parseUpsertInput(raw);
  if ('ok' in parsed) {
    return parsed;
  }

  try {
    const response = await createTaxGroup(parsed);
    const resourceId = response.resourceId;
    revalidatePath(taxGroupsListPath());
    if (resourceId) {
      revalidatePath(taxGroupDetailPath(resourceId));
    }
    return { ok: true, resourceId };
  } catch (err) {
    return toFineractActionError(err, 'Could not create tax group.');
  }
}

export async function updateTaxGroupAction(
  taxGroupId: string,
  raw: unknown
): Promise<TaxActionResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, resolvePermission('products.tax.groups.update'));
  } catch {
    return { ok: false, message: 'You do not have permission to update tax groups.' };
  }

  const parsed = parseUpsertInput(raw);
  if ('ok' in parsed) {
    return parsed;
  }

  try {
    await updateTaxGroup(taxGroupId, parsed);
    revalidatePath(taxGroupsListPath());
    revalidatePath(taxGroupDetailPath(taxGroupId));
    revalidatePath(taxGroupEditPath(taxGroupId));
    return { ok: true };
  } catch (err) {
    return toFineractActionError(err, 'Could not update tax group.');
  }
}
