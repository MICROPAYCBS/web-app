/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractCurrencyOption, FineractEnumOption } from '../clients/types';
import type {
  ChargeIncomeAccountMapping,
  LoanProductCharge,
  PaymentChannelFundSourceMapping,
  ProductGlAccountRef
} from './loan-product-types';

export type DepositProductKind = 'recurring' | 'fixed';

export interface DepositProductListItem {
  id: number;
  name?: string;
  shortName?: string;
  closeDate?: string;
  status?: string;
  currencyCode?: string;
  accountingRule?: FineractEnumOption;
}

export interface DepositProductInterestChartIncentive {
  entityType?: FineractEnumOption;
  attributeName?: FineractEnumOption;
  conditionType?: FineractEnumOption;
  attributeValue?: string;
  incentiveType?: FineractEnumOption;
  amount?: number;
}

export interface DepositProductInterestChartSlab {
  id?: number;
  periodType?: FineractEnumOption;
  fromPeriod?: number;
  toPeriod?: number;
  amountRangeFrom?: number;
  amountRangeTo?: number;
  annualInterestRate?: number;
  description?: string;
  incentives?: DepositProductInterestChartIncentive[];
}

export interface DepositProductInterestChart {
  id?: number;
  name?: string;
  description?: string;
  fromDate?: string;
  endDate?: string;
  isPrimaryGroupingByAmount?: boolean;
  chartSlabs?: DepositProductInterestChartSlab[];
}

export interface DepositProductDetail extends DepositProductListItem {
  description?: string;
  startDate?: string;
  currency?: FineractCurrencyOption;
  minDepositAmount?: number;
  depositAmount?: number;
  maxDepositAmount?: number;
  interestCompoundingPeriodType?: FineractEnumOption;
  interestPostingPeriodType?: FineractEnumOption;
  interestCalculationType?: FineractEnumOption;
  interestCalculationDaysInYearType?: FineractEnumOption;
  isMandatoryDeposit?: boolean;
  adjustAdvanceTowardsFuturePayments?: boolean;
  allowWithdrawal?: boolean;
  lockinPeriodFrequency?: number;
  lockinPeriodFrequencyType?: FineractEnumOption;
  minDepositTerm?: number;
  minDepositTermType?: FineractEnumOption;
  inMultiplesOfDepositTerm?: number;
  inMultiplesOfDepositTermType?: FineractEnumOption;
  maxDepositTerm?: number;
  maxDepositTermType?: FineractEnumOption;
  preClosurePenalApplicable?: boolean;
  preClosurePenalInterest?: number;
  preClosurePenalInterestOnType?: FineractEnumOption;
  withHoldTax?: boolean;
  taxGroup?: FineractEnumOption;
  /** All interest rate charts on the product (when returned by GET). */
  interestRateCharts?: DepositProductInterestChart[];
  /** Active chart derived by the API from interestRateCharts. */
  activeChart?: DepositProductInterestChart | DepositProductInterestChart[];
  accountingRule?: FineractEnumOption;
  accountingMappings?: Record<string, ProductGlAccountRef | undefined>;
  charges?: LoanProductCharge[];
  feeToIncomeAccountMappings?: ChargeIncomeAccountMapping[];
  penaltyToIncomeAccountMappings?: ChargeIncomeAccountMapping[];
  paymentChannelToFundSourceMappings?: PaymentChannelFundSourceMapping[];
}

export type DepositProductSectionId =
  | 'general'
  | 'terms'
  | 'chart'
  | 'fees'
  | 'accounting'
  | 'channelMapping'
  | 'feeGlMappings'
  | 'penaltyGlMappings';

export interface DepositProductMutationResponse {
  resourceId: number;
}
