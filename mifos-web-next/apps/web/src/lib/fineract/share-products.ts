import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  ShareProductDetail,
  ShareProductListItem,
  ShareProductMutationResponse,
  ShareProductTemplate
} from '@mifos/api-client';
import { FineractHttpError } from '@mifos/api-client';
import { createFineractClient } from '@/lib/fineract/create-client';
import { normalizeShareProductTemplate } from '@/lib/fineract/share-product-draft';
import { SHARE_PRODUCTS_API_PATH } from '@/lib/fineract/share-product-paths';
import {
  filterProductChargeOptions,
  type FilteredProductChargeOptions,
  type ProductChargeOption
} from '@/lib/fineract/product-charge-options';
import {
  asAccountingMappings,
  asCharges,
  asCurrency,
  asEnumOption,
  listItemCurrencyCode,
  normalizeFineractList
} from '@/lib/fineract/product-normalize';

function normalizeListItem(item: unknown): ShareProductListItem | null {
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
    shortName: typeof row.shortName === 'string' ? row.shortName : undefined,
    totalShares: typeof row.totalShares === 'number' ? row.totalShares : undefined,
    currencyCode: listItemCurrencyCode(row),
    accountingRule: asEnumOption(row.accountingRule)
  };
}

function normalizeMarketPrice(raw: unknown) {
  if (!Array.isArray(raw)) {
    return undefined;
  }
  return raw
    .filter((item) => item && typeof item === 'object')
    .map((item) => {
      const row = item as Record<string, unknown>;
      return {
        fromDate: typeof row.fromDate === 'string' ? row.fromDate : undefined,
        shareValue: typeof row.shareValue === 'number' ? row.shareValue : undefined
      };
    });
}

function marketPriceFromRow(row: Record<string, unknown>) {
  return normalizeMarketPrice(row.marketPrice ?? row.marketPricePeriods);
}

function mergeShareProductForEdit(
  baseTemplate: ShareProductTemplate,
  product: ShareProductDetail
): ShareProductTemplate {
  const productRow = product as unknown as Record<string, unknown>;
  return {
    ...baseTemplate,
    ...productRow,
    id: product.id,
    name: product.name,
    shortName: product.shortName,
    description: product.description,
    currency: product.currency ?? baseTemplate.currency,
    currencyCode: product.currencyCode ?? product.currency?.code ?? baseTemplate.currencyCode,
    totalShares: product.totalShares,
    totalSharesIssued: product.totalSharesIssued,
    unitPrice: product.unitPrice,
    shareCapital: product.shareCapital,
    minimumShares: product.minimumShares,
    nominalShares: product.nominalShares,
    maximumShares: product.maximumShares,
    minimumActivePeriod: product.minimumActivePeriod,
    minimumActivePeriodForDividendsTypeEnum: product.minimumActivePeriodForDividendsTypeEnum,
    lockinPeriod: product.lockinPeriod,
    lockPeriodTypeEnum: product.lockPeriodTypeEnum,
    allowDividendCalculationForInactiveClients: product.allowDividendCalculationForInactiveClients,
    marketPrice: product.marketPrice ?? marketPriceFromRow(productRow),
    charges: (product.charges ?? baseTemplate.charges) as ShareProductTemplate['charges'],
    accountingRule: product.accountingRule ?? baseTemplate.accountingRule,
    accountingMappings: product.accountingMappings ?? baseTemplate.accountingMappings
  };
}

