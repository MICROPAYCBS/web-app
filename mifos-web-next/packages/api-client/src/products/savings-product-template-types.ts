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

export interface SavingsProductTemplate {
  id?: number;
  name?: string;
  shortName?: string;
  description?: string;
  currency?: FineractCurrencyOption;
  currencyOptions?: FineractCurrencyOption[];
  currencyCode?: string;
  digitsAfterDecimal?: number;
  inMultiplesOf?: number;
  nominalAnnualInterestRate?: number;
  interestCompoundingPeriodType?: FineractEnumOption;
  interestCompoundingPeriodTypeOptions?: FineractEnumOption[];
  interestPostingPeriodType?: FineractEnumOption;
  interestPostingPeriodTypeOptions?: FineractEnumOption[];
  interestCalculationType?: FineractEnumOption;
  interestCalculationTypeOptions?: FineractEnumOption[];
  interestCalculationDaysInYearType?: FineractEnumOption;
  interestCalculationDaysInYearTypeOptions?: FineractEnumOption[];
  minRequiredOpeningBalance?: number;
  lockinPeriodFrequency?: number;
  lockinPeriodFrequencyType?: FineractEnumOption;
  lockinPeriodFrequencyTypeOptions?: FineractEnumOption[];
  withdrawalFeeForTransfers?: boolean;
  minBalanceForInterestCalculation?: number;
  enforceMinRequiredBalance?: boolean;
  minRequiredBalance?: number;
  allowOverdraft?: boolean;
  minOverdraftForInterestCalculation?: number;
  nominalAnnualInterestRateOverdraft?: number;
  overdraftLimit?: number;
  withHoldTax?: boolean;
  taxGroup?: FineractEnumOption;
  taxGroupOptions?: FineractEnumOption[];
  isDormancyTrackingActive?: boolean;
  daysToInactive?: number;
  daysToDormancy?: number;
  daysToEscheat?: number;
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

export interface SavingsProductMutationResponse {
  resourceId: number;
}
