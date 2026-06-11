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
  upsertFloatingRateSchema,
  type UpsertFloatingRateInput
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import type { FloatingRateActionResult } from '@/lib/fineract/floating-rate-action-result';
import {
  floatingRateDetailPath,
  floatingRateEditPath,
  floatingRatesListPath
} from '@/lib/fineract/floating-rate-paths';
import { createFloatingRate, updateFloatingRate } from '@/lib/fineract/floating-rates';
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

function parseUpsertInput(raw: unknown): FloatingRateActionResult | UpsertFloatingRateInput {
  const parsed = upsertFloatingRateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Please fix the highlighted fields.',
      fieldErrors: parseFieldErrors(parsed.error)
    };
  }
  return parsed.data;
}

export async function createFloatingRateAction(raw: unknown): Promise<FloatingRateActionResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, resolvePermission('products.floatingRates.create'));
  } catch {
    return { ok: false, message: 'You do not have permission to create floating rates.' };
  }

  const parsed = parseUpsertInput(raw);
  if ('ok' in parsed) {
    return parsed;
  }

  try {
    const response = await createFloatingRate(parsed);
    const resourceId = response.resourceId;
    revalidatePath(floatingRatesListPath());
    if (resourceId) {
      revalidatePath(floatingRateDetailPath(resourceId));
    }
    return { ok: true, resourceId };
  } catch (err) {
    return toFineractActionError(err, 'Could not create floating rate.');
  }
}

export async function updateFloatingRateAction(
  floatingRateId: string,
  raw: unknown
): Promise<FloatingRateActionResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, resolvePermission('products.floatingRates.update'));
  } catch {
    return { ok: false, message: 'You do not have permission to update floating rates.' };
  }

  const parsed = parseUpsertInput(raw);
  if ('ok' in parsed) {
    return parsed;
  }

  try {
    await updateFloatingRate(floatingRateId, parsed);
    revalidatePath(floatingRatesListPath());
    revalidatePath(floatingRateDetailPath(floatingRateId));
    revalidatePath(floatingRateEditPath(floatingRateId));
    return { ok: true };
  } catch (err) {
    return toFineractActionError(err, 'Could not update floating rate.');
  }
}
