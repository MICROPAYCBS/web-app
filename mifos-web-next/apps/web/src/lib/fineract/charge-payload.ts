/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { UpsertChargeInput } from '@mifos/validation';
import { FINERACT_LOCALE } from '@/lib/fineract/dates';

const MONTH_DAY_FORMAT = 'dd MMM';

/** Locale-friendly decimal string for Fineract BigDecimal extraction. */
function fineractDecimal(value: number): string {
  return String(value);
}

export function buildChargePayload(input: UpsertChargeInput): Record<string, unknown> {
  const useChargeTiers = input.useChargeTiers === true;
  const chargeTiers = Array.isArray(input.chargeTiers) ? input.chargeTiers : [];
  const time = input.chargeTimeType;

  const payload: Record<string, unknown> = {
    name: input.name,
    currencyCode: input.currencyCode,
    chargeAppliesTo: input.chargeAppliesTo,
    chargeTimeType: time,
    chargeCalculationType: input.chargeCalculationType,
    amount: useChargeTiers ? '0' : fineractDecimal(input.amount),
    active: input.active,
    penalty: input.penalty,
    useChargeTiers,
    locale: FINERACT_LOCALE
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
      if (tier.amountRangeTo != null) {
        row.amountRangeTo = fineractDecimal(tier.amountRangeTo);
      }
      return row;
    });
  } else if (input.chargeCalculationType === 2 || input.chargeCalculationType === 5) {
    if (input.minCap != null) {
      payload.minCap = fineractDecimal(input.minCap);
    }
    if (input.maxCap != null) {
      payload.maxCap = fineractDecimal(input.maxCap);
    }
  }

  if ((time === 6 || time === 7) && input.feeOnMonthDay?.trim()) {
    payload.feeOnMonthDay = input.feeOnMonthDay.trim();
    payload.monthDayFormat = MONTH_DAY_FORMAT;
  }

  if (time === 7 && input.feeInterval != null) {
    payload.feeInterval = input.feeInterval;
  } else if (time === 11 && input.feeInterval != null) {
    payload.feeInterval = input.feeInterval;
  } else if (input.addFeeFrequency && time === 9) {
    if (input.feeFrequency != null) {
      payload.feeFrequency = input.feeFrequency;
    }
    if (input.feeInterval != null) {
      payload.feeInterval = input.feeInterval;
    }
  }

  if (input.chargeAppliesTo === 1 && input.chargePaymentMode != null) {
    payload.chargePaymentMode = input.chargePaymentMode;
  }

  if (input.chargeAppliesTo === 3 && input.incomeAccountId != null) {
    payload.incomeAccountId = input.incomeAccountId;
  }

  if (input.chargeAppliesTo === 2) {
    const freeWithdrawal = input.enableFreeWithdrawalCharge === true;
    const paymentType = input.enablePaymentType === true;
    if (freeWithdrawal || paymentType) {
      payload.enableFreeWithdrawalCharge = freeWithdrawal;
    }
    if (freeWithdrawal) {
      payload.freeWithdrawalFrequency = input.freeWithdrawalFrequency;
      payload.restartCountFrequency = input.restartCountFrequency;
      payload.countFrequencyType = input.countFrequencyType;
    }
    if (paymentType) {
      payload.enablePaymentType = true;
      payload.paymentTypeId = input.paymentTypeId;
    }
  }

  return payload;
}
