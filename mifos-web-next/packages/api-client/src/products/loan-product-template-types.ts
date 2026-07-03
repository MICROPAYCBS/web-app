/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractCurrencyOption, FineractEnumOption } from '../clients/types';
import type { LoanProductAttributeOverrides } from './loan-product-attribute-overrides';
import type { ProductGlAccountRef } from './loan-product-types';

export interface FineractCodeNameOption {
  id?: number;
  name?: string;
  code?: string;
}

export interface LoanProductGlAccountOption extends ProductGlAccountRef {
  disabled?: boolean;
}

export interface LoanProductAccountingMappingOptions {
  assetAccountOptions?: LoanProductGlAccountOption[];
  incomeAccountOptions?: LoanProductGlAccountOption[];
  expenseAccountOptions?: LoanProductGlAccountOption[];
  liabilityAccountOptions?: LoanProductGlAccountOption[];
}

export interface LoanProductTemplate {
  id?: number;
  name?: string;
  shortName?: string;
  description?: string;
  externalId?: string;
  fundId?: number;
  fundOptions?: FineractEnumOption[];
  currency?: FineractCurrencyOption;
  currencyOptions?: FineractCurrencyOption[];
  currencyCode?: string;
  digitsAfterDecimal?: number;
  inMultiplesOf?: number;
  installmentAmountInMultiplesOf?: number;
  includeInBorrowerCycle?: boolean;
  startDate?: string;
  closeDate?: string;
  principal?: number;
  minPrincipal?: number;
  maxPrincipal?: number;
  numberOfRepayments?: number;
  minNumberOfRepayments?: number;
  maxNumberOfRepayments?: number;
  repaymentEvery?: number;
  repaymentFrequencyType?: FineractEnumOption;
  repaymentFrequencyTypeOptions?: FineractEnumOption[];
  interestRatePerPeriod?: number;
  minInterestRatePerPeriod?: number;
  maxInterestRatePerPeriod?: number;
  interestRateFrequencyType?: FineractEnumOption;
  interestRateFrequencyTypeOptions?: FineractEnumOption[];
  isLinkedToFloatingInterestRates?: boolean;
  floatingRateOptions?: FineractEnumOption[];
  amortizationType?: FineractEnumOption;
  amortizationTypeOptions?: FineractEnumOption[];
  interestType?: FineractEnumOption;
  interestTypeOptions?: FineractEnumOption[];
  interestCalculationPeriodType?: FineractEnumOption;
  interestCalculationPeriodTypeOptions?: FineractEnumOption[];
  transactionProcessingStrategyCode?: string;
  transactionProcessingStrategyOptions?: FineractCodeNameOption[];
  daysInYearType?: FineractEnumOption;
  daysInYearTypeOptions?: FineractEnumOption[];
  daysInMonthType?: FineractEnumOption;
  daysInMonthTypeOptions?: FineractEnumOption[];
  loanScheduleType?: FineractEnumOption;
  loanScheduleTypeOptions?: FineractEnumOption[];
  loanScheduleProcessingType?: FineractEnumOption;
  loanScheduleProcessingTypeOptions?: FineractEnumOption[];
  repaymentStartDateType?: FineractEnumOption;
  repaymentStartDateTypeOptions?: FineractEnumOption[];
  delinquencyBucketOptions?: FineractEnumOption[];
  chargeOptions?: FineractEnumOption[];
  penaltyOptions?: FineractEnumOption[];
  paymentTypeOptions?: FineractEnumOption[];
  accountingRule?: FineractEnumOption;
  accountingRuleOptions?: FineractEnumOption[];
  accountingMappingOptions?: LoanProductAccountingMappingOptions;
  accountingMappings?: Record<string, ProductGlAccountRef | undefined>;
  charges?: { id: number; name?: string; penalty?: boolean }[];
  paymentChannelToFundSourceMappings?: unknown[];
  feeToIncomeAccountMappings?: unknown[];
  penaltyToIncomeAccountMappings?: unknown[];
  allowAttributeOverrides?: LoanProductAttributeOverrides;
  dueDaysForRepaymentEvent?: number;
  overDueDaysForRepaymentEvent?: number;
  [key: string]: unknown;
}

export interface LoanProductMutationResponse {
  resourceId: number;
}
