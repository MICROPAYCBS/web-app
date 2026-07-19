import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  DepositProductDetail,
  DepositProductKind,
  DepositProductListItem,
  DepositProductMutationResponse,
  DepositProductTemplate
} from '@mifos/api-client';
import { FineractHttpError } from '@mifos/api-client';
import { depositProductConfig } from '@/lib/fineract/deposit-product-config';
import {
  filterProductChargeOptions,
  type FilteredProductChargeOptions
} from '@/lib/fineract/product-charge-options';
import { createFineractClient } from '@/lib/fineract/create-client';
import { normalizeDepositProductTemplate } from '@/lib/fineract/deposit-product-draft';
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

function normalizeListItem(item: unknown): DepositProductListItem | null {
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

function normalizeDetail(raw: unknown): DepositProductDetail | null {
  const item = normalizeListItem(raw);
  if (!item || !raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  return {
    ...item,
    description: typeof row.description === 'string' ? row.description : undefined,
    currency: asCurrency(row.currency),
    minDepositAmount:
      typeof row.minDepositAmount === 'number' ? row.minDepositAmount : undefined,
    depositAmount: typeof row.depositAmount === 'number' ? row.depositAmount : undefined,
    maxDepositAmount:
      typeof row.maxDepositAmount === 'number' ? row.maxDepositAmount : undefined,
    interestCompoundingPeriodType: asEnumOption(row.interestCompoundingPeriodType),
    interestPostingPeriodType: asEnumOption(row.interestPostingPeriodType),
    interestCalculationType: asEnumOption(row.interestCalculationType),
    interestCalculationDaysInYearType: asEnumOption(row.interestCalculationDaysInYearType),
    isMandatoryDeposit:
      typeof row.isMandatoryDeposit === 'boolean' ? row.isMandatoryDeposit : undefined,
    adjustAdvanceTowardsFuturePayments:
      typeof row.adjustAdvanceTowardsFuturePayments === 'boolean'
        ? row.adjustAdvanceTowardsFuturePayments
        : undefined,
    allowWithdrawal: typeof row.allowWithdrawal === 'boolean' ? row.allowWithdrawal : undefined,
    lockinPeriodFrequency:
      typeof row.lockinPeriodFrequency === 'number' ? row.lockinPeriodFrequency : undefined,
    lockinPeriodFrequencyType: asEnumOption(row.lockinPeriodFrequencyType),
    minDepositTerm: typeof row.minDepositTerm === 'number' ? row.minDepositTerm : undefined,
    minDepositTermType: asEnumOption(row.minDepositTermType),
    inMultiplesOfDepositTerm:
      typeof row.inMultiplesOfDepositTerm === 'number' ? row.inMultiplesOfDepositTerm : undefined,
    inMultiplesOfDepositTermType: asEnumOption(row.inMultiplesOfDepositTermType),
    maxDepositTerm: typeof row.maxDepositTerm === 'number' ? row.maxDepositTerm : undefined,
    maxDepositTermType: asEnumOption(row.maxDepositTermType),
    preClosurePenalApplicable:
      typeof row.preClosurePenalApplicable === 'boolean'
        ? row.preClosurePenalApplicable
        : undefined,
    preClosurePenalInterest:
      typeof row.preClosurePenalInterest === 'number' ? row.preClosurePenalInterest : undefined,
    preClosurePenalInterestOnType: asEnumOption(row.preClosurePenalInterestOnType),
    withHoldTax: typeof row.withHoldTax === 'boolean' ? row.withHoldTax : undefined,
    taxGroup: asEnumOption(row.taxGroup),
    activeChart: row.activeChart as DepositProductDetail['activeChart'],
    accountingRule: asEnumOption(row.accountingRule),
    accountingMappings: asAccountingMappings(row.accountingMappings),
    charges: asCharges(row.charges),
    feeToIncomeAccountMappings: asChargeIncomeMappings(row.feeToIncomeAccountMappings),
    penaltyToIncomeAccountMappings: asChargeIncomeMappings(row.penaltyToIncomeAccountMappings),
    paymentChannelToFundSourceMappings: asPaymentChannelMappings(
      row.paymentChannelToFundSourceMappings
    )
  };
}

function mergeDepositProductForEdit(
  baseTemplate: DepositProductTemplate,
  product: DepositProductDetail
): DepositProductTemplate {
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
    minDepositAmount: product.minDepositAmount,
    depositAmount: product.depositAmount,
    maxDepositAmount: product.maxDepositAmount,
    interestCompoundingPeriodType:
      product.interestCompoundingPeriodType ?? baseTemplate.interestCompoundingPeriodType,
    interestPostingPeriodType:
      product.interestPostingPeriodType ?? baseTemplate.interestPostingPeriodType,
    interestCalculationType:
      product.interestCalculationType ?? baseTemplate.interestCalculationType,
    interestCalculationDaysInYearType:
      product.interestCalculationDaysInYearType ??
      baseTemplate.interestCalculationDaysInYearType,
    isMandatoryDeposit: product.isMandatoryDeposit,
    adjustAdvanceTowardsFuturePayments: product.adjustAdvanceTowardsFuturePayments,
    allowWithdrawal: product.allowWithdrawal,
    lockinPeriodFrequency: product.lockinPeriodFrequency,
    lockinPeriodFrequencyType:
      product.lockinPeriodFrequencyType ?? baseTemplate.lockinPeriodFrequencyType,
    minDepositTerm: product.minDepositTerm,
    minDepositTermType: product.minDepositTermType ?? baseTemplate.minDepositTermType,
    inMultiplesOfDepositTerm: product.inMultiplesOfDepositTerm,
    inMultiplesOfDepositTermType:
      product.inMultiplesOfDepositTermType ?? baseTemplate.inMultiplesOfDepositTermType,
    maxDepositTerm: product.maxDepositTerm,
    maxDepositTermType: product.maxDepositTermType ?? baseTemplate.maxDepositTermType,
    preClosurePenalApplicable: product.preClosurePenalApplicable,
    preClosurePenalInterest: product.preClosurePenalInterest,
    preClosurePenalInterestOnType:
      product.preClosurePenalInterestOnType ?? baseTemplate.preClosurePenalInterestOnType,
    withHoldTax: product.withHoldTax,
    taxGroup: product.taxGroup ?? baseTemplate.taxGroup,
    activeChart: product.activeChart ?? baseTemplate.activeChart,
    charges: (product.charges ?? baseTemplate.charges) as DepositProductTemplate['charges'],
    accountingRule: product.accountingRule ?? baseTemplate.accountingRule,
    accountingMappings: product.accountingMappings ?? baseTemplate.accountingMappings,
    paymentChannelToFundSourceMappings:
      product.paymentChannelToFundSourceMappings ??
      baseTemplate.paymentChannelToFundSourceMappings,
    feeToIncomeAccountMappings:
      product.feeToIncomeAccountMappings ?? baseTemplate.feeToIncomeAccountMappings,
    penaltyToIncomeAccountMappings:
      product.penaltyToIncomeAccountMappings ?? baseTemplate.penaltyToIncomeAccountMappings
  };
}

export async function listDepositProducts(
  kind: DepositProductKind
): Promise<DepositProductListItem[]> {
  const fineract = await createFineractClient();
  const apiPath = depositProductConfig(kind).apiPath;
  const data = await fineract.get<unknown>(apiPath);
  return normalizeFineractList(data, normalizeListItem);
}

export async function getDepositProduct(
  kind: DepositProductKind,
  productId: string | number
): Promise<DepositProductDetail> {
  const fineract = await createFineractClient();
  const apiPath = depositProductConfig(kind).apiPath;
  const raw = await fineract.get<unknown>(`${apiPath}/${productId}`);
  const product = normalizeDetail(raw);
  if (!product) {
    throw new Error('Deposit product not found.');
  }
  return product;
}

export async function getDepositProductTemplate(
  kind: DepositProductKind,
  options?: { currencyCode?: string }
): Promise<DepositProductTemplate> {
  const fineract = await createFineractClient();
  const apiPath = depositProductConfig(kind).apiPath;
  const params: Record<string, string> = {};
  const currencyCode = options?.currencyCode?.trim();
  if (currencyCode) {
    params.currencyCode = currencyCode;
  }
  const raw = await fineract.get<unknown>(`${apiPath}/template`, params);
  return normalizeDepositProductTemplate(raw);
}

export async function getDepositProductChargeOptions(
  kind: DepositProductKind,
  currencyCode: string
): Promise<FilteredProductChargeOptions> {
  const template = await getDepositProductTemplate(kind, { currencyCode });
  return filterProductChargeOptions(
    template.chargeOptions,
    template.penaltyOptions,
    currencyCode
  );
}

export async function getDepositProductForEdit(
  kind: DepositProductKind,
  productId: string | number
): Promise<DepositProductTemplate> {
  const fineract = await createFineractClient();
  const apiPath = depositProductConfig(kind).apiPath;

  try {
    const raw = await fineract.get<unknown>(`${apiPath}/${productId}`, {
      template: 'true'
    });
    return normalizeDepositProductTemplate(raw);
  } catch (err) {
    if (err instanceof FineractHttpError && err.status === 404) {
      throw err;
    }
  }

  const [baseTemplate, product] = await Promise.all([
    getDepositProductTemplate(kind),
    getDepositProduct(kind, productId)
  ]);

  return normalizeDepositProductTemplate(mergeDepositProductForEdit(baseTemplate, product));
}

export async function createDepositProductRecord(
  kind: DepositProductKind,
  payload: Record<string, unknown>
): Promise<DepositProductMutationResponse> {
  const fineract = await createFineractClient();
  const apiPath = depositProductConfig(kind).apiPath;
  return fineract.post<DepositProductMutationResponse>(apiPath, payload);
}

export async function updateDepositProductRecord(
  kind: DepositProductKind,
  productId: string | number,
  payload: Record<string, unknown>
): Promise<DepositProductMutationResponse> {
  const fineract = await createFineractClient();
  const apiPath = depositProductConfig(kind).apiPath;
  return fineract.put<DepositProductMutationResponse>(`${apiPath}/${productId}`, payload);
}
