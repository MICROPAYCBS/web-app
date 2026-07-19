'use server';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientAddress } from '@mifos/api-client';
import { assertCan, resolvePermission } from '@mifos/auth';
import {
  clientAddressEntrySchema,
  toFineractActionError,
  type ClientAddressEntry
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import { createClientAddress, getClientAddresses, updateClientAddress } from '@/lib/fineract/client-address';
import { getServerSession } from '@/lib/session/server';

export type ClientAddressActionResult =
  | { ok: true; addresses: FineractClientAddress[] }
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

async function reloadClientAddresses(clientId: string): Promise<FineractClientAddress[]> {
  revalidatePath(`/clients/${clientId}/address`);
  revalidatePath(`/clients/${clientId}/general`);
  return getClientAddresses(clientId);
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
    const addresses = await reloadClientAddresses(clientId);
    return { ok: true, addresses };
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
      isActive: parsed.isActive ?? true,
      ...(parsed.isPrimary !== undefined ? { isPrimary: parsed.isPrimary } : {})
    });
    const addresses = await reloadClientAddresses(clientId);
    return { ok: true, addresses };
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

  if (!Number.isFinite(addressId)) {
    return { ok: false, message: 'Invalid address id for update (expected m_address.id).' };
  }

  try {
    await updateClientAddress(clientId, addressTypeId, { addressId, isActive });
    const addresses = await reloadClientAddresses(clientId);
    return { ok: true, addresses };
  } catch (err) {
    return mapError(err);
  }
}

export async function toggleClientAddressPrimaryAction(
  clientId: string,
  addressTypeId: number,
  addressId: number,
  isPrimary: boolean
): Promise<ClientAddressActionResult> {
  const denied = await requireUpdatePermission();
  if (denied) {
    return denied;
  }

  if (!Number.isFinite(addressId)) {
    return { ok: false, message: 'Invalid address id for update (expected m_address.id).' };
  }

  try {
    const addresses = await getClientAddresses(clientId);
    const target = addresses.find((entry) => entry.addressId === addressId);
    if (!target) {
      return { ok: false, message: 'Address not found.' };
    }
    if (target.isActive === false) {
      return { ok: false, message: 'An inactive address cannot be marked as primary.' };
    }

    await updateClientAddress(clientId, addressTypeId, { addressId, isPrimary });
    const reloaded = await reloadClientAddresses(clientId);
    return { ok: true, addresses: reloaded };
  } catch (err) {
    return mapError(err);
  }
}
