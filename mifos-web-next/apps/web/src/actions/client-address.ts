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
  clientAddressEntrySchema,
  toFineractActionError,
  type ClientAddressEntry
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import { createClientAddress, updateClientAddress } from '@/lib/fineract/client-address';
import { getServerSession } from '@/lib/session/server';

export type ClientAddressActionResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

async function requireUpdatePermission(): Promise<ClientAddressActionResult | null> {
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

function parseEntry(raw: unknown): ClientAddressActionResult | ClientAddressEntry {
  const parsed = clientAddressEntrySchema.safeParse(raw);
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

function mapError(err: unknown): ClientAddressActionResult {
  return toFineractActionError(err, 'Request failed.');
}

export async function createClientAddressAction(
  clientId: string,
  raw: unknown
): Promise<ClientAddressActionResult> {
  const denied = await requireUpdatePermission();
  if (denied) {
    return denied;
  }

  const parsed = parseEntry(raw);
  if ('ok' in parsed) {
    return parsed;
  }

  if (!parsed.addressTypeId) {
    return { ok: false, message: 'Address type is required.' };
  }

  try {
    await createClientAddress(clientId, parsed.addressTypeId, parsed);
    revalidatePath(`/clients/${clientId}/address`);
    return { ok: true };
  } catch (err) {
    return mapError(err);
  }
}

export async function updateClientAddressAction(
  clientId: string,
  addressTypeId: number,
  addressId: number,
  raw: unknown
): Promise<ClientAddressActionResult> {
  const denied = await requireUpdatePermission();
  if (denied) {
    return denied;
  }

  const parsed = parseEntry(raw);
  if ('ok' in parsed) {
    return parsed;
  }

  try {
    await updateClientAddress(clientId, addressTypeId, {
      ...parsed,
      addressId,
      isActive: parsed.isActive ?? false
    });
    revalidatePath(`/clients/${clientId}/address`);
    return { ok: true };
  } catch (err) {
    return mapError(err);
  }
}

export async function toggleClientAddressActiveAction(
  clientId: string,
  addressTypeId: number,
  addressId: number,
  isActive: boolean
): Promise<ClientAddressActionResult> {
  const denied = await requireUpdatePermission();
  if (denied) {
    return denied;
  }

  try {
    await updateClientAddress(clientId, addressTypeId, { addressId, isActive });
    revalidatePath(`/clients/${clientId}/address`);
    return { ok: true };
  } catch (err) {
    return mapError(err);
  }
}
