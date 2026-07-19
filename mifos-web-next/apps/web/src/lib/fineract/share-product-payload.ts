/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { UpsertShareProductInput } from '@mifos/validation';
import {
  FINERACT_DATE_FORMAT,
  FINERACT_LOCALE,
  normalizeFineractDateField
} from '@/lib/fineract/dates';

/**
 * Build Fineract POST/PUT body from wizard draft.
 *
 * Share products accept `locale` at the root but not `dateFormat` (unlike savings/loan).
 * Field names match the legacy web-app payload (`sharesIssued`, `chargesSelected`,
 * `marketPricePeriods`) which Fineract validates against.
 */
export function buildShareProductPayload(
  input: UpsertShareProductInput
): Record<string, unknown> {
  const { details, currency, terms, settings, marketPrice, charges, accounting } = input;
  const {
    enableLockinPeriod,
    lockinPeriodFrequency,
    lockinPeriodFrequencyType,
    ...settingsFields
  } = settings;

  const payload: Record<string, unknown> = {
    ...details,
    currencyCode: currency.currencyCode,
    digitsAfterDecimal: currency.digitsAfterDecimal,
    inMultiplesOf: currency.inMultiplesOf,
    totalShares: terms.totalShares,
    sharesIssued: terms.sharesIssued,
    unitPrice: terms.unitPrice,
    shareCapital: terms.shareCapital,
    ...settingsFields,
    accountingRule: accounting.accountingRule,
    shareReferenceId: accounting.shareReferenceId,
    shareSuspenseId: accounting.shareSuspenseId,
    shareEquityId: accounting.shareEquityId,
    incomeFromFeeAccountId: accounting.incomeFromFeeAccountId,
    locale: FINERACT_LOCALE
  };

  if (enableLockinPeriod) {
    payload.lockinPeriodFrequency = lockinPeriodFrequency;
    payload.lockinPeriodFrequencyType = lockinPeriodFrequencyType;
  }

  if (accounting.accountingRule === 1) {
    delete payload.shareReferenceId;
    delete payload.shareSuspenseId;
    delete payload.shareEquityId;
    delete payload.incomeFromFeeAccountId;
  }

  const chargeRows = charges.chargeIds.map((id) => ({ id }));
  if (chargeRows.length) {
    payload.chargesSelected = chargeRows;
  }

  const marketPricePeriods = (marketPrice.marketPricePeriods ?? [])
    .map((period) => ({
      fromDate: normalizeFineractDateField(period.fromDate),
      shareValue: period.shareValue,
      dateFormat: FINERACT_DATE_FORMAT,
      locale: FINERACT_LOCALE
    }))
    .filter((period) => period.fromDate && period.shareValue > 0);

  if (marketPricePeriods.length) {
    payload.marketPricePeriods = marketPricePeriods;
  }

  if (currency.inMultiplesOf == null || currency.inMultiplesOf <= 0) {
    delete payload.inMultiplesOf;
  }

  for (const key of Object.keys(payload)) {
    if (payload[key] === '' || payload[key] === undefined) {
      delete payload[key];
    }
  }

  return payload;
}
