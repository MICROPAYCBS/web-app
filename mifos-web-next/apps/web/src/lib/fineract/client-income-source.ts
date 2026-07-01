/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import 'server-only';

import type { FineractClientIncomeSource, FineractIncomeSourceOptions, FineractCommandProcessingResult } from '@mifos/api-client';
import type { IncomeSourceInput } from '@mifos/validation';
import { FINERACT_DATE_FORMAT, FINERACT_LOCALE } from '@/lib/fineract/dates';
import { createFineractClient } from '@/lib/fineract/create-client';

function stripEmpty<T extends Record<string, unknown>>(obj: T): T {
  const next = { ...obj };
  for (const key of Object.keys(next)) {
    const value = next[key];
    if (value === '' || value === undefined) {
      delete next[key];
    }
  }
  return next;
}

function toIncomeSourceBody(input: IncomeSourceInput): Record<string, unknown> {
  return stripEmpty({
    ...input,
    dateFormat: input.dateFormat ?? FINERACT_DATE_FORMAT,
    locale: input.locale ?? FINERACT_LOCALE
  });
}

export async function getClientIncomeSourceTemplate(
  clientId: string | number
): Promise<FineractIncomeSourceOptions> {
  const fineract = await createFineractClient();
  const data = await fineract.get<FineractIncomeSourceOptions>(
    `/clients/${clientId}/incomesources/template`
  );
  return data ?? {};
}

export async function getClientIncomeSources(
  clientId: string | number
): Promise<FineractClientIncomeSource[]> {
  const fineract = await createFineractClient();
  const data = await fineract.get<FineractClientIncomeSource[]>(
    `/clients/${clientId}/incomesources`
  );
  return Array.isArray(data) ? data : [];
}

export async function createClientIncomeSource(
  clientId: string | number,
  input: IncomeSourceInput
): Promise<{ resourceId: number }> {
  const fineract = await createFineractClient();
  return fineract.post<{ resourceId: number }>(
    `/clients/${clientId}/incomesources`,
    toIncomeSourceBody(input)
  );
}

export async function updateClientIncomeSource(
  clientId: string | number,
  incomeSourceId: number,
  input: IncomeSourceInput
): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.put<FineractCommandProcessingResult>(`/clients/${clientId}/incomesources/${incomeSourceId}`, toIncomeSourceBody(input));
}

export async function deleteClientIncomeSource(
  clientId: string | number,
  incomeSourceId: number
): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.delete<FineractCommandProcessingResult>(`/clients/${clientId}/incomesources/${incomeSourceId}`);
}
