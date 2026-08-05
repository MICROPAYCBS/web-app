/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractCurrencyOption, FineractEnumOption } from './types';
import type { LoanProductAttributeOverrides } from '../products/loan-product-attribute-overrides';

export type ClientDepositAccountKind = 'savings' | 'fixedDeposit' | 'recurringDeposit';

export interface ClientDepositAccountProductOption {
  id: number;
  name: string;
}

export interface ClientDepositAccountFieldOfficerOption {
  id: number;
  displayName?: string;
  firstname?: string;
  lastname?: string;
}

export interface ClientDepositAccountTemplate {
  clientId?: number;
  clientName?: string;
  savingsProductId?: number;
  savingsProductName?: string;
  /** Product availability window (from product detail when selected). */
  startDate?: string;
  closeDate?: string;
  productOptions?: ClientDepositAccountProductOption[];
  fieldOfficerOptions?: ClientDepositAccountFieldOfficerOption[];
  termFrequencyTypeOptions?: FineractEnumOption[];
  periodFrequencyTypeOptions?: FineractEnumOption[];
  recurringFrequencyTypeOptions?: FineractEnumOption[];
  interestCompoundingPeriodTypeOptions?: FineractEnumOption[];
  interestPostingPeriodTypeOptions?: FineractEnumOption[];
  interestCalculationTypeOptions?: FineractEnumOption[];
  interestCalculationDaysInYearTypeOptions?: FineractEnumOption[];
  lockinPeriodFrequencyTypeOptions?: FineractEnumOption[];
  currency?: FineractCurrencyOption;
  nominalAnnualInterestRate?: number;
  interestCompoundingPeriodType?: FineractEnumOption;
  interestPostingPeriodType?: FineractEnumOption;
  interestCalculationType?: FineractEnumOption;
  interestCalculationDaysInYearType?: FineractEnumOption;
  minRequiredOpeningBalance?: number;
  withdrawalFeeForTransfers?: boolean;
  lockinPeriodFrequency?: number;
  lockinPeriodFrequencyType?: FineractEnumOption;
  allowOverdraft?: boolean;
  overdraftLimit?: number;
  minOverdraftForInterestCalculation?: number;
  nominalAnnualInterestRateOverdraft?: number;
  enforceMinRequiredBalance?: boolean;
  minRequiredBalance?: number;
  minDepositTerm?: number;
  maxDepositTerm?: number;
  minDepositTermType?: FineractEnumOption;
  maxDepositTermType?: FineractEnumOption;
  depositAmount?: number;
  mandatoryRecommendedDepositAmount?: number;
  recurringFrequency?: number;
  recurringFrequencyType?: FineractEnumOption;
}

export interface CreateClientDepositAccountResponse {
  officeId?: number;
  clientId?: number;
  savingsId?: number;
  resourceId?: number;
}

export interface ClientLoanAccountProductOption {
  id: number;
  name: string;
}

export interface ClientLoanAccountFundOption {
  id: number;
  name: string;
}

export interface ClientLoanAccountPurposeOption {
  id: number;
  name: string;
}

export interface ClientLoanCollateralOption {
  collateralId: number;
  name?: string;
  description?: string;
  value?: number;
  pctToBase?: number;
}

/** Charge row from loan application / product template APIs. */
export interface ClientLoanAccountChargeOption {
  id?: number;
  chargeId?: number;
  name?: string;
  amount?: number;
  amountOrPercentage?: number;
  percentage?: number;
  penalty?: boolean;
  currency?: FineractCurrencyOption;
  chargeCalculationType?: FineractEnumOption;
  chargeTimeType?: FineractEnumOption;
  chargePaymentMode?: FineractEnumOption;
  minCap?: number;
  maxCap?: number;
}

export interface ClientLoanAccountTemplate {
  clientId?: number;
  clientName?: string;
  productOptions?: ClientLoanAccountProductOption[];
  loanOfficerOptions?: ClientDepositAccountFieldOfficerOption[];
  fundOptions?: ClientLoanAccountFundOption[];
  loanPurposeOptions?: ClientLoanAccountPurposeOption[];
  loanCollateralOptions?: ClientLoanCollateralOption[];
  accountLinkingOptions?: Array<{ id: number; accountNo?: string }>;
  amortizationTypeOptions?: FineractEnumOption[];
  interestTypeOptions?: FineractEnumOption[];
  interestCalculationPeriodTypeOptions?: FineractEnumOption[];
  termFrequencyTypeOptions?: FineractEnumOption[];
  repaymentFrequencyTypeOptions?: FineractEnumOption[];
  transactionProcessingStrategyOptions?: Array<{ code?: string; name?: string }>;
  currency?: FineractCurrencyOption;
  principal?: number;
  minPrincipal?: number;
  maxPrincipal?: number;
  loanTermFrequency?: number;
  loanTermFrequencyType?: FineractEnumOption;
  numberOfRepayments?: number;
  minNumberOfRepayments?: number;
  maxNumberOfRepayments?: number;
  repaymentEvery?: number;
  repaymentFrequencyType?: FineractEnumOption;
  interestRatePerPeriod?: number;
  minInterestRatePerPeriod?: number;
  maxInterestRatePerPeriod?: number;
  interestRateFrequencyType?: FineractEnumOption;
  amortizationType?: FineractEnumOption;
  interestType?: FineractEnumOption;
  interestCalculationPeriodType?: FineractEnumOption;
  transactionProcessingStrategyCode?: string;
  transactionProcessingStrategyName?: string;
  allowAttributeOverrides?: LoanProductAttributeOverrides;
  linkedToFloatingInterestRates?: boolean;
  isLoanProductLinkedToFloatingRate?: boolean;
  minInterestRateDifferential?: number;
  maxInterestRateDifferential?: number;
  defaultDifferentialLendingRate?: number;
  multiDisburseLoan?: boolean;
  disallowExpectedDisbursements?: boolean;
  maxTrancheCount?: number;
  canUseForTopup?: boolean;
  canDefineInstallmentAmount?: boolean;
  isInterestRecalculationEnabled?: boolean;
  loanScheduleType?: FineractEnumOption;
  enableDownPayment?: boolean;
  product?: { id?: number; name?: string };
  chargeOptions?: ClientLoanAccountChargeOption[];
  charges?: ClientLoanAccountChargeOption[];
  overdueCharges?: ClientLoanAccountChargeOption[];
}

export interface CreateClientLoanAccountResponse {
  officeId?: number;
  clientId?: number;
  loanId?: number;
  resourceId?: number;
}
