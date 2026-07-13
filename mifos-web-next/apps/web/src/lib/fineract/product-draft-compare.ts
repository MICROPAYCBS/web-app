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

export function filterProductMappings<T extends Record<string, number>>(
  rows: T[] | undefined,
  keys: [keyof T, keyof T]
): T[] {
  return (rows ?? []).filter((row) => row[keys[0]] > 0 && row[keys[1]] > 0);
}

/** Drop empty accounting mapping rows and preserve locked short names before compare/submit. */
export function sanitizeProductDraftAccountingMappings<T extends ProductDraftWithAccounting>(
  draft: T,
  lockedShortName?: string
): T {
  const accounting = draft.accounting;
  const withFilteredMappings = {
    ...draft,
    accounting: {
      ...accounting,
      paymentChannelToFundSourceMappings: filterProductMappings(
        accounting.paymentChannelToFundSourceMappings,
        ['paymentTypeId', 'fundSourceAccountId']
      ),
      feeToIncomeAccountMappings: filterProductMappings(accounting.feeToIncomeAccountMappings, [
        'chargeId',
        'incomeAccountId'
      ]),
      penaltyToIncomeAccountMappings: filterProductMappings(
        accounting.penaltyToIncomeAccountMappings,
        ['chargeId', 'incomeAccountId']
      )
    }
  };

  return preserveEstablishedProductShortName(
    withFilteredMappings as T & { details: { shortName: string } },
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
