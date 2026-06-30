import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ClientCollateralListItem,
  ClientCollateralTemplate,
  CollateralProductDetail,
  CollateralProductOption,
  CreateClientCollateralResponse, FineractCommandProcessingResult } from '@mifos/api-client';
import type { CreateClientCollateralInput } from '@mifos/validation';
import {
  getCollateralProduct,
  listCollateralProducts,
  toCollateralProductOptions
} from '@/lib/fineract/collateral-products';
import { FINERACT_LOCALE } from '@/lib/fineract/dates';
import { createFineractClient } from '@/lib/fineract/create-client';

export { getCollateralProduct };

function asCollateralOptions(value: unknown): CollateralProductOption[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }
      const row = item as Record<string, unknown>;
      const id = Number(row.id);
      const name = typeof row.name === 'string' ? row.name : undefined;
      if (!Number.isFinite(id) || !name) {
        return null;
      }
      return { id, name };
    })
    .filter((item): item is CollateralProductOption => item !== null);
}

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

function normalizeCurrency(value: unknown): ClientCollateralListItem['currency'] {
  if (typeof value === 'string') {
    return value;
  }
  if (value && typeof value === 'object') {
    return value as ClientCollateralListItem['currency'];
  }
  return undefined;
}

function normalizeClientCollateralListItem(value: unknown): ClientCollateralListItem | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const row = value as Record<string, unknown>;
  const id = toNumber(row.id);
  const collateralId = toNumber(row.collateralId);
  if (id === undefined && collateralId === undefined) {
    return null;
  }
  return {
    id,
    collateralId: collateralId ?? id,
    name: typeof row.name === 'string' ? row.name : undefined,
    quantity: toNumber(row.quantity),
    basePrice: toNumber(row.basePrice),
    pctToBase: toNumber(row.pctToBase),
    total: toNumber(row.total),
    totalCollateral: toNumber(row.totalCollateral),
    currency: normalizeCurrency(row.currency)
  };
}

function normalizeClientCollateralList(value: unknown): ClientCollateralListItem[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeClientCollateralListItem(item))
      .filter((item): item is ClientCollateralListItem => item !== null);
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const nestedKeys = ['pageItems', 'collateral', 'clientCollateralData', 'clientCollaterals'];
    for (const key of nestedKeys) {
      if (key in record) {
        return normalizeClientCollateralList(record[key]);
      }
    }
  }
  return [];
}

export async function listClientCollaterals(
  clientId: string | number
): Promise<ClientCollateralListItem[]> {
  const fineract = await createFineractClient();
  const data = await fineract.get<unknown>(`/clients/${clientId}/collaterals`);
  return normalizeClientCollateralList(data);
}

export async function getClientCollateralTemplate(
  clientId: string | number
): Promise<ClientCollateralTemplate> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<ClientCollateralTemplate & Record<string, unknown>>(
    `/clients/${clientId}/collaterals/template`
  );

  let options = asCollateralOptions(raw.collateralOptions);
  if (options.length === 0) {
    options = await listCollateralProductOptions();
  }

  return { collateralOptions: options };
}

export async function listCollateralProductOptions(): Promise<CollateralProductOption[]> {
  const products = await listCollateralProducts();
  return toCollateralProductOptions(products);
}

export async function createClientCollateral(
  clientId: string | number,
  input: CreateClientCollateralInput
): Promise<CreateClientCollateralResponse> {
  const fineract = await createFineractClient();
  return fineract.post<CreateClientCollateralResponse>(`/clients/${clientId}/collaterals`, {
    collateralId: input.collateralId,
    quantity: input.quantity,
    locale: FINERACT_LOCALE
  });
}

export async function deleteClientCollateral(
  clientId: string | number,
  clientCollateralId: string | number
): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.delete<FineractCommandProcessingResult>(`/clients/${clientId}/collaterals/${clientCollateralId}`);
}
