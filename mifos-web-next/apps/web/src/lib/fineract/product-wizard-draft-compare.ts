/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  UpsertDepositProductInput,
  UpsertLoanProductInput,
  UpsertSavingsProductInput,
  UpsertShareProductInput
} from '@mifos/validation';
import {
  productDraftHasUnsavedChanges,
  sanitizeProductDraftAccountingMappings
} from '@/lib/fineract/product-draft-compare';
import { preserveEstablishedProductShortName } from '@/lib/fineract/product-short-name';

export function sanitizeLoanProductDraftForSubmit(
  draft: UpsertLoanProductInput,
  lockedShortName?: string
): UpsertLoanProductInput {
  return sanitizeProductDraftAccountingMappings(draft, lockedShortName);
}

export function loanProductDraftHasUnsavedChanges(
  current: UpsertLoanProductInput,
  baseline: UpsertLoanProductInput,
  lockedShortName?: string
): boolean {
  return productDraftHasUnsavedChanges(
    current,
    baseline,
    sanitizeLoanProductDraftForSubmit,
    lockedShortName
  );
}

export function sanitizeSavingsProductDraftForSubmit(
  draft: UpsertSavingsProductInput,
  lockedShortName?: string
): UpsertSavingsProductInput {
  return sanitizeProductDraftAccountingMappings(draft, lockedShortName);
}

export function savingsProductDraftHasUnsavedChanges(
  current: UpsertSavingsProductInput,
  baseline: UpsertSavingsProductInput,
  lockedShortName?: string
): boolean {
  return productDraftHasUnsavedChanges(
    current,
    baseline,
    sanitizeSavingsProductDraftForSubmit,
    lockedShortName
  );
}

export function sanitizeDepositProductDraftForSubmit(
  draft: UpsertDepositProductInput,
  lockedShortName?: string
): UpsertDepositProductInput {
  return sanitizeProductDraftAccountingMappings(draft, lockedShortName);
}

export function depositProductDraftHasUnsavedChanges(
  current: UpsertDepositProductInput,
  baseline: UpsertDepositProductInput,
  lockedShortName?: string
): boolean {
  return productDraftHasUnsavedChanges(
    current,
    baseline,
    sanitizeDepositProductDraftForSubmit,
    lockedShortName
  );
}

export function sanitizeShareProductDraftForSubmit(
  draft: UpsertShareProductInput,
  lockedShortName?: string
): UpsertShareProductInput {
  const marketPricePeriods = (draft.marketPrice.marketPricePeriods ?? []).filter(
    (row) => row.fromDate?.trim() && row.shareValue > 0
  );

  return preserveEstablishedProductShortName(
    {
      ...draft,
      marketPrice: { marketPricePeriods }
    },
    lockedShortName
  );
}

export function shareProductDraftHasUnsavedChanges(
  current: UpsertShareProductInput,
  baseline: UpsertShareProductInput,
  lockedShortName?: string
): boolean {
  return productDraftHasUnsavedChanges(
    current,
    baseline,
    sanitizeShareProductDraftForSubmit,
    lockedShortName
  );
}
