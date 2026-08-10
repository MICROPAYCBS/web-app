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
  upsertChargeSchema,
  actionSuccessFromFineractCommand
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import type { ChargeActionResult } from '@/lib/fineract/charge-action-result';
import { chargeDetailPath, chargeListPath } from '@/lib/fineract/charge-paths';
import {
  createChargeRecord,
  deleteChargeRecord,
  updateChargeRecord
} from '@/lib/fineract/charges';
import { getServerSession } from '@/lib/session/server';

/** Accept plain objects or JSON strings (avoids Flight dropping nested chargeTiers). */
function coerceRawPayload(raw: unknown): unknown {
  if (typeof raw !== 'string') {
    return raw;
  }
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return raw;
  }
}

function parseInput(raw: unknown): ChargeActionResult | ReturnType<typeof upsertChargeSchema.parse> {
  const parsed = upsertChargeSchema.safeParse(coerceRawPayload(raw));
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

export async function createChargeAction(raw: unknown): Promise<ChargeActionResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, resolvePermission('products.charges.create'));
  } catch {
    return { ok: false, message: 'You do not have permission to create charges.' };
  }

  const parsed = parseInput(raw);
  if ('ok' in parsed) {
    return parsed;
  }

  try {
    const response = await createChargeRecord(parsed);
    revalidatePath(chargeListPath());
    if (response.resourceId) {
      revalidatePath(chargeDetailPath(response.resourceId));
    }
    return actionSuccessFromFineractCommand(response, { resourceId: response.resourceId });
  } catch (err) {
    return toFineractActionError(err, 'Could not create charge.');
  }
}

export async function updateChargeAction(
  chargeId: string,
  raw: unknown
): Promise<ChargeActionResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, resolvePermission('products.charges.update'));
  } catch {
    return { ok: false, message: 'You do not have permission to update charges.' };
  }

  const parsed = parseInput(raw);
  if ('ok' in parsed) {
    return parsed;
  }

  try {
    const response = await updateChargeRecord(chargeId, parsed);
    revalidatePath(chargeListPath());
    revalidatePath(chargeDetailPath(chargeId));
    revalidatePath(`${chargeDetailPath(chargeId)}/edit`);
    return actionSuccessFromFineractCommand(response, { resourceId: Number(chargeId) });
  } catch (err) {
    return toFineractActionError(err, 'Could not update charge.');
  }
}

export async function deleteChargeAction(chargeId: string): Promise<ChargeActionResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, resolvePermission('products.charges.delete'));
  } catch {
    return { ok: false, message: 'You do not have permission to delete charges.' };
  }

  try {
    const response = await deleteChargeRecord(chargeId);
    revalidatePath(chargeListPath());
    return actionSuccessFromFineractCommand(response, {});
  } catch (err) {
    return toFineractActionError(err, 'Could not delete charge.');
  }
}
