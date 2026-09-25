/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractClientAccountStatus,
  FineractCurrencyOption,
  FineractEnumOption,
  LoanScheduleData
} from '@mifos/api-client';

export interface FineractLoanAccountSummary {
  totalPrincipal?: number;
  principalAdjustments?: number;
  principalPaid?: number;
  principalWaived?: number;
  principalWrittenOff?: number;
  principalOutstanding?: number;
  principalOverdue?: number;
  interestCharged?: number;
  interestPaid?: number;
  interestWaived?: number;
  interestWrittenOff?: number;
  interestOutstanding?: number;
  interestOverdue?: number;
  feeChargesCharged?: number;
  feeChargesPaid?: number;
  feeChargesWaived?: number;
  feeChargesWrittenOff?: number;
  feeChargesOutstanding?: number;
  feeChargesOverdue?: number;
  penaltyChargesCharged?: number;
  penaltyChargesPaid?: number;
  penaltyChargesWaived?: number;
  penaltyChargesWrittenOff?: number;
  penaltyChargesOutstanding?: number;
  penaltyChargesOverdue?: number;
  totalExpectedRepayment?: number;
  totalRepayment?: number;
  totalWaived?: number;
  totalWrittenOff?: number;
  totalOutstanding?: number;
  totalOverdue?: number;
  overdueSinceDate?: number[] | string;
}

export interface FineractLoanAccountTimeline {
  submittedOnDate?: number[] | string;
  submittedByUsername?: string;
  submittedByFirstname?: string;
  submittedByLastname?: string;
  approvedOnDate?: number[] | string;
  approvedByUsername?: string;
  approvedByFirstname?: string;
  approvedByLastname?: string;
  expectedDisbursementDate?: number[] | string;
  actualDisbursementDate?: number[] | string;
  disbursedByUsername?: string;
  disbursedByFirstname?: string;
  disbursedByLastname?: string;
  expectedMaturityDate?: number[] | string;
  closedOnDate?: number[] | string;
  closedByUsername?: string;
  closedByFirstname?: string;
  closedByLastname?: string;
}

export interface FineractLoanAccountTransaction {
  id: number;
  externalId?: string;
  officeName?: string;
  type?: FineractEnumOption;
  date?: number[] | string;
  submittedOnDate?: number[] | string;
  createdDate?: number[] | string;
  amount: number;
  outstandingLoanBalance?: number;
  manuallyReversed?: boolean;
  reversed?: boolean;
  note?: string;
  currency?: FineractCurrencyOption;
  paymentDetailData?: {
    paymentType?: { id?: number; name?: string };
    accountNumber?: string;
    checkNumber?: string;
    routingCode?: string;
    receiptNumber?: string;
    bankNumber?: string;
  };
  submittedByUsername?: string;
}

export interface FineractLoanAccountCharge {
  id: number;
  chargeId?: number;
  name: string;
  chargeTimeType?: FineractEnumOption;
  dueDate?: number[] | string;
  amount?: number;
  amountPaid?: number;
  amountWaived?: number;
  amountWrittenOff?: number;
  amountOutstanding?: number;
  chargeCalculationType?: FineractEnumOption;
  penalty?: boolean;
  paid?: boolean;
  waived?: boolean;
}

export interface FineractLoanAccountDelinquent {
  pastDueDays?: number;
  delinquentDays?: number;
  installmentLevelDelinquency?: FineractLoanInstallmentDelinquency[];
}

export interface FineractLoanInstallmentDelinquency {
  classification?: string;
  minimumAgeDays?: number;
  amount?: number;
}

export interface FineractLoanOverdueCharge {
  id: number;
  name: string;
  penalty?: boolean;
  chargeTimeType?: FineractEnumOption;
  chargeCalculationType?: FineractEnumOption;
  amount?: number;
}

export interface FineractLoanTermVariation {
  id?: number;
  termType?: FineractEnumOption;
  termVariationApplicableFrom?: number[] | string;
  dateValue?: number[] | string;
  decimalValue?: number;
  isSpecificToInstallment?: boolean;
}

export interface FineractLoanPledgedCollateral {
  id?: number;
  clientCollateralId?: number;
  quantity?: number;
  total?: number;
  totalCollateral?: number;
}

export interface LoanCollateralRecord {
  id: number;
  typeName?: string;
  description?: string;
  value?: number;
  currencyCode?: string;
}

export interface LoanCollateralTypeOption {
  id: number;
  name: string;
}

