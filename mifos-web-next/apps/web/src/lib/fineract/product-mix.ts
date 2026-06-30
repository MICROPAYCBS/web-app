import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ProductMixCreateTemplate,
  ProductMixDetail,
  ProductMixFormOptions,
  ProductMixListItem,
  ProductMixMutationResponse,
  ProductMixProductOption, FineractCommandProcessingResult } from '@mifos/api-client';
import type { CreateProductMixInput, UpdateProductMixInput } from '@mifos/validation';
import { createFineractClient } from '@/lib/fineract/create-client';

function normalizeProductOption(item: unknown): ProductMixProductOption | null {
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
    includeInBorrowerCycle:
      typeof row.includeInBorrowerCycle === 'boolean'
        ? row.includeInBorrowerCycle
        : undefined
  };
}

function normalizeProductOptions(value: unknown): ProductMixProductOption[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => normalizeProductOption(item))
    .filter((item): item is ProductMixProductOption => item !== null);
}

function normalizeListItem(item: unknown): ProductMixListItem | null {
  if (!item || typeof item !== 'object') {
    return null;
  }
  const row = item as Record<string, unknown>;
  const productId = Number(row.productId);
  if (!Number.isFinite(productId)) {
    return null;
  }
  return {
    productId,
    productName: typeof row.productName === 'string' ? row.productName : undefined,
    restrictedProducts: normalizeProductOptions(row.restrictedProducts),
    allowedProducts: normalizeProductOptions(row.allowedProducts)
  };
}

function normalizeList(value: unknown): ProductMixListItem[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeListItem(item))
      .filter((item): item is ProductMixListItem => item !== null);
  }
  if (value && typeof value === 'object' && 'pageItems' in value) {
    return normalizeList((value as { pageItems?: unknown }).pageItems);
  }
  return [];
}

function normalizeDetail(
  productId: string | number,
  raw: unknown,
  productName?: string
): ProductMixDetail {
  const row = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const resolvedName =
    typeof row.productName === 'string'
      ? row.productName
      : productName;
  return {
    productId: Number(productId),
    productName: resolvedName,
    restrictedProducts: normalizeProductOptions(row.restrictedProducts),
    allowedProducts: normalizeProductOptions(row.allowedProducts)
  };
}

function normalizeFormOptions(raw: unknown): ProductMixFormOptions {
  const row = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    restrictedProducts: normalizeProductOptions(row.restrictedProducts),
    allowedProducts: normalizeProductOptions(row.allowedProducts)
  };
}

export async function listProductMixes(): Promise<ProductMixListItem[]> {
  const fineract = await createFineractClient();
  const data = await fineract.get<unknown>('/loanproducts', {
    associations: 'productMixes'
  });
  return normalizeList(data);
}

export async function getProductMixCreateTemplate(): Promise<ProductMixCreateTemplate> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>('/loanproducts/template', {
    isProductMixTemplate: 'true'
  });
  const row = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    productOptions: normalizeProductOptions(row.productOptions)
  };
}

export async function getProductMixFormOptions(
  productId: string | number
): Promise<ProductMixFormOptions> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`/loanproducts/${productId}/productmix`, {
    template: 'true'
  });
  return normalizeFormOptions(raw);
}

export async function getProductMix(
  productId: string | number,
  productName?: string
): Promise<ProductMixDetail> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`/loanproducts/${productId}/productmix`);
  return normalizeDetail(productId, raw, productName);
}

export async function createProductMix(
  input: CreateProductMixInput
): Promise<ProductMixMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.post<ProductMixMutationResponse>(
    `/loanproducts/${input.productId}/productmix`,
    { restrictedProducts: input.restrictedProducts }
  );
}

export async function updateProductMix(
  productId: string | number,
  input: UpdateProductMixInput
): Promise<ProductMixMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.put<ProductMixMutationResponse>(`/loanproducts/${productId}/productmix`, {
    restrictedProducts: input.restrictedProducts
  });
}

export async function deleteProductMix(productId: string | number): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.delete<FineractCommandProcessingResult>(`/loanproducts/${productId}/productmix`);
}
