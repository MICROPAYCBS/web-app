/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import 'server-only';

import type { FineractCommandProcessingResult } from '@mifos/api-client';
import type { LoanCollateralItemInput } from '@mifos/validation';
import type {
  LoanCollateralRecord,
  LoanCollateralTypeOption
} from '@/lib/fineract/loan-account-types';
import { createFineractClient } from '@/lib/fineract/create-client';
import { FINERACT_LOCALE } from '@/lib/fineract/dates';

export type { LoanCollateralRecord, LoanCollateralTypeOption };

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function normalizeCollateral(raw: unknown): LoanCollateralRecord | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  if (!Number.isFinite(id)) {
    return null;
  }
  const type = row.type && typeof row.type === 'object' ? (row.type as Record<string, unknown>) : undefined;
  const currency =
    row.currency && typeof row.currency === 'object'
      ? (row.currency as Record<string, unknown>)
      : undefined;
  return {
    id,
    typeName: typeof type?.name === 'string' ? type.name : undefined,
    description: typeof row.description === 'string' ? row.description : undefined,
    value: toNumber(row.value),
    currencyCode: typeof currency?.code === 'string' ? currency.code : undefined
  };
}

function normalizeTypeOption(raw: unknown): LoanCollateralTypeOption | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const name = typeof row.name === 'string' ? row.name : undefined;
  if (!Number.isFinite(id) || !name) {
    return null;
  }
  return { id, name };
}

export async function getLoanCollaterals(
  accountId: string | number
): Promise<LoanCollateralRecord[]> {
  const fineract = await createFineractClient();
  const data = await fineract.get<unknown>(`/loans/${accountId}/collaterals`);
  if (!Array.isArray(data)) {
    return [];
  }
  return data
    .map((item) => normalizeCollateral(item))
    .filter((item): item is LoanCollateralRecord => item != null);
}

export async function getLoanCollateralTemplate(
  accountId: string | number
): Promise<{ allowedCollateralTypes: LoanCollateralTypeOption[] }> {
  const fineract = await createFineractClient();
  const data = await fineract.get<unknown>(`/loans/${accountId}/collaterals/template`);
  if (!data || typeof data !== 'object') {
    return { allowedCollateralTypes: [] };
  }
  const row = data as Record<string, unknown>;
  const options = Array.isArray(row.allowedCollateralTypes)
    ? row.allowedCollateralTypes
        .map((item) => normalizeTypeOption(item))
        .filter((item): item is LoanCollateralTypeOption => item != null)
    : [];
  return { allowedCollateralTypes: options };
}

export async function createLoanCollateral(
  accountId: string | number,
  input: LoanCollateralItemInput
): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.post<FineractCommandProcessingResult>(`/loans/${accountId}/collaterals`, {
    collateralTypeId: input.collateralTypeId,
    value: input.value,
    description: input.description?.trim() || undefined,
    locale: FINERACT_LOCALE
  });
}