export interface LoanGuarantorRecord {
  id: number;
  guarantorTypeId?: number;
  guarantorTypeName?: string;
  entityId?: number;
  firstname?: string;
  lastname?: string;
  displayName?: string;
  status?: string;
}

export interface LoanGuarantorTypeOption {
  id: number;
  value: string;
}

export interface LoanInterestPauseRecord {
  id: number;
  startDate?: number[] | string;
  endDate?: number[] | string;
}

export interface LoanDelinquencyTagRecord {
  id: number;
  classification?: string;
  addedOnDate?: number[] | string;
  liftedOnDate?: number[] | string;
}

export interface LoanDelinquencyActionRecord {
  id: number;
  action?: string;
  startDate?: number[] | string;
  endDate?: number[] | string;
  createdOn?: number[] | string;
}

export interface FineractLoanAccountLinkedAccount {
  id: number;
  accountNo?: string;
  productName?: string;
}

export interface FineractLoanAccountDisbursementDetail {
  id?: number;
  expectedDisbursementDate?: number[] | string;
  actualDisbursementDate?: number[] | string;
  principal?: number;
  netDisbursalAmount?: number;
  note?: string;
}

export interface FineractLoanAccountDetail {
  id: number;
  accountNo: string;
  externalId?: string;
  clientId?: number;
  clientName?: string;
  loanProductId?: number;
  loanProductName?: string;
  productName?: string;
  loanType?: FineractEnumOption;
  status: FineractClientAccountStatus;
  currency: FineractCurrencyOption;
  officeName?: string;
  loanOfficerId?: number;
  loanOfficerName?: string;
  loanPurposeName?: string;
  writeOffReason?: string;
  transactionProcessingStrategyName?: string;
  proposedPrincipal?: number;
  approvedPrincipal?: number;
  principal?: number;
  netDisbursalAmount?: number;
  loanTermFrequency?: number;
  loanTermFrequencyType?: FineractEnumOption;
  numberOfRepayments?: number;
  repaymentEvery?: number;
  repaymentFrequencyType?: FineractEnumOption;
  amortizationType?: FineractEnumOption;
  interestType?: FineractEnumOption;
  interestRatePerPeriod?: number;
  interestRateFrequencyType?: FineractEnumOption;
  interestCalculationPeriodType?: FineractEnumOption;
  annualInterestRate?: number;
  interestRateDifferential?: number;
  isFloatingInterestRate?: boolean;
  isInterestRecalculationEnabled?: boolean;
  daysInMonthType?: FineractEnumOption;
  daysInYearType?: FineractEnumOption;
  inArrearsTolerance?: number;
  fixedEmiAmount?: number;
  fundName?: string;
  isNPA?: boolean;
  expectedFirstRepaymentOnDate?: number[] | string;
  interestChargedFromDate?: number[] | string;
  graceOnPrincipalPayment?: number;
  graceOnInterestPayment?: number;
  graceOnInterestCharged?: number;
  graceOnArrearsAgeing?: number;
  inArrears?: boolean;
  chargedOff?: boolean;
  isVariableInstallmentsAllowed?: boolean;
  minimumGap?: number;
  maximumGap?: number;
  totalOverpaid?: number;
  summary?: FineractLoanAccountSummary;
  timeline?: FineractLoanAccountTimeline;
  repaymentSchedule?: LoanScheduleData | null;
  transactions?: FineractLoanAccountTransaction[];
  charges?: FineractLoanAccountCharge[];
  delinquent?: FineractLoanAccountDelinquent;
  delinquencyRange?: { classification?: string };
  linkedAccount?: FineractLoanAccountLinkedAccount;
  linkAccountId?: number;
  createStandingInstructionAtDisbursement: boolean;
  disbursementDetails?: FineractLoanAccountDisbursementDetail[];
  multiDisburseLoan?: boolean;
  overdueCharges?: FineractLoanOverdueCharge[];
  loanTermVariations?: FineractLoanTermVariation[];
  originalSchedule?: LoanScheduleData | null;
  collateral?: FineractLoanPledgedCollateral[];
}

export interface LoanAccountSummaryMatrixRow {
  property: string;
  original?: number;
  adjustment?: number;
  paid?: number;
  waived?: number;
  writtenOff?: number;
  outstanding?: number;
  overdue?: number;
}

export interface LoanAccountChargeTemplateOption {
  id: number;
  name: string;
  amount?: number;
  amountOrPercentage?: number;
  percentage?: number;
  currencyCode?: string;
  chargeCalculationType?: { id: number; value?: string; code?: string };
  chargeTimeType?: { id: number; value?: string; code?: string };
}
