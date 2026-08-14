/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { preserveEstablishedProductShortName } from '@/lib/fineract/product-short-name';

export type ProductAccountingMappings = {
  paymentChannelToFundSourceMappings?: { paymentTypeId: number; fundSourceAccountId: number }[];
  feeToIncomeAccountMappings?: { chargeId: number; incomeAccountId: number }[];
  penaltyToIncomeAccountMappings?: { chargeId: number; incomeAccountId: number }[];
};

export type ProductDraftWithAccounting = {
  details: { shortName?: string };
  accounting: ProductAccountingMappings;
};

/** Preserve locked short names before compare/submit. Incomplete mapping rows stay on the draft. */
export function sanitizeProductDraftAccountingMappings<T extends ProductDraftWithAccounting>(
  draft: T,
  lockedShortName?: string
): T {
  return preserveEstablishedProductShortName(
    draft as T & { details: { shortName: string } },
    lockedShortName
  );
}

export function productDraftHasUnsavedChanges<T>(
  current: T,
  baseline: T,
  sanitize: (draft: T, lockedShortName?: string) => T,
  lockedShortName?: string
): boolean {
  return (
    JSON.stringify(sanitize(current, lockedShortName)) !==
    JSON.stringify(sanitize(baseline, lockedShortName))
  );
}
