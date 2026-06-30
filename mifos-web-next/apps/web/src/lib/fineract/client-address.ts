/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import 'server-only';

import type { FineractClientAddress, FineractClientAddressTemplate, FineractCommandProcessingResult } from '@mifos/api-client';
import type { ClientAddressEntry } from '@mifos/validation';
import { normalizeClientAddresses } from '@/lib/fineract/client-address-normalize';
import { toClientAddressRequestBody } from '@/lib/fineract/client-address-payload';
import { createFineractClient } from '@/lib/fineract/create-client';

/** Fineract uses singular `/client/` for address APIs (legacy parity). */
export async function getClientAddresses(
  clientId: string | number
): Promise<FineractClientAddress[]> {
  const fineract = await createFineractClient();
  const data = await fineract.get<FineractClientAddress[]>(`/client/${clientId}/addresses`);
  return Array.isArray(data) ? normalizeClientAddresses(data) : [];
}

export async function getClientAddressTemplate(): Promise<FineractClientAddressTemplate> {
  const fineract = await createFineractClient();
  return fineract.get<FineractClientAddressTemplate>('/client/addresses/template');
}

export async function createClientAddress(
  clientId: string | number,
  addressTypeId: number,
  entry: ClientAddressEntry
): Promise<{ resourceId: number }> {
  const fineract = await createFineractClient();
  return fineract.post<{ resourceId: number }>(
    `/client/${clientId}/addresses?type=${addressTypeId}`,
    toClientAddressRequestBody(entry, { includeAddressId: false })
  );
}

export async function updateClientAddress(
  clientId: string | number,
  addressTypeId: number,
  entry: ClientAddressEntry & { addressId: number }
): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.put<FineractCommandProcessingResult>(
    `/client/${clientId}/addresses?type=${addressTypeId}`,
    toClientAddressRequestBody(entry, { includeAddressId: true })
  );
}
