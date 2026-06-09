import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  CollateralProductDetail,
  CollateralProductListItem,
  CollateralProductMutationResponse,
  CollateralProductOption,
  CollateralProductTemplate,
  FineractCurrencyOption
} from '@mifos/api-client';
import type { UpsertCollateralProductInput } from '@mifos/validation';
import { FINERACT_LOCALE } from '@/lib/fineract/dates';
import {
  filterCurrencyOptionsBySelected,
  getOrganizationSelectedCurrencies
} from '@/lib/fineract/organization-currencies';
import { createFineractClient } from '@/lib/fineract/create-client';

function asCurrencyOptions(value: unknown): FineractCurrencyOption[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const options: FineractCurrencyOption[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const row = item as Record<string, unknown>;
    const code = typeof row.code === 'string' ? row.code : undefined;
    if (!code) {
      continue;
    }
    options.push({
      code,
      name: typeof row.name === 'string' ? row.name : undefined,
      decimalPlaces:
        typeof row.decimalPlaces === 'number' ? row.decimalPlaces : undefined
    });
  }
  return options;
}

function normalizeListItem(item: unknown): CollateralProductListItem | null {
  if (!item || typeof item !== 'object') {
    return null;
  }
  const row = item as Record<string, unknown>;
  const id = Number(row.id);
  if (!Number.isFinite(id)) {
    return null;
  }
  return {
    id,
    name: typeof row.name === 'string' ? row.name : undefined,
    quality: typeof row.quality === 'string' ? row.quality : undefined,
    unitType: typeof row.unitType === 'string' ? row.unitType : undefined,
    basePrice: typeof row.basePrice === 'number' ? row.basePrice : undefined,
    pctToBase: typeof row.pctToBase === 'number' ? row.pctToBase : undefined,
    currency:
      typeof row.currency === 'string' || (row.currency && typeof row.currency === 'object')
        ? (row.currency as FineractCurrencyOption | string)
        : undefined
  };
}

function normalizeList(value: unknown): CollateralProductListItem[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeListItem(item))
      .filter((item): item is CollateralProductListItem => item !== null);
  }
  if (value && typeof value === 'object' && 'pageItems' in value) {
    const pageItems = (value as { pageItems?: unknown }).pageItems;
    return normalizeList(pageItems);
  }
  return [];
}

export function toCollateralProductOptions(
  items: CollateralProductListItem[]
): CollateralProductOption[] {
  return items
    .filter((item) => typeof item.name === 'string' && item.name.length > 0)
    .map((item) => ({ id: item.id, name: item.name as string }));
}

export async function listCollateralProducts(): Promise<CollateralProductListItem[]> {
  const fineract = await createFineractClient();
  const data = await fineract.get<unknown>('/collateral-management');
  return normalizeList(data);
}

export async function getCollateralProductTemplate(): Promise<CollateralProductTemplate> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>('/collateral-management/template');
  return { currencyOptions: asCurrencyOptions(raw) };
}

/** Template currencies limited to organization-selected currencies. */
export async function getCollateralProductFormTemplate(
  includeCurrencyCode?: string
): Promise<CollateralProductTemplate> {
  const [template, selectedCurrencies] = await Promise.all([
    getCollateralProductTemplate(),
    getOrganizationSelectedCurrencies()
  ]);

  return {
    currencyOptions: filterCurrencyOptionsBySelected(
      template.currencyOptions,
      selectedCurrencies,
      includeCurrencyCode
    )
  };
}

export async function getCollateralProduct(
  collateralId: string | number
): Promise<CollateralProductDetail> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`/collateral-management/${collateralId}`);
  const item = normalizeListItem(raw);
  if (!item) {
    throw new Error('Collateral product not found.');
  }
  return item;
}

function upsertPayload(input: UpsertCollateralProductInput) {
  return {
    name: input.name,
    quality: input.quality,
    unitType: input.unitType,
    basePrice: input.basePrice,
    pctToBase: input.pctToBase,
    currency: input.currency,
    locale: FINERACT_LOCALE
  };
}

export async function createCollateralProduct(
  input: UpsertCollateralProductInput
): Promise<CollateralProductMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.post<CollateralProductMutationResponse>(
    '/collateral-management',
    upsertPayload(input)
  );
}

export async function updateCollateralProduct(
  collateralId: string | number,
  input: UpsertCollateralProductInput
): Promise<CollateralProductMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.put<CollateralProductMutationResponse>(
    `/collateral-management/${collateralId}`,
    upsertPayload(input)
  );
}

export async function deleteCollateralProduct(collateralId: string | number): Promise<void> {
  const fineract = await createFineractClient();
  await fineract.delete(`/collateral-management/${collateralId}`);
}
