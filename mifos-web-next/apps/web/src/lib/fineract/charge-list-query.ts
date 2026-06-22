/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ChargeListItem } from '@mifos/api-client';
import {
  chargeAppliesToLabel,
  chargeCalculationTypeLabel,
  chargeCurrencyCode,
  chargeTimeTypeLabel
} from '@/lib/fineract/charge-display';

/** Category filters applied from the floating sidebar (excludes inline search). */
export type ChargeListFilters = {
  appliesTo?: string;
};

export function countActiveChargeListFilters(filters: ChargeListFilters): number {
  return filters.appliesTo ? 1 : 0;
}

export function filterChargeListItems(
  charges: ChargeListItem[],
  search: string,
  filters: ChargeListFilters
): ChargeListItem[] {
  const q = search.trim().toLowerCase();
  return charges.filter((row) => {
    if (filters.appliesTo && String(row.chargeAppliesTo?.id) !== filters.appliesTo) {
      return false;
    }
    if (!q) {
      return true;
    }
    const haystack = [
      row.name,
      chargeAppliesToLabel(row),
      chargeTimeTypeLabel(row),
      chargeCalculationTypeLabel(row),
      chargeCurrencyCode(row),
      String(row.amount ?? '')
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}
