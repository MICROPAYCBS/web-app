/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractCurrencyOption, FineractEnumOption } from '../clients/types';
import type { ProductGlAccountRef } from './loan-product-types';
import type { LoanProductAccountingMappingOptions } from './loan-product-template-types';
import type { DepositProductInterestChart } from './deposit-product-types';

export interface DepositProductChartTemplate {
  periodTypes?: FineractEnumOption[];
  entityTypeOptions?: FineractEnumOption[];
  attributeNameOptions?: FineractEnumOption[];
  conditionTypeOptions?: FineractEnumOption[];
  genderOptions?: FineractEnumOption[];
  clientTypeOptions?: FineractEnumOption[];
  clientClassificationOptions?: FineractEnumOption[];
  incentiveTypeOptions?: FineractEnumOption[];
}

export interface DepositProductTemplate {
  id?: number;
  name?: string;
  shortName?: string;
  description?: string;
  currency?: FineractCurrencyOption;
  currencyOptions?: FineractCurrencyOption[];
  currencyCode?: string;
  digitsAfterDecimal?: number;
  inMultiplesOf?: number;
  minDepositAmount?: number;
  depositAmount?: number;
  maxDepositAmount?: number;
  interestCompoundingPeriodType?: FineractEnumOption;
  interestCompoundingPeriodTypeOptions?: FineractEnumOption[];
  interestPostingPeriodType?: FineractEnumOption;
  interestPostingPeriodTypeOptions?: FineractEnumOption[];
  interestCalculationType?: FineractEnumOption;
  interestCalculationTypeOptions?: FineractEnumOption[];
  interestCalculationDaysInYearType?: FineractEnumOption;
  interestCalculationDaysInYearTypeOptions?: FineractEnumOption[];
  isMandatoryDeposit?: boolean;
  adjustAdvanceTowardsFuturePayments?: boolean;
  allowWithdrawal?: boolean;
  lockinPeriodFrequency?: number;
  lockinPeriodFrequencyType?: FineractEnumOption;
  lockinPeriodFrequencyTypeOptions?: FineractEnumOption[];
  periodFrequencyTypeOptions?: FineractEnumOption[];
  minDepositTerm?: number;
  minDepositTermType?: FineractEnumOption;
  inMultiplesOfDepositTerm?: number;
  inMultiplesOfDepositTermType?: FineractEnumOption;
  maxDepositTerm?: number;
  maxDepositTermType?: FineractEnumOption;
  preClosurePenalApplicable?: boolean;
  preClosurePenalInterest?: number;
  preClosurePenalInterestOnType?: FineractEnumOption;
  preClosurePenalInterestOnTypeOptions?: FineractEnumOption[];
  withHoldTax?: boolean;
  taxGroup?: FineractEnumOption;
  taxGroupOptions?: FineractEnumOption[];
  chartTemplate?: DepositProductChartTemplate;
  activeChart?: DepositProductInterestChart | DepositProductInterestChart[];
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
  [key: string]: unknown;
}
