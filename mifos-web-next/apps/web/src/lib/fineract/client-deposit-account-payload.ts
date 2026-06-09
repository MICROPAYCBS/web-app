/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  CreateClientFixedDepositAccountInput,
  CreateClientRecurringDepositAccountInput,
  CreateClientSavingsAccountInput
} from '@mifos/validation';
import { FINERACT_DATE_FORMAT, FINERACT_LOCALE } from '@/lib/fineract/dates';

function stripEmpty(payload: Record<string, unknown>): Record<string, unknown> {
  for (const key of Object.keys(payload)) {
    if (payload[key] === '' || payload[key] === undefined) {
      delete payload[key];
    }
  }
  return payload;
}

export function buildSavingsAccountPayload(
  clientId: string | number,
  input: CreateClientSavingsAccountInput
): Record<string, unknown> {
  return stripEmpty({
    clientId: Number(clientId),
    productId: input.productId,
    submittedOnDate: input.submittedOnDate,
    externalId: input.externalId,
    fieldOfficerId: input.fieldOfficerId,
    locale: FINERACT_LOCALE,
    dateFormat: FINERACT_DATE_FORMAT
  });
}

export function buildFixedDepositAccountPayload(
  clientId: string | number,
  input: CreateClientFixedDepositAccountInput
): Record<string, unknown> {
  return stripEmpty({
    clientId: Number(clientId),
    productId: input.productId,
    submittedOnDate: input.submittedOnDate,
    depositAmount: input.depositAmount,
    depositPeriod: input.depositPeriod,
    depositPeriodFrequencyId: input.depositPeriodFrequencyId,
    externalId: input.externalId,
    fieldOfficerId: input.fieldOfficerId,
    locale: FINERACT_LOCALE,
    dateFormat: FINERACT_DATE_FORMAT
  });
}

export function buildRecurringDepositAccountPayload(
  clientId: string | number,
  input: CreateClientRecurringDepositAccountInput
): Record<string, unknown> {
  return stripEmpty({
    clientId: Number(clientId),
    productId: input.productId,
    submittedOnDate: input.submittedOnDate,
    depositAmount: input.depositAmount,
    depositPeriod: input.depositPeriod,
    depositPeriodFrequencyId: input.depositPeriodFrequencyId,
    recurringFrequency: input.recurringFrequency,
    recurringFrequencyType: input.recurringFrequencyType,
    mandatoryRecommendedDepositAmount: input.mandatoryRecommendedDepositAmount,
    isCalendarInherited: input.isCalendarInherited,
    externalId: input.externalId,
    fieldOfficerId: input.fieldOfficerId,
    locale: FINERACT_LOCALE,
    dateFormat: FINERACT_DATE_FORMAT
  });
}
