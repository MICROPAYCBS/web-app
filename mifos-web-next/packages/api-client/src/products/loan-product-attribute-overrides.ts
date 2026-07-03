/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Fields loan officers may override when opening a loan account. */
export interface LoanProductLoanAttributeOverrides {
  amortizationType?: boolean;
  interestType?: boolean;
  transactionProcessingStrategyCode?: boolean;
  interestCalculationPeriodType?: boolean;
  inArrearsTolerance?: boolean;
  repaymentEvery?: boolean;
  graceOnPrincipalAndInterestPayment?: boolean;
  graceOnArrearsAgeing?: boolean;
}

/** Fields loan officers may override for working capital products. */
export interface LoanProductWorkingCapitalAttributeOverrides {
  delinquencyBucketClassification?: boolean;
  discountDefault?: boolean;
  periodPaymentFrequency?: boolean;
  periodPaymentFrequencyType?: boolean;
  breach?: boolean;
}

export type LoanProductAttributeOverrides = LoanProductLoanAttributeOverrides &
  LoanProductWorkingCapitalAttributeOverrides;