function normalizeDetail(raw: unknown): ShareProductDetail | null {
  const item = normalizeListItem(raw);
  if (!item || !raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  return {
    ...item,
    description: typeof row.description === 'string' ? row.description : undefined,
    currency: asCurrency(row.currency),
    totalSharesIssued:
      typeof row.totalSharesIssued === 'number' ? row.totalSharesIssued : undefined,
    unitPrice: typeof row.unitPrice === 'number' ? row.unitPrice : undefined,
    shareCapital: typeof row.shareCapital === 'number' ? row.shareCapital : undefined,
    minimumShares: typeof row.minimumShares === 'number' ? row.minimumShares : undefined,
    nominalShares: typeof row.nominalShares === 'number' ? row.nominalShares : undefined,
    maximumShares: typeof row.maximumShares === 'number' ? row.maximumShares : undefined,
    minimumActivePeriod:
      typeof row.minimumActivePeriod === 'number' ? row.minimumActivePeriod : undefined,
    minimumActivePeriodForDividendsTypeEnum: asEnumOption(
      row.minimumActivePeriodForDividendsTypeEnum
    ),
    lockinPeriod: typeof row.lockinPeriod === 'number' ? row.lockinPeriod : undefined,
    lockPeriodTypeEnum: asEnumOption(row.lockPeriodTypeEnum),
    allowDividendCalculationForInactiveClients:
      typeof row.allowDividendCalculationForInactiveClients === 'boolean'
        ? row.allowDividendCalculationForInactiveClients
        : undefined,
    marketPrice: normalizeMarketPrice(row.marketPrice ?? row.marketPricePeriods),
    accountingRule: asEnumOption(row.accountingRule),
    accountingMappings: asAccountingMappings(row.accountingMappings),
    charges: asCharges(row.charges)
  };
}

export async function listShareProducts(): Promise<ShareProductListItem[]> {
  const fineract = await createFineractClient();
  const data = await fineract.get<unknown>(SHARE_PRODUCTS_API_PATH);
  return normalizeFineractList(data, normalizeListItem);
}

export async function getShareProduct(productId: string | number): Promise<ShareProductDetail> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`${SHARE_PRODUCTS_API_PATH}/${productId}`);
  const product = normalizeDetail(raw);
  if (!product) {
    throw new Error('Share product not found.');
  }
  return product;
}

export async function getShareProductTemplate(
  options?: { currencyCode?: string }
): Promise<ShareProductTemplate> {
  const fineract = await createFineractClient();
  const params: Record<string, string> = {};
  const currencyCode = options?.currencyCode?.trim();
  if (currencyCode) {
    params.currencyCode = currencyCode;
  }
  const raw = await fineract.get<unknown>(`${SHARE_PRODUCTS_API_PATH}/template`, params);
  return normalizeShareProductTemplate(raw);
}

export async function getShareProductChargeOptions(
  currencyCode: string
): Promise<FilteredProductChargeOptions> {
  const template = await getShareProductTemplate({ currencyCode });
  return filterProductChargeOptions(
    template.chargeOptions as ProductChargeOption[] | undefined,
    template.penaltyOptions as ProductChargeOption[] | undefined,
    currencyCode
  );
}

export async function getShareProductForEdit(
  productId: string | number
): Promise<ShareProductTemplate> {
  const fineract = await createFineractClient();

  try {
    const raw = await fineract.get<unknown>(`${SHARE_PRODUCTS_API_PATH}/${productId}`, {
      template: 'true'
    });
    return normalizeShareProductTemplate(raw);
  } catch (err) {
    if (err instanceof FineractHttpError && err.status === 404) {
      throw err;
    }
  }

  const [baseTemplate, product] = await Promise.all([
    getShareProductTemplate(),
    getShareProduct(productId)
  ]);

  return normalizeShareProductTemplate(mergeShareProductForEdit(baseTemplate, product));
}

export async function createShareProductRecord(
  payload: Record<string, unknown>
): Promise<ShareProductMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.post<ShareProductMutationResponse>(SHARE_PRODUCTS_API_PATH, payload);
}

export async function updateShareProductRecord(
  productId: string | number,
  payload: Record<string, unknown>
): Promise<ShareProductMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.put<ShareProductMutationResponse>(
    `${SHARE_PRODUCTS_API_PATH}/${productId}`,
    payload
  );
}
