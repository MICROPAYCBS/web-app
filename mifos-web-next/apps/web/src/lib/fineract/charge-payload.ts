/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { UpsertChargeInput } from '@mifos/validation';
import { FINERACT_LOCALE } from '@/lib/fineract/dates';

export function buildChargePayload(input: UpsertChargeInput): Record<string, unknown> {
  const { addFeeFrequency, ...rest } = input;
  const payload: Record<string, unknown> = {
    ...rest,
    locale: FINERACT_LOCALE,
    monthDayFormat: 'dd MMM'
  };

  if (!payload.taxGroupId) {
    delete payload.taxGroupId;
  }
  if (payload.minCap == null) {
    delete payload.minCap;
  }
  if (payload.maxCap == null) {
    delete payload.maxCap;
  }
  if (!addFeeFrequency || input.chargeTimeType !== 9) {
    delete payload.feeFrequency;
    delete payload.feeInterval;
  }
  if (!payload.feeOnMonthDay) {
    delete payload.feeOnMonthDay;
  }
  if (!showChargePaymentMode(input.chargeAppliesTo)) {
    delete payload.chargePaymentMode;
  }
  if (!showIncomeAccountField(input.chargeAppliesTo)) {
    delete payload.incomeAccountId;
  }

  return payload;
}

function showChargePaymentMode(chargeAppliesTo: number): boolean {
  return chargeAppliesTo === 1 || chargeAppliesTo === 5;
}

function showIncomeAccountField(chargeAppliesTo: number): boolean {
  return chargeAppliesTo === 3;
}
