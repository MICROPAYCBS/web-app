/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractCurrencyOption, FineractEnumOption } from '../clients/types';
import type { LoanProductAttributeOverrides } from './loan-product-attribute-overrides';

export type LoanProductKind = 'loan' | 'working-capital';

export interface ProductGlAccountRef {
  id?: number;
  name?: string;
  glCode?: string;
}

export interface LoanProductCharge {
  id?: number;
  name?: string;
  amount?: number;
  penalty?: boolean;
  chargeCalculationType?: FineractEnumOption;
  chargeTimeType?: FineractEnumOption;
  currency?: FineractCurrencyOption;
}

export interface PaymentChannelFundSourceMapping {
  paymentType?: { id?: number; name?: string };
  fundSourceAccount?: ProductGlAccountRef;
}

export interface ChargeIncomeAccountMapping {
  charge?: { id?: number; name?: string };
  incomeAccount?: ProductGlAccountRef;
}

export interface LoanProductListItem {
  id: number;
  name?: string;
  shortName?: string;
  closeDate?: string;
  status?: string;
  currencyCode?: string;
  accountingRule?: FineractEnumOption;
}

export interface LoanProductDetail extends LoanProductListItem {
  description?: string;
  externalId?: string;
  currency?: FineractCurrencyOption;
  currencyCode?: string;
  fundName?: string;
  startDate?: string;
  includeInBorrowerCycle?: boolean;
  digitsAfterDecimal?: number;
  inMultiplesOf?: number;
  principal?: number;
  minPrincipal?: number;
  maxPrincipal?: number;
  numberOfRepayments?: number;
  minNumberOfRepayments?: number;
  maxNumberOfRepayments?: number;
  repaymentEvery?: number;
  repaymentFrequencyType?: FineractEnumOption;
  interestRatePerPeriod?: number;
  minInterestRatePerPeriod?: number;
  maxInterestRatePerPeriod?: number;
  interestRateFrequencyType?: FineractEnumOption;
  annualInterestRate?: number;
  amortizationType?: FineractEnumOption;
  interestType?: FineractEnumOption;
  interestCalculationPeriodType?: FineractEnumOption;
  transactionProcessingStrategyName?: string;
  transactionProcessingStrategyCode?: string;
  allowPartialPeriodInterestCalculation?: boolean;
  isEqualAmortization?: boolean;
  loanScheduleType?: FineractEnumOption;
  loanScheduleProcessingType?: FineractEnumOption;
  daysInMonthType?: FineractEnumOption;
  daysInYearType?: FineractEnumOption;
  enableDownPayment?: boolean;
  isInterestRecalculationEnabled?: boolean;
  multiDisburseLoan?: boolean;
  canUseForTopup?: boolean;
  holdGuaranteeFunds?: boolean;
  graceOnPrincipalPayment?: number;
  graceOnInterestPayment?: number;
  inArrearsTolerance?: number;
  allowAttributeOverrides?: LoanProductAttributeOverrides;
  accountingRule?: FineractEnumOption;
  enableAccrualActivityPosting?: boolean;
  accountingMappings?: Record<string, ProductGlAccountRef | undefined>;
  charges?: LoanProductCharge[];
  paymentChannelToFundSourceMappings?: PaymentChannelFundSourceMapping[];
  feeToIncomeAccountMappings?: ChargeIncomeAccountMapping[];
  penaltyToIncomeAccountMappings?: ChargeIncomeAccountMapping[];
}

export type LoanProductSectionId =
  | 'general'
  | 'terms'
  | 'settings'
  | 'overrideables'
  | 'fees'
  | 'penalties'
  | 'accounting'
  | 'mappings';
