/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { UpsertChargeInput } from '@mifos/validation';
import { FINERACT_LOCALE } from '@/lib/fineract/dates';

/** Locale-friendly decimal string for Fineract BigDecimal extraction. */
function fineractDecimal(value: number): string {
  return String(value);
}

export function buildChargePayload(input: UpsertChargeInput): Record<string, unknown> {
  const useChargeTiers = input.useChargeTiers === true;
  const chargeTiers = Array.isArray(input.chargeTiers) ? input.chargeTiers : [];

  const payload: Record<string, unknown> = {
    name: input.name,
    currencyCode: input.currencyCode,
    chargeAppliesTo: input.chargeAppliesTo,
    chargeTimeType: input.chargeTimeType,
    chargeCalculationType: input.chargeCalculationType,
    // Fineract charge APIs expect locale-aware decimal strings.
    amount: useChargeTiers ? '0' : fineractDecimal(input.amount),
    active: input.active,
    penalty: input.penalty,
    useChargeTiers,
    locale: FINERACT_LOCALE,
    monthDayFormat: 'dd MMM'
  };

  if (input.taxGroupId) {
    payload.taxGroupId = input.taxGroupId;
  }

  if (useChargeTiers) {
    payload.chargeTiers = chargeTiers.map((tier) => {
      const row: Record<string, unknown> = {
        amountRangeFrom: fineractDecimal(tier.amountRangeFrom),
        amount: fineractDecimal(tier.amount)
      };
      // Omit open-ended upper bound (null) — matches Fineract integration fixtures.
      if (tier.amountRangeTo != null) {
        row.amountRangeTo = fineractDecimal(tier.amountRangeTo);
      }
      return row;
    });
  } else {
    if (input.minCap != null) {
      payload.minCap = fineractDecimal(input.minCap);
    }
    if (input.maxCap != null) {
      payload.maxCap = fineractDecimal(input.maxCap);
    }
  }

  if (input.addFeeFrequency && input.chargeTimeType === 9) {
    if (input.feeFrequency != null) {
      payload.feeFrequency = input.feeFrequency;
    }
    if (input.feeInterval != null) {
      payload.feeInterval = input.feeInterval;
    }
  }

  if (input.feeOnMonthDay) {
    payload.feeOnMonthDay = input.feeOnMonthDay;
  }

  if (showChargePaymentMode(input.chargeAppliesTo) && input.chargePaymentMode != null) {
    payload.chargePaymentMode = input.chargePaymentMode;
  }

  if (showIncomeAccountField(input.chargeAppliesTo) && input.incomeAccountId != null) {
    payload.incomeAccountId = input.incomeAccountId;
  }

  return payload;
}

function showChargePaymentMode(chargeAppliesTo: number): boolean {
  return chargeAppliesTo === 1 || chargeAppliesTo === 5;
}

function showIncomeAccountField(chargeAppliesTo: number): boolean {
  return chargeAppliesTo === 3;
}
