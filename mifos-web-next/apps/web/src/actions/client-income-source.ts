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
  incomeSourceSchema,
  toFineractActionError,
  type IncomeSourceInput,
  actionSuccessFromFineractCommand
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import {
  createClientIncomeSource,
  deleteClientIncomeSource,
  updateClientIncomeSource
} from '@/lib/fineract/client-income-source';
import { getServerSession } from '@/lib/session/server';

export type ClientIncomeSourceActionResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

async function requireUpdatePermission(): Promise<ClientIncomeSourceActionResult | null> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, resolvePermission('clients.update'));
  } catch {
    return { ok: false, message: 'You do not have permission to update customers.' };
  }
  return null;
}

function parseIncomeSource(raw: unknown): ClientIncomeSourceActionResult | IncomeSourceInput {
  const parsed = incomeSourceSchema.safeParse(raw);
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

export async function createClientIncomeSourceAction(
  clientId: string,
  raw: unknown
): Promise<ClientIncomeSourceActionResult> {
  const denied = await requireUpdatePermission();
  if (denied) {
    return denied;
  }

  const parsed = parseIncomeSource(raw);
  if ('ok' in parsed) {
    return parsed;
  }

  try {
    const response = await createClientIncomeSource(clientId, parsed);
    revalidatePath(`/clients/${clientId}/income-sources`);
    return actionSuccessFromFineractCommand(response, {});
  } catch (err) {
    return toFineractActionError(err, 'Request failed.');
  }
}

export async function updateClientIncomeSourceAction(
  clientId: string,
  incomeSourceId: number,
  raw: unknown
): Promise<ClientIncomeSourceActionResult> {
  const denied = await requireUpdatePermission();
  if (denied) {
    return denied;
  }

  const parsed = parseIncomeSource(raw);
  if ('ok' in parsed) {
    return parsed;
  }

  try {
    const response = await updateClientIncomeSource(clientId, incomeSourceId, parsed);
    revalidatePath(`/clients/${clientId}/income-sources`);
    return actionSuccessFromFineractCommand(response, {});
  } catch (err) {
    return toFineractActionError(err, 'Request failed.');
  }
}

export async function deleteClientIncomeSourceAction(
  clientId: string,
  incomeSourceId: number
): Promise<ClientIncomeSourceActionResult> {
  const denied = await requireUpdatePermission();
  if (denied) {
    return denied;
  }

  try {
    const response = await deleteClientIncomeSource(clientId, incomeSourceId);
    revalidatePath(`/clients/${clientId}/income-sources`);
    return actionSuccessFromFineractCommand(response, {});
  } catch (err) {
    return toFineractActionError(err, 'Request failed.');
  }
}
