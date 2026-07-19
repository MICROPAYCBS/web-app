/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractOfficeListItem } from '@mifos/api-client';

/** Resolve the Fineract office hierarchy path (for example "." for head office). */
export function resolveOfficeHierarchy(
  officeId: number,
  offices: FineractOfficeListItem[]
): string | null {
  const office = offices.find((row) => row.id === officeId);
  const hierarchy = office?.hierarchy?.trim();
  return hierarchy ? hierarchy : null;
}

/**
 * Fineract scopes clients to a branch and its descendants with `underHierarchy`,
 * not with an exact `officeId` match.
 */
export function clientListParamsForOfficeScope(
  officeId: number | null,
  hierarchy: string | null
): Record<string, string> {
  if (officeId == null) {
    return {};
  }
  if (hierarchy) {
    return { underHierarchy: hierarchy };
  }
  return { officeId: String(officeId) };
}
