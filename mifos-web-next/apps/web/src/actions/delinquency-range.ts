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
  createDelinquencyRangeSchema,
  toFineractActionError,
  updateDelinquencyRangeSchema,
  type CreateDelinquencyRangeInput,
  type UpdateDelinquencyRangeInput,
  actionSuccessFromFineractCommand
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import type { DelinquencyActionResult } from '@/lib/fineract/delinquency-action-result';
import {
  createDelinquencyRange,
  deleteDelinquencyRange,
  updateDelinquencyRange
} from '@/lib/fineract/delinquency-ranges';
import {
  delinquencyRangeDetailPath,
  delinquencyRangeEditPath,
  delinquencyRangesListPath
} from '@/lib/fineract/delinquency-paths';
import { getServerSession } from '@/lib/session/server';

function parseFieldErrors(error: { issues: Array<{ path: Array<string | number>; message: string }> }) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === 'string') {
      fieldErrors[key] = issue.message;
    }
  }
  return fieldErrors;
}

function parseCreateInput(raw: unknown): DelinquencyActionResult | CreateDelinquencyRangeInput {
  const parsed = createDelinquencyRangeSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Please fix the highlighted fields.',
      fieldErrors: parseFieldErrors(parsed.error)
    };
  }
  return parsed.data;
}

function parseUpdateInput(raw: unknown): DelinquencyActionResult | UpdateDelinquencyRangeInput {
  const parsed = updateDelinquencyRangeSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Please fix the highlighted fields.',
      fieldErrors: parseFieldErrors(parsed.error)
    };
  }
  return parsed.data;
}

export async function createDelinquencyRangeAction(raw: unknown): Promise<DelinquencyActionResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, resolvePermission('products.delinquency.ranges.create'));
  } catch {
    return { ok: false, message: 'You do not have permission to create delinquency ranges.' };
  }

  const parsed = parseCreateInput(raw);
  if ('ok' in parsed) {
    return parsed;
  }

  try {
    const response = await createDelinquencyRange(parsed);
    const resourceId = response.resourceId;
    revalidatePath(delinquencyRangesListPath());
    if (resourceId) {
      revalidatePath(delinquencyRangeDetailPath(resourceId));
    }
    return actionSuccessFromFineractCommand(response, { resourceId });
  } catch (err) {
    return toFineractActionError(err, 'Could not create delinquency range.');
  }
}

export async function updateDelinquencyRangeAction(
  rangeId: string,
  raw: unknown
): Promise<DelinquencyActionResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, resolvePermission('products.delinquency.ranges.update'));
  } catch {
    return { ok: false, message: 'You do not have permission to update delinquency ranges.' };
  }

  const parsed = parseUpdateInput(raw);
  if ('ok' in parsed) {
    return parsed;
  }

  try {
    const response = await updateDelinquencyRange(rangeId, parsed);
    revalidatePath(delinquencyRangesListPath());
    revalidatePath(delinquencyRangeDetailPath(rangeId));
    revalidatePath(delinquencyRangeEditPath(rangeId));
    return actionSuccessFromFineractCommand(response, {});
  } catch (err) {
    return toFineractActionError(err, 'Could not update delinquency range.');
  }
}

export async function deleteDelinquencyRangeAction(rangeId: string): Promise<DelinquencyActionResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, resolvePermission('products.delinquency.ranges.delete'));
  } catch {
    return { ok: false, message: 'You do not have permission to delete delinquency ranges.' };
  }

  try {
    const response = await deleteDelinquencyRange(rangeId);
    revalidatePath(delinquencyRangesListPath());
    return actionSuccessFromFineractCommand(response, {});
  } catch (err) {
    return toFineractActionError(err, 'Could not delete delinquency range.');
  }
}
