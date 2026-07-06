/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** True when a product short name was previously saved — it must not be changed afterward. */
export function isProductShortNameLocked(shortName?: string | null): boolean {
  return Boolean(shortName?.trim());
}

export const PRODUCT_SHORT_NAME_LOCKED_HINT =
  'This short name is used when generating account numbers and cannot be changed after it has been set.';

export const PRODUCT_SHORT_NAME_EDITABLE_HINT =
  'Used in structured account number patterns. Choose carefully — it cannot be changed once saved.';

export function preserveEstablishedProductShortName<
  T extends { details: { shortName: string } }
>(payload: T, existingShortName?: string): T {
  const established = existingShortName?.trim();
  if (!established) {
    return payload;
  }
  return {
    ...payload,
    details: {
      ...payload.details,
      shortName: established
    }
  };
}
