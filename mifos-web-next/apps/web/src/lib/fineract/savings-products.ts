import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  SavingsProductDetail,
  SavingsProductListItem,
  SavingsProductMutationResponse,
  SavingsProductTemplate
} from '@mifos/api-client';
import { createFineractClient } from '@/lib/fineract/create-client';
import { normalizeSavingsProductTemplate } from '@/lib/fineract/savings-product-draft';
import { SAVINGS_PRODUCTS_API_PATH } from '@/lib/fineract/savings-product-paths';
import { filterProductChargeOptions, type FilteredProductChargeOptions } from '@/lib/fineract/product-charge-options';
import {
  asAccountingMappings,
  asChargeIncomeMappings,
  asCharges,
  asCurrency,
  asEnumOption,
  asPaymentChannelMappings,
  listItemCurrencyCode,
  normalizeFineractList
} from '@/lib/fineract/product-normalize';

function normalizeListItem(item: unknown): SavingsProductListItem | null {
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
    currencyCode: listItemCurrencyCode(row),
    accountingRule: asEnumOption(row.accountingRule)
  };
}

function normalizeDetail(raw: unknown): SavingsProductDetail | null {
  const item = normalizeListItem(raw);
  if (!item || !raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  return {
    ...item,
    description: typeof row.description === 'string' ? row.description : undefined,
    currency: asCurrency(row.currency),
    nominalAnnualInterestRate:
      typeof row.nominalAnnualInterestRate === 'number'
        ? row.nominalAnnualInterestRate
        : undefined,
    interestCompoundingPeriodType: asEnumOption(row.interestCompoundingPeriodType),
    interestPostingPeriodType: asEnumOption(row.interestPostingPeriodType),
    interestCalculationType: asEnumOption(row.interestCalculationType),
    interestCalculationDaysInYearType: asEnumOption(row.interestCalculationDaysInYearType),
    minRequiredOpeningBalance:
      typeof row.minRequiredOpeningBalance === 'number'
        ? row.minRequiredOpeningBalance
        : undefined,
    lockinPeriodFrequency:
      typeof row.lockinPeriodFrequency === 'number' ? row.lockinPeriodFrequency : undefined,
    lockinPeriodFrequencyType: asEnumOption(row.lockinPeriodFrequencyType),
    withdrawalFeeForTransfers:
      typeof row.withdrawalFeeForTransfers === 'boolean'
        ? row.withdrawalFeeForTransfers
        : undefined,
    allowOverdraft: typeof row.allowOverdraft === 'boolean' ? row.allowOverdraft : undefined,
    overdraftLimit: typeof row.overdraftLimit === 'number' ? row.overdraftLimit : undefined,
    minBalanceForInterestCalculation:
      typeof row.minBalanceForInterestCalculation === 'number'
        ? row.minBalanceForInterestCalculation
        : undefined,
    accountingRule: asEnumOption(row.accountingRule),
    accountingMappings: asAccountingMappings(row.accountingMappings),
    charges: asCharges(row.charges),
    feeToIncomeAccountMappings: asChargeIncomeMappings(row.feeToIncomeAccountMappings),
    penaltyToIncomeAccountMappings: asChargeIncomeMappings(
      row.penaltyToIncomeAccountMappings
    ),
    paymentChannelToFundSourceMappings: asPaymentChannelMappings(
      row.paymentChannelToFundSourceMappings
    )
  };
}

export async function listSavingsProducts(): Promise<SavingsProductListItem[]> {
  const fineract = await createFineractClient();
  const data = await fineract.get<unknown>(SAVINGS_PRODUCTS_API_PATH);
  return normalizeFineractList(data, normalizeListItem);
}

export async function getSavingsProduct(
  productId: string | number
): Promise<SavingsProductDetail> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`${SAVINGS_PRODUCTS_API_PATH}/${productId}`);
  const product = normalizeDetail(raw);
  if (!product) {
    throw new Error('Savings product not found.');
  }
  return product;
}

export async function getSavingsProductTemplate(
  options?: { currencyCode?: string }
): Promise<SavingsProductTemplate> {
  const fineract = await createFineractClient();
  const params: Record<string, string> = {};
  const currencyCode = options?.currencyCode?.trim();
  if (currencyCode) {
    params.currencyCode = currencyCode;
  }
  const raw = await fineract.get<unknown>(`${SAVINGS_PRODUCTS_API_PATH}/template`, params);
  return normalizeSavingsProductTemplate(raw);
}

export async function getSavingsProductChargeOptions(
  currencyCode: string
): Promise<FilteredProductChargeOptions> {
  const template = await getSavingsProductTemplate({ currencyCode });
  return filterProductChargeOptions(
    template.chargeOptions,
    template.penaltyOptions,
    currencyCode
  );
}

export async function getSavingsProductForEdit(
  productId: string | number
): Promise<SavingsProductTemplate> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`${SAVINGS_PRODUCTS_API_PATH}/${productId}`, {
    template: 'true'
  });
  return normalizeSavingsProductTemplate(raw);
}

export async function createSavingsProductRecord(
  payload: Record<string, unknown>
): Promise<SavingsProductMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.post<SavingsProductMutationResponse>(SAVINGS_PRODUCTS_API_PATH, payload);
}

export async function updateSavingsProductRecord(
  productId: string | number,
  payload: Record<string, unknown>
): Promise<SavingsProductMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.put<SavingsProductMutationResponse>(
    `${SAVINGS_PRODUCTS_API_PATH}/${productId}`,
    payload
  );
}
