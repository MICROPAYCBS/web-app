/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ClientAddressEntry } from '@mifos/validation';

function stripEmpty<T extends Record<string, unknown>>(obj: T): T {
  const next = { ...obj };
  for (const key of Object.keys(next)) {
    const value = next[key];
    if (value === '' || value === undefined) {
      delete next[key];
    }
  }
  return next;
}

/**
 * Fineract address type is passed as `?type=` on POST/PUT — not in the JSON body.
 * PUT body `addressId` must be `m_address.id`, not `m_client_address.id`.
 * @see legacy web-app `ClientsService.createClientAddress` / `address-tab.component.ts`
 */
export function toClientAddressRequestBody(
  entry: ClientAddressEntry & { addressId?: number },
  options: { includeAddressId?: boolean } = {}
): Record<string, unknown> {
  const { addressTypeId: _type, addressId, ...fields } = entry;
  void _type;

  const body: Record<string, unknown> = stripEmpty({ ...fields });
  if (options.includeAddressId && addressId != null) {
    body.addressId = addressId;
  }
  return body;
}
