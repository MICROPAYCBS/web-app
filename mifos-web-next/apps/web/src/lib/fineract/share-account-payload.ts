/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  CreateShareAccountInput,
  UpdateShareAccountInput
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

function chargeRows(
  charges: CreateShareAccountInput['charges'] | UpdateShareAccountInput['charges']
): { chargeId: number; amount: number }[] | undefined {
  if (!charges?.length) {
    return undefined;
  }
  return charges.map((row) => ({
    chargeId: row.chargeId,
    amount: row.amount
  }));
}

export function buildShareAccountCreatePayload(
  clientId: string | number,
  input: CreateShareAccountInput
): Record<string, unknown> {
  return stripEmpty({
    clientId: Number(clientId),
    productId: input.productId,
    submittedDate: input.submittedDate,
    externalId: input.externalId || undefined,
    requestedShares: input.requestedShares,
    savingsAccountId: input.savingsAccountId,
    applicationDate: input.applicationDate,
    minimumActivePeriod: input.minimumActivePeriod,
    minimumActivePeriodFrequencyType: input.minimumActivePeriodFrequencyType,
    lockinPeriodFrequency: input.lockinPeriodFrequency,
    lockinPeriodFrequencyType: input.lockinPeriodFrequencyType,
    allowDividendCalculationForInactiveClients:
      input.allowDividendCalculationForInactiveClients === true,
    charges: chargeRows(input.charges),
    locale: FINERACT_LOCALE,
    dateFormat: FINERACT_DATE_FORMAT
  });
}

export function buildShareAccountUpdatePayload(
  input: UpdateShareAccountInput
): Record<string, unknown> {
  return stripEmpty({
    productId: input.productId,
    submittedDate: input.submittedDate,
    externalId: input.externalId || undefined,
    requestedShares: input.requestedShares,
    savingsAccountId: input.savingsAccountId,
    applicationDate: input.applicationDate,
    minimumActivePeriod: input.minimumActivePeriod,
    minimumActivePeriodFrequencyType: input.minimumActivePeriodFrequencyType,
    lockinPeriodFrequency: input.lockinPeriodFrequency,
    lockinPeriodFrequencyType: input.lockinPeriodFrequencyType,
    allowDividendCalculationForInactiveClients:
      input.allowDividendCalculationForInactiveClients === true,
    charges: chargeRows(input.charges),
    locale: FINERACT_LOCALE,
    dateFormat: FINERACT_DATE_FORMAT
  });
}
