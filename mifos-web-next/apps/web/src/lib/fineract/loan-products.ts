import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  LoanProductDetail,
  LoanProductKind,
  LoanProductListItem,
  LoanProductMutationResponse,
  LoanProductTemplate
} from '@mifos/api-client';
import { createFineractClient } from '@/lib/fineract/create-client';
import { loanProductApiPath } from '@/lib/fineract/loan-product-paths';
import { filterProductChargeOptions, type FilteredProductChargeOptions } from '@/lib/fineract/product-charge-options';
import { normalizeLoanProductTemplate } from '@/lib/fineract/loan-product-draft';
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

function normalizeListItem(item: unknown): LoanProductListItem | null {
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
    closeDate: typeof row.closeDate === 'string' ? row.closeDate : undefined,
    status: typeof row.status === 'string' ? row.status : undefined,
    currencyCode: listItemCurrencyCode(row),
    accountingRule: asEnumOption(row.accountingRule)
  };
}

function normalizeDetail(raw: unknown): LoanProductDetail | null {
  const item = normalizeListItem(raw);
  if (!item || !raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  return {
    ...item,
    description: typeof row.description === 'string' ? row.description : undefined,
    externalId: typeof row.externalId === 'string' ? row.externalId : undefined,
    currency: asCurrency(row.currency),
    currencyCode: typeof row.currencyCode === 'string' ? row.currencyCode : undefined,
    fundName: typeof row.fundName === 'string' ? row.fundName : undefined,
    startDate: typeof row.startDate === 'string' ? row.startDate : undefined,
    includeInBorrowerCycle:
      typeof row.includeInBorrowerCycle === 'boolean' ? row.includeInBorrowerCycle : undefined,
    digitsAfterDecimal:
      typeof row.digitsAfterDecimal === 'number' ? row.digitsAfterDecimal : undefined,
    inMultiplesOf: typeof row.inMultiplesOf === 'number' ? row.inMultiplesOf : undefined,
    principal: typeof row.principal === 'number' ? row.principal : undefined,
    minPrincipal: typeof row.minPrincipal === 'number' ? row.minPrincipal : undefined,
    maxPrincipal: typeof row.maxPrincipal === 'number' ? row.maxPrincipal : undefined,
    numberOfRepayments:
      typeof row.numberOfRepayments === 'number' ? row.numberOfRepayments : undefined,
    minNumberOfRepayments:
      typeof row.minNumberOfRepayments === 'number' ? row.minNumberOfRepayments : undefined,
    maxNumberOfRepayments:
      typeof row.maxNumberOfRepayments === 'number' ? row.maxNumberOfRepayments : undefined,
    repaymentEvery: typeof row.repaymentEvery === 'number' ? row.repaymentEvery : undefined,
    repaymentFrequencyType: asEnumOption(row.repaymentFrequencyType),
    interestRatePerPeriod:
      typeof row.interestRatePerPeriod === 'number' ? row.interestRatePerPeriod : undefined,
    minInterestRatePerPeriod:
      typeof row.minInterestRatePerPeriod === 'number' ? row.minInterestRatePerPeriod : undefined,
    maxInterestRatePerPeriod:
      typeof row.maxInterestRatePerPeriod === 'number' ? row.maxInterestRatePerPeriod : undefined,
    interestRateFrequencyType: asEnumOption(row.interestRateFrequencyType),
    annualInterestRate:
      typeof row.annualInterestRate === 'number' ? row.annualInterestRate : undefined,
    amortizationType: asEnumOption(row.amortizationType),
    interestType: asEnumOption(row.interestType),
    interestCalculationPeriodType: asEnumOption(row.interestCalculationPeriodType),
    transactionProcessingStrategyName:
      typeof row.transactionProcessingStrategyName === 'string'
        ? row.transactionProcessingStrategyName
        : undefined,
    transactionProcessingStrategyCode:
      typeof row.transactionProcessingStrategyCode === 'string'
        ? row.transactionProcessingStrategyCode
        : undefined,
    allowPartialPeriodInterestCalculation:
      typeof row.allowPartialPeriodInterestCalculation === 'boolean'
        ? row.allowPartialPeriodInterestCalculation
        : undefined,
    isEqualAmortization:
      typeof row.isEqualAmortization === 'boolean' ? row.isEqualAmortization : undefined,
    loanScheduleType: asEnumOption(row.loanScheduleType),
    loanScheduleProcessingType: asEnumOption(row.loanScheduleProcessingType),
    daysInMonthType: asEnumOption(row.daysInMonthType),
    daysInYearType: asEnumOption(row.daysInYearType),
    enableDownPayment:
      typeof row.enableDownPayment === 'boolean' ? row.enableDownPayment : undefined,
    isInterestRecalculationEnabled:
      typeof row.isInterestRecalculationEnabled === 'boolean'
        ? row.isInterestRecalculationEnabled
        : undefined,
    multiDisburseLoan:
      typeof row.multiDisburseLoan === 'boolean' ? row.multiDisburseLoan : undefined,
    canUseForTopup: typeof row.canUseForTopup === 'boolean' ? row.canUseForTopup : undefined,
    holdGuaranteeFunds:
      typeof row.holdGuaranteeFunds === 'boolean' ? row.holdGuaranteeFunds : undefined,
    graceOnPrincipalPayment:
      typeof row.graceOnPrincipalPayment === 'number' ? row.graceOnPrincipalPayment : undefined,
    graceOnInterestPayment:
      typeof row.graceOnInterestPayment === 'number' ? row.graceOnInterestPayment : undefined,
    inArrearsTolerance:
      typeof row.inArrearsTolerance === 'number' ? row.inArrearsTolerance : undefined,
    accountingRule: asEnumOption(row.accountingRule),
    enableAccrualActivityPosting:
      typeof row.enableAccrualActivityPosting === 'boolean'
        ? row.enableAccrualActivityPosting
        : undefined,
    accountingMappings: asAccountingMappings(row.accountingMappings),
    charges: asCharges(row.charges),
    paymentChannelToFundSourceMappings: asPaymentChannelMappings(
      row.paymentChannelToFundSourceMappings
    ),
    feeToIncomeAccountMappings: asChargeIncomeMappings(row.feeToIncomeAccountMappings),
    penaltyToIncomeAccountMappings: asChargeIncomeMappings(
      row.penaltyToIncomeAccountMappings
    )
  };
}

export async function listLoanProducts(kind: LoanProductKind): Promise<LoanProductListItem[]> {
  const fineract = await createFineractClient();
  const data = await fineract.get<unknown>(loanProductApiPath(kind));
  return normalizeFineractList(data, normalizeListItem);
}

export async function getLoanProduct(
  productId: string | number,
  kind: LoanProductKind
): Promise<LoanProductDetail> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`${loanProductApiPath(kind)}/${productId}`);
  const product = normalizeDetail(raw);
  if (!product) {
    throw new Error('Loan product not found.');
  }
  return product;
}

