/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientAddress } from '@mifos/api-client';

type RawFineractClientAddress = FineractClientAddress & {
  /** Some Gson builds expose {@code isPrimary} as {@code primary}. */
  primary?: boolean;
  /** Must not be used when {@link FineractClientAddress.addressId} is present. */
  id?: number;
};

function readIsPrimary(raw: RawFineractClientAddress): boolean {
  if (raw.isPrimary != null) {
    return Boolean(raw.isPrimary);
  }
  if (raw.primary != null) {
    return Boolean(raw.primary);
  }
  return false;
}

function clientAddressSortKey(address: FineractClientAddress): number {
  return address.clientAddressId ?? address.addressId;
}

/**
 * Fineract lists addresses with {@code ORDER BY is_primary DESC}, which surfaces the
 * primary row first. The UI should keep {@code m_client_address.id} order instead and
 * rely on {@code isPrimary} for the badge/toggle state.
 */
export function sortClientAddressesForDisplay(
  addresses: FineractClientAddress[]
): FineractClientAddress[] {
  return [...addresses].sort((a, b) => clientAddressSortKey(a) - clientAddressSortKey(b));
}

/**
 * Fineract address updates use {@code m_address.id} as {@code addressId}.
 * {@code clientAddressId} is {@code m_client_address.id} and must not be sent as addressId.
 */
export function normalizeClientAddress(raw: FineractClientAddress): FineractClientAddress {
  const rawRecord = raw as RawFineractClientAddress;
  const addressId = raw.addressId ?? rawRecord.id;
  if (addressId == null || Number.isNaN(Number(addressId))) {
    throw new Error('Client address response is missing addressId (m_address.id).');
  }

  return {
    ...raw,
    addressId: Number(addressId),
    clientAddressId:
      raw.clientAddressId != null && !Number.isNaN(Number(raw.clientAddressId))
        ? Number(raw.clientAddressId)
        : undefined,
    isActive: raw.isActive ?? true,
    isPrimary: readIsPrimary(rawRecord)
  };
}

export function normalizeClientAddresses(raw: FineractClientAddress[]): FineractClientAddress[] {
  return sortClientAddressesForDisplay(raw.map(normalizeClientAddress));
}