export async function getLoanProductTemplate(
  kind: LoanProductKind,
  options?: { currencyCode?: string }
): Promise<LoanProductTemplate> {
  const fineract = await createFineractClient();
  const params: Record<string, string> = {};
  const currencyCode = options?.currencyCode?.trim();
  if (currencyCode) {
    params.currencyCode = currencyCode;
  }
  const raw = await fineract.get<unknown>(`${loanProductApiPath(kind)}/template`, params);
  return normalizeLoanProductTemplate(raw);
}

export async function getLoanProductChargeOptions(
  kind: LoanProductKind,
  currencyCode: string
): Promise<FilteredProductChargeOptions> {
  const template = await getLoanProductTemplate(kind, { currencyCode });
  return filterProductChargeOptions(
    template.chargeOptions,
    template.penaltyOptions,
    currencyCode
  );
}

export async function getLoanProductForEdit(
  productId: string | number,
  kind: LoanProductKind
): Promise<LoanProductTemplate> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`${loanProductApiPath(kind)}/${productId}`, {
    template: 'true'
  });
  return normalizeLoanProductTemplate(raw);
}

export async function createLoanProductRecord(
  kind: LoanProductKind,
  payload: Record<string, unknown>
): Promise<LoanProductMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.post<LoanProductMutationResponse>(loanProductApiPath(kind), payload);
}

export async function updateLoanProductRecord(
  productId: string | number,
  kind: LoanProductKind,
  payload: Record<string, unknown>
): Promise<LoanProductMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.put<LoanProductMutationResponse>(
    `${loanProductApiPath(kind)}/${productId}`,
    payload
  );
}
